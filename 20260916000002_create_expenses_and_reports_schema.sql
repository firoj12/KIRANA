-- Migration: 20260916000002_create_expenses_and_reports_schema.sql
-- Description: Create expenses table, RLS policies, indexes, and atomic get_report_summary RPC function

-- 1. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('rent', 'electricity', 'salary', 'transport', 'packaging', 'maintenance', 'marketing', 'misc')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'card', 'bank')),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses (user_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses (user_id, category);

-- 3. Enable Row-Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
CREATE POLICY "Users can manage their own expenses"
    ON public.expenses
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. Atomic Report Summary Function using CTEs
CREATE OR REPLACE FUNCTION get_report_summary(
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
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Validate date range
    IF start_date > end_date THEN
        RAISE EXCEPTION 'start_date must be before or equal to end_date';
    END IF;

    -- Calculate previous equivalent period
    v_period_days := (end_date - start_date) + 1;
    v_prev_end := start_date - INTERVAL '1 day';
    v_prev_start := v_prev_end - (v_period_days - 1) * INTERVAL '1 day';

    WITH 
    -- Current Period Sales & COGS
    curr_sales_items AS (
        SELECT 
            s.id AS sale_id,
            s.total_amount,
            (item->>'quantity')::numeric AS qty,
            coalesce((item->>'cost_at_sale')::numeric, p.purchase_price, 0)::numeric AS unit_cost
        FROM public.sales s
        LEFT JOIN LATERAL jsonb_array_elements(s.items) AS item ON true
        LEFT JOIN public.products p ON p.id = (item->>'product_id')::uuid
        WHERE s.user_id = v_user_id
          AND s.created_at::date >= start_date
          AND s.created_at::date <= end_date
    ),
    curr_sales_agg AS (
        SELECT 
            count(DISTINCT sale_id) AS sales_count,
            coalesce((SELECT sum(total_amount) FROM public.sales WHERE user_id = v_user_id AND created_at::date >= start_date AND created_at::date <= end_date), 0)::numeric(12,2) AS gross_revenue,
            coalesce(sum(qty * unit_cost), 0)::numeric(12,2) AS cogs
        FROM curr_sales_items
    ),
    curr_expenses_agg AS (
        SELECT coalesce(sum(amount), 0)::numeric(12,2) AS expenses_total
        FROM public.expenses
        WHERE user_id = v_user_id
          AND expense_date >= start_date
          AND expense_date <= end_date
    ),
    curr_purchases_agg AS (
        SELECT coalesce(sum(total_amount), 0)::numeric(12,2) AS purchases_total
        FROM public.purchases
        WHERE user_id = v_user_id
          AND purchase_date >= start_date
          AND purchase_date <= end_date
    ),

    -- Previous Equivalent Period Sales & COGS
    prev_sales_items AS (
        SELECT 
            s.id AS sale_id,
            s.total_amount,
            (item->>'quantity')::numeric AS qty,
            coalesce((item->>'cost_at_sale')::numeric, p.purchase_price, 0)::numeric AS unit_cost
        FROM public.sales s
        LEFT JOIN LATERAL jsonb_array_elements(s.items) AS item ON true
        LEFT JOIN public.products p ON p.id = (item->>'product_id')::uuid
        WHERE s.user_id = v_user_id
          AND s.created_at::date >= v_prev_start
          AND s.created_at::date <= v_prev_end
    ),
    prev_sales_agg AS (
        SELECT 
            coalesce((SELECT sum(total_amount) FROM public.sales WHERE user_id = v_user_id AND created_at::date >= v_prev_start AND created_at::date <= v_prev_end), 0)::numeric(12,2) AS prev_gross_revenue,
            coalesce(sum(qty * unit_cost), 0)::numeric(12,2) AS prev_cogs
        FROM prev_sales_items
    ),
    prev_expenses_agg AS (
        SELECT coalesce(sum(amount), 0)::numeric(12,2) AS prev_expenses_total
        FROM public.expenses
        WHERE user_id = v_user_id
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
            'gross_revenue', CASE WHEN sc.prev_gross_revenue > 0 THEN round(((sc.gross_revenue - sc.prev_gross_revenue) / sc.prev_gross_revenue * 100.0), 1) ELSE NULL END,
            'cogs', CASE WHEN sc.prev_cogs > 0 THEN round(((sc.cogs - sc.prev_cogs) / sc.prev_cogs * 100.0), 1) ELSE NULL END,
            'gross_profit', CASE WHEN sc.prev_gross_profit > 0 THEN round(((sc.gross_profit - sc.prev_gross_profit) / sc.prev_gross_profit * 100.0), 1) ELSE NULL END,
            'net_profit', CASE WHEN sc.prev_net_profit != 0 THEN round(((sc.net_profit - sc.prev_net_profit) / abs(sc.prev_net_profit) * 100.0), 1) ELSE NULL END
        )
    ) INTO v_result
    FROM summary_calc sc;

    RETURN v_result;
END;
$$;
