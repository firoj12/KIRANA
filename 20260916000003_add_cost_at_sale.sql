-- Migration: 20260916000003_add_cost_at_sale.sql
-- Add cost_at_sale snapshot to sale items, backfill existing sales, and update RPCs

-- 1. One-time Migration: Backfill existing sales items with cost_at_sale from products table
UPDATE public.sales s
SET items = (
    SELECT jsonb_agg(
        CASE 
            WHEN item ? 'cost_at_sale' AND (item->>'cost_at_sale') IS NOT NULL THEN item
            ELSE item || jsonb_build_object('cost_at_sale', coalesce(p.purchase_price, ((item->>'selling_price')::numeric * 0.8), 0))
        END
    )
    FROM jsonb_array_elements(s.items) AS item
    LEFT JOIN public.products p ON p.id = (item->>'product_id')::uuid
)
WHERE items IS NOT NULL AND jsonb_array_length(items) > 0;

-- 2. Update create_sale RPC to capture cost_at_sale at the exact moment of sale
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

    -- 4. Update Customer Outstanding Balance if Credit or Partial
    v_unpaid_amount := round(v_total_amount - v_amount_paid, 2);
    IF v_unpaid_amount > 0 THEN
        IF customer_id IS NULL THEN
            RAISE EXCEPTION 'Customer is required for credit transactions';
        END IF;

        UPDATE public.customers
        SET outstanding_balance = outstanding_balance + v_unpaid_amount
        WHERE id = customer_id;
    END IF;

    -- 5. Generate Invoice Number & Insert Sale
    v_invoice_no := public.generate_invoice_no();
    v_sale_id := gen_random_uuid();

    INSERT INTO public.sales (
        id,
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
        v_sale_id,
        v_user_id,
        v_invoice_no,
        customer_id,
        v_customer_name,
        v_items_array,
        v_sub_total,
        v_discount,
        v_gst_total,
        v_total_amount,
        lower(payment_method),
        v_payment_status,
        v_amount_paid,
        now()
    );

    -- 6. Return response
    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'invoice_no', v_invoice_no,
        'total_amount', v_total_amount,
        'sub_total', v_sub_total,
        'discount', v_discount,
        'gst_amount', v_gst_total,
        'payment_method', lower(payment_method),
        'payment_status', v_payment_status,
        'amount_paid', v_amount_paid,
        'customer_name', v_customer_name,
        'items_count', jsonb_array_length(v_items_array)
    );
END;
$$;

