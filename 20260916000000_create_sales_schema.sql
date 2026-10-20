-- Migration: 20260916000000_create_sales_schema.sql
-- Description: Create products, customers, sales tables, RLS policies, invoice sequence, and create_sale RPC function

-- 1. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    brand TEXT,
    barcode TEXT,
    category TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'packet',
    purchase_price NUMERIC NOT NULL DEFAULT 0,
    selling_price NUMERIC NOT NULL DEFAULT 0,
    stock NUMERIC NOT NULL DEFAULT 0,
    low_stock_threshold NUMERIC NOT NULL DEFAULT 5,
    gst_percent NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    phone TEXT,
    credit_limit NUMERIC NOT NULL DEFAULT 0,
    outstanding_balance NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Sales Table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    invoice_no TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    sub_total NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC NOT NULL DEFAULT 0,
    gst_amount NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    payment_status TEXT NOT NULL DEFAULT 'paid',
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Restricted to user_id = auth.uid()
DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;
CREATE POLICY "Users can manage their own products"
    ON public.products
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own customers" ON public.customers;
CREATE POLICY "Users can manage their own customers"
    ON public.customers
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own sales" ON public.sales;
CREATE POLICY "Users can manage their own sales"
    ON public.sales
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 6. Daily Invoice Number Sequence & Generator
CREATE SEQUENCE IF NOT EXISTS public.invoice_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_invoice_no()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_date TEXT;
    v_seq_num BIGINT;
    v_invoice TEXT;
BEGIN
    v_date := to_char(now(), 'YYYYMMDD');
    v_seq_num := nextval('public.invoice_seq');
    v_invoice := 'INV-' || v_date || '-' || lpad(v_seq_num::text, 4, '0');
    RETURN v_invoice;
END;
$$;

-- 7. Atomic RPC Function: create_sale
CREATE OR REPLACE FUNCTION public.create_sale(
    items JSONB,
    customer_id UUID DEFAULT NULL,
    payment_method TEXT DEFAULT 'cash',
    discount NUMERIC DEFAULT 0,
    amount_paid NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_customer RECORD;
    v_item JSONB;
    v_product_id UUID;
    v_quantity NUMERIC;
    v_product RECORD;
    v_line_base NUMERIC;
    v_line_gst NUMERIC;
    v_sub_total NUMERIC := 0;
    v_gst_total NUMERIC := 0;
    v_discount NUMERIC := COALESCE(discount, 0);
    v_total_amount NUMERIC := 0;
    v_amount_paid NUMERIC;
    v_payment_status TEXT;
    v_unpaid_amount NUMERIC := 0;
    v_invoice_no TEXT;
    v_sale_id UUID;
    v_customer_name TEXT := 'Walk-in Customer';
    v_items_array JSONB := '[]'::jsonb;
    v_enriched_item JSONB;
BEGIN
    -- Get current authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    END IF;

    -- Validate items input
    IF items IS NULL OR jsonb_array_length(items) = 0 THEN
        RAISE EXCEPTION 'Cannot create sale with empty cart';
    END IF;

    -- Fetch customer if provided
    IF customer_id IS NOT NULL THEN
        SELECT * INTO v_customer
        FROM public.customers
        WHERE id = customer_id AND (v_user_id IS NULL OR user_id = v_user_id);

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Customer not found or access denied';
        END IF;
        v_customer_name := v_customer.name;
    END IF;

    -- 1. Loop through each item: validate stock, decrement stock, compute line GST
    FOR v_item IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::NUMERIC;

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity % for item', v_quantity;
        END IF;

        -- Lock product row atomically FOR UPDATE
        SELECT * INTO v_product
        FROM public.products
        WHERE id = v_product_id AND (v_user_id IS NULL OR user_id = v_user_id)
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found', v_product_id;
        END IF;

        -- Validate stock >= quantity
        IF v_product.stock < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product "%". Available: %, Requested: %',
                v_product.name, v_product.stock, v_quantity;
        END IF;

        -- Atomically decrement stock
        UPDATE public.products
        SET stock = stock - v_quantity,
            updated_at = now()
        WHERE id = v_product_id;

        -- Compute line base & line GST
        v_line_base := round(v_quantity * v_product.selling_price, 2);
        v_line_gst := round(v_line_base * COALESCE(v_product.gst_percent, 0) / 100.0, 2);

        v_sub_total := v_sub_total + v_line_base;
        v_gst_total := v_gst_total + v_line_gst;

        -- Enrich item object with snapshot details including cost_at_sale
        v_enriched_item := jsonb_build_object(
            'product_id', v_product_id,
            'name', v_product.name,
            'unit', v_product.unit,
            'selling_price', v_product.selling_price,
            'cost_at_sale', v_product.purchase_price,
            'quantity', v_quantity,
            'line_base', v_line_base,
            'gst_percent', v_product.gst_percent,
            'line_gst', v_line_gst,
            'line_total', v_line_base + v_line_gst
        );
        v_items_array := v_items_array || v_enriched_item;
    END LOOP;

    -- 2. Compute Totals
    v_total_amount := round(greatest(0, v_sub_total - v_discount) + v_gst_total, 2);

    -- 3. Determine amount paid & payment status
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

    -- 4. Generate Invoice Number
    v_invoice_no := public.generate_invoice_no();

    -- 5. Insert Sale Record
    INSERT INTO public.sales (
        user_id,
        invoice_no,
        customer_id,
        customer_name,
        items,
        sub_total,
        discount,
        gst_amount,
        total_amount,
        payment_method,
        payment_status,
        amount_paid,
        created_at
    ) VALUES (
        v_user_id,
        v_invoice_no,
        customer_id,
        v_customer_name,
        v_items_array,
        v_sub_total,
        v_discount,
        v_gst_total,
        v_total_amount,
        payment_method,
        v_payment_status,
        v_amount_paid,
        now()
    ) RETURNING id INTO v_sale_id;

    -- 6. Update Customer Khata / Outstanding Balance if unpaid or credit
    IF (lower(payment_method) = 'credit' OR v_amount_paid < v_total_amount) THEN
        IF customer_id IS NULL THEN
            RAISE EXCEPTION 'Customer must be selected for Credit / Khata transactions or partial payments';
        END IF;

        v_unpaid_amount := v_total_amount - v_amount_paid;

        UPDATE public.customers
        SET outstanding_balance = outstanding_balance + v_unpaid_amount,
            updated_at = now()
        WHERE id = customer_id;
    END IF;

    -- Return JSON payload of the created sale
    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'invoice_no', v_invoice_no,
        'total_amount', v_total_amount,
        'sub_total', v_sub_total,
        'discount', v_discount,
        'gst_amount', v_gst_total,
        'payment_method', payment_method,
        'payment_status', v_payment_status,
        'amount_paid', v_amount_paid,
        'customer_name', v_customer_name,
        'items_count', jsonb_array_length(v_items_array)
    );
END;
$$;
