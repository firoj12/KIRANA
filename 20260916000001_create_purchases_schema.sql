-- Migration: 20260916000001_create_purchases_schema.sql
-- Description: Create suppliers, purchases tables, sequences, RLS policies, and atomic create_purchase RPC

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    gstin TEXT,
    address TEXT,
    outstanding_balance NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    bill_no TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    supplier_name TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    payment_status TEXT NOT NULL DEFAULT 'paid',
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Restricted to user_id = auth.uid()
DROP POLICY IF EXISTS "Users can manage their own suppliers" ON public.suppliers;
CREATE POLICY "Users can manage their own suppliers"
    ON public.suppliers
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own purchases" ON public.purchases;
CREATE POLICY "Users can manage their own purchases"
    ON public.purchases
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 5. Daily Purchase Bill Sequence & Generator
CREATE SEQUENCE IF NOT EXISTS public.purchase_bill_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_purchase_bill_no()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_date TEXT;
    v_seq_num BIGINT;
    v_bill TEXT;
BEGIN
    v_date := to_char(now(), 'YYYYMMDD');
    v_seq_num := nextval('public.purchase_bill_seq');
    v_bill := 'PB-' || v_date || '-' || lpad(v_seq_num::text, 4, '0');
    RETURN v_bill;
END;
$$;

-- 6. Atomic RPC Function: create_purchase
-- Accepts: supplier_id, bill_no, items jsonb, amount_paid, purchase_date, payment_method, notes
-- For each item: fetch product FOR UPDATE, increment products.stock, update products.purchase_price to latest cost
-- If amount_paid < total: add (total - amount_paid) to suppliers.outstanding_balance
-- Wrap in a single transaction. Reject if any product not found.
CREATE OR REPLACE FUNCTION public.create_purchase(
    supplier_id UUID,
    bill_no TEXT DEFAULT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    amount_paid NUMERIC DEFAULT NULL,
    purchase_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_supplier RECORD;
    v_item JSONB;
    v_product_id UUID;
    v_quantity NUMERIC;
    v_cost_per_unit NUMERIC;
    v_product RECORD;
    v_line_total NUMERIC;
    v_total_amount NUMERIC := 0;
    v_amount_paid NUMERIC;
    v_payment_status TEXT;
    v_bill_no TEXT;
    v_purchase_id UUID;
    v_items_array JSONB := '[]'::jsonb;
    v_enriched_item JSONB;
    v_unpaid_amount NUMERIC := 0;
BEGIN
    -- Get current authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    END IF;

    -- Validate items input
    IF items IS NULL OR jsonb_array_length(items) = 0 THEN
        RAISE EXCEPTION 'Cannot record purchase without items';
    END IF;

    -- Fetch and validate supplier
    SELECT * INTO v_supplier
    FROM public.suppliers
    WHERE id = supplier_id AND (v_user_id IS NULL OR user_id = v_user_id)
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Supplier with ID % not found or access denied', supplier_id;
    END IF;

    -- 1. Loop through each item: lock product, increment stock, update purchase_price
    FOR v_item IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::NUMERIC;
        v_cost_per_unit := (v_item->>'cost_per_unit')::NUMERIC;

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity % for item', v_quantity;
        END IF;

        IF v_cost_per_unit < 0 THEN
            RAISE EXCEPTION 'Invalid cost % for item', v_cost_per_unit;
        END IF;

        -- Lock product row atomically FOR UPDATE
        SELECT * INTO v_product
        FROM public.products
        WHERE id = v_product_id AND (v_user_id IS NULL OR user_id = v_user_id)
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found in inventory', v_product_id;
        END IF;

        -- Increment products.stock and update purchase_price to latest acquisition cost
        UPDATE public.products
        SET stock = stock + v_quantity,
            purchase_price = v_cost_per_unit,
            updated_at = now()
        WHERE id = v_product_id;

        v_line_total := round(v_quantity * v_cost_per_unit, 2);
        v_total_amount := v_total_amount + v_line_total;

        -- Enrich item object
        v_enriched_item := jsonb_build_object(
            'product_id', v_product_id,
            'name', v_product.name,
            'unit', v_product.unit,
            'quantity', v_quantity,
            'cost_per_unit', v_cost_per_unit,
            'line_total', v_line_total
        );
        v_items_array := v_items_array || v_enriched_item;
    END LOOP;

    -- 2. Determine amount paid & payment status
    IF amount_paid IS NULL THEN
        IF lower(payment_method) = 'credit' THEN
            v_amount_paid := 0;
        ELSE
            v_amount_paid := v_total_amount;
        END IF;
    ELSE
        v_amount_paid := round(amount_paid, 2);
    END IF;

    IF v_amount_paid >= v_total_amount THEN
        v_payment_status := 'paid';
    ELSIF v_amount_paid > 0 THEN
        v_payment_status := 'partial';
    ELSE
        v_payment_status := 'unpaid';
    END IF;

    -- 3. Determine or generate bill number
    IF bill_no IS NOT NULL AND trim(bill_no) <> '' THEN
        v_bill_no := trim(bill_no);
    ELSE
        v_bill_no := public.generate_purchase_bill_no();
    END IF;

    -- 4. Update supplier outstanding balance if unpaid amount exists
    IF v_amount_paid < v_total_amount THEN
        v_unpaid_amount := v_total_amount - v_amount_paid;
        UPDATE public.suppliers
        SET outstanding_balance = outstanding_balance + v_unpaid_amount,
            updated_at = now()
        WHERE id = supplier_id;
    END IF;

    -- 5. Insert purchase record
    INSERT INTO public.purchases (
        user_id,
        bill_no,
        supplier_id,
        supplier_name,
        items,
        total_amount,
        amount_paid,
        payment_method,
        payment_status,
        purchase_date,
        notes
    ) VALUES (
        v_user_id,
        v_bill_no,
        supplier_id,
        v_supplier.name,
        v_items_array,
        v_total_amount,
        v_amount_paid,
        payment_method,
        v_payment_status,
        COALESCE(purchase_date, CURRENT_DATE),
        notes
    )
    RETURNING id INTO v_purchase_id;

    -- 6. Return response
    RETURN jsonb_build_object(
        'success', true,
        'purchase_id', v_purchase_id,
        'bill_no', v_bill_no,
        'total_amount', v_total_amount,
        'amount_paid', v_amount_paid,
        'payment_status', v_payment_status,
        'supplier_name', v_supplier.name,
        'items_count', jsonb_array_length(v_items_array),
        'unpaid_balance_added', v_unpaid_amount
    );
END;
$$;

-- 7. Supplier Payment Recording RPC
CREATE OR REPLACE FUNCTION public.record_supplier_payment(
    p_supplier_id UUID,
    p_amount NUMERIC,
    p_payment_method TEXT DEFAULT 'cash',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_supplier RECORD;
    v_new_balance NUMERIC;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero';
    END IF;

    SELECT * INTO v_supplier
    FROM public.suppliers
    WHERE id = p_supplier_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Supplier not found';
    END IF;

    v_new_balance := greatest(0, v_supplier.outstanding_balance - p_amount);

    UPDATE public.suppliers
    SET outstanding_balance = v_new_balance,
        updated_at = now()
    WHERE id = p_supplier_id;

    RETURN jsonb_build_object(
        'success', true,
        'supplier_id', p_supplier_id,
        'amount_paid', p_amount,
        'new_balance', v_new_balance,
        'payment_method', p_payment_method,
        'notes', p_notes
    );
END;
$$;