-- 3. Update get_report_summary RPC to use cost_at_sale with fallback
CREATE OR REPLACE FUNCTION public.get_report_summary(
    start_date DATE,
    end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_period_days INT;
    v_prev_start DATE;
    v_prev_end DATE;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();

    -- Calculate previous equivalent period
    v_period_days := (end_date - start_date) + 1;
    v_prev_end := start_date - INTERVAL '1 day';
    v_prev_start := v_prev_end - (v_period_days - 1) * INTERVAL '1 day';

    WITH 
    -- Current Period Sales & COGS using cost_at_sale
    curr_sales_items AS (
        SELECT 
            s.id AS sale_id,
            s.total_amount,
            (item->>'quantity')::numeric AS qty,
            coalesce((item->>'cost_at_sale')::numeric, p.purchase_price, 0)::numeric AS unit_cost
        FROM public.sales s
        LEFT JOIN LATERAL jsonb_array_elements(s.items) AS item ON true
        LEFT JOIN public.products p ON p.id = (item->>'product_id')::uuid
        WHERE (v_user_id IS NULL OR s.user_id = v_user_id)
          AND s.created_at::date >= start_date
          AND s.created_at::date <= end_date
    ),
    curr_sales_agg AS (
        SELECT 
            count(DISTINCT sale_id) AS sales_count,
            coalesce((SELECT sum(total_amount) FROM public.sales WHERE (v_user_id IS NULL OR user_id = v_user_id) AND created_at::date >= start_date AND created_at::date <= end_date), 0)::numeric(12,2) AS gross_revenue,
            coalesce(sum(qty * unit_cost), 0)::numeric(12,2) AS cogs
        FROM curr_sales_items
    ),
    curr_expenses_agg AS (
        SELECT coalesce(sum(amount), 0)::numeric(12,2) AS expenses_total
        FROM public.expenses
        WHERE (v_user_id IS NULL OR user_id = v_user_id)
          AND expense_date >= start_date
          AND expense_date <= end_date
    ),
    curr_purchases_agg AS (
        SELECT coalesce(sum(total_amount), 0)::numeric(12,2) AS purchases_total
        FROM public.purchases
        WHERE (v_user_id IS NULL OR user_id = v_user_id)
          AND purchase_date >= start_date
          AND purchase_date <= end_date
    ),

    -- Previous Equivalent Period Sales & COGS using cost_at_sale
    prev_sales_items AS (
        SELECT 
            s.id AS sale_id,
            s.total_amount,
            (item->>'quantity')::numeric AS qty,
            coalesce((item->>'cost_at_sale')::numeric, p.purchase_price, 0)::numeric AS unit_cost
        FROM public.sales s
        LEFT JOIN LATERAL jsonb_array_elements(s.items) AS item ON true
        LEFT JOIN public.products p ON p.id = (item->>'product_id')::uuid
        WHERE (v_user_id IS NULL OR s.user_id = v_user_id)
          AND s.created_at::date >= v_prev_start
          AND s.created_at::date <= v_prev_end
    ),
    prev_sales_agg AS (
        SELECT 
            coalesce((SELECT sum(total_amount) FROM public.sales WHERE (v_user_id IS NULL OR user_id = v_user_id) AND created_at::date >= v_prev_start AND created_at::date <= v_prev_end), 0)::numeric(12,2) AS prev_gross_revenue,
            coalesce(sum(qty * unit_cost), 0)::numeric(12,2) AS prev_cogs
        FROM prev_sales_items
    ),
    prev_expenses_agg AS (
        SELECT coalesce(sum(amount), 0)::numeric(12,2) AS prev_expenses_total
        FROM public.expenses
        WHERE (v_user_id IS NULL OR user_id = v_user_id)
          AND expense_date >= v_prev_start
          AND expense_date <= v_prev_end
    ),

    -- Aggregated Computations
    summary_calc AS (
        SELECT
            cs.gross_revenue,
            cs.cogs,
            (cs.gross_revenue - cs.cogs)::numeric(12,2) AS gross_profit,
            ((cs.gross_revenue - cs.cogs) - ce.expenses_total)::numeric(12,2) AS net_profit,
            cs.sales_count,
            ce.expenses_total,
            cp.purchases_total,
            ps.prev_gross_revenue,
            ps.prev_cogs,
            (ps.prev_gross_revenue - ps.prev_cogs)::numeric(12,2) AS prev_gross_profit,
            ((ps.prev_gross_revenue - ps.prev_cogs) - pe.prev_expenses_total)::numeric(12,2) AS prev_net_profit
        FROM curr_sales_agg cs
        CROSS JOIN curr_expenses_agg ce
        CROSS JOIN curr_purchases_agg cp
        CROSS JOIN prev_sales_agg ps
        CROSS JOIN prev_expenses_agg pe
    )
    SELECT jsonb_build_object(
        'start_date', start_date,
        'end_date', end_date,
        'previous_start_date', v_prev_start,
        'previous_end_date', v_prev_end,
        'gross_revenue', sc.gross_revenue,
        'cogs', sc.cogs,
        'gross_profit', sc.gross_profit,
        'net_profit', sc.net_profit,
        'sales_count', sc.sales_count,
        'expenses_total', sc.expenses_total,
        'purchases_total', sc.purchases_total,
        'deltas', jsonb_build_object(
            'gross_revenue', CASE WHEN sc.prev_gross_revenue = 0 THEN (CASE WHEN sc.gross_revenue > 0 THEN 100 ELSE NULL END) ELSE round(((sc.gross_revenue - sc.prev_gross_revenue) / sc.prev_gross_revenue) * 100, 1) END,
            'cogs', CASE WHEN sc.prev_cogs = 0 THEN (CASE WHEN sc.cogs > 0 THEN 100 ELSE NULL END) ELSE round(((sc.cogs - sc.prev_cogs) / sc.prev_cogs) * 100, 1) END,
            'gross_profit', CASE WHEN sc.prev_gross_profit = 0 THEN (CASE WHEN sc.gross_profit > 0 THEN 100 ELSE NULL END) ELSE round(((sc.gross_profit - sc.prev_gross_profit) / abs(sc.prev_gross_profit)) * 100, 1) END,
            'net_profit', CASE WHEN sc.prev_net_profit = 0 THEN (CASE WHEN sc.net_profit > 0 THEN 100 ELSE NULL END) ELSE round(((sc.net_profit - sc.prev_net_profit) / abs(sc.prev_net_profit)) * 100, 1) END
        )
    ) INTO v_result
    FROM summary_calc sc;

    RETURN v_result;
END;
$$;
