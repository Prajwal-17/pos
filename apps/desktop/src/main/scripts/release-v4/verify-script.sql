-- Verify all quantities are whole no
-- products.totalQuantitySold, sales.totalQuantity, sales.checkedQty, estimates.totalQuantity, estimates.checkedQty, saleItems.quantity, estimateItems.quantity
SELECT table_name, id, value FROM (
    -- 1. Products
    SELECT 1 AS sort_order, 'products' AS table_name, id, total_quantity_sold AS value
    FROM products
    WHERE total_quantity_sold IS NOT NULL AND CAST(total_quantity_sold AS REAL) != CAST(total_quantity_sold AS INTEGER)

    UNION ALL

    -- 2. Sales
    SELECT 2 AS sort_order, 'sales', id, total_quantity
    FROM sales
    WHERE total_quantity IS NOT NULL AND CAST(total_quantity AS REAL) != CAST(total_quantity AS INTEGER)

    UNION ALL

    -- 3. Sale Items (Original quantity)
    SELECT 3 AS sort_order, 'sale_items (qty)', id, quantity
    FROM sale_items
    WHERE quantity IS NOT NULL AND CAST(quantity AS REAL) != CAST(quantity AS INTEGER)

    UNION ALL

    -- 4. Sale Items (Checked_qty)
    SELECT 4 AS sort_order, 'sale_items (checked)', id, checked_qty
    FROM sale_items
    WHERE checked_qty IS NOT NULL AND CAST(checked_qty AS REAL) != CAST(checked_qty AS INTEGER)

    UNION ALL

    -- 5. Estimates
    SELECT 5 AS sort_order, 'estimates', id, total_quantity
    FROM estimates
    WHERE total_quantity IS NOT NULL AND CAST(total_quantity AS REAL) != CAST(total_quantity AS INTEGER)

    UNION ALL

    -- 6. Estimate Items (Original quantity)
    SELECT 6 AS sort_order, 'estimate_items (qty)', id, quantity
    FROM estimate_items
    WHERE quantity IS NOT NULL AND CAST(quantity AS REAL) != CAST(quantity AS INTEGER)

    UNION ALL

    -- 7. Estimate Items (Checked_qty)
    SELECT 7 AS sort_order, 'estimate_items (checked)', id, checked_qty
    FROM estimate_items
    WHERE checked_qty IS NOT NULL AND CAST(checked_qty AS REAL) != CAST(checked_qty AS INTEGER)
) AS combined_results
ORDER BY sort_order;


-- Verify Product Snapshot
SELECT id, name, product_snapshot, 'Contains "null"' AS issue
FROM products
WHERE product_snapshot LIKE '%null%'

UNION ALL

SELECT id, name, product_snapshot, 'Ends with ignored weight (1pc)'
FROM products
WHERE product_snapshot GLOB '*1pc'

UNION ALL

SELECT id, name, product_snapshot, 'Ends with ignored weight (1ml)'
FROM products
WHERE product_snapshot GLOB '*1ml'

UNION ALL

SELECT id, name, product_snapshot, 'Ends with ignored weight (1g)'
FROM products
WHERE product_snapshot GLOB '*1g'

UNION ALL

SELECT id, name, product_snapshot, 'Ends with ignored weight (1kg)'
FROM products
WHERE product_snapshot GLOB '*1kg'

UNION ALL

SELECT id, name, product_snapshot, 'Ends with "none"'
FROM products
WHERE product_snapshot GLOB '*none'

UNION ALL

SELECT id, name, product_snapshot, 'Trailing whitespace'
FROM products
WHERE product_snapshot != RTRIM(product_snapshot)

ORDER BY issue, name;

-- Verify if total(saleItems.quantity) = sales.totalQuantity
SELECT
    s.id,
    s.invoice_no,
    s.total_quantity AS stored_total_quantity,
    COALESCE(SUM(si.quantity), 0) AS calculated_total_quantity
FROM sales s
LEFT JOIN sale_items si
    ON s.id = si.sale_id
GROUP BY
    s.id,
    s.invoice_no,
    s.total_quantity
HAVING
    COALESCE(SUM(si.quantity), 0) != COALESCE(s.total_quantity, 0);


-- Verify if total(estimatesitems.quantity) = estimates.totalQuantity
SELECT
    e.id,
    e.estimate_no,
    e.total_quantity AS stored_total_quantity,
    COALESCE(SUM(ei.quantity), 0) AS calculated_total_quantity
FROM estimates e
LEFT JOIN estimate_items ei
    ON e.id = ei.estimate_id
GROUP BY
    e.id,
    e.estimate_no,
    e.total_quantity
HAVING
    COALESCE(SUM(ei.quantity), 0) != COALESCE(e.total_quantity, 0);

-- Verify total(saleItems.quantity) = sales.grandTotal
SELECT
    s.id,
    s.invoice_no,
    s.grand_total AS stored_grand_total,
    COALESCE(SUM(si.total_price), 0) AS calculated_grand_total
FROM sales s
LEFT JOIN sale_items si
    ON s.id = si.sale_id
GROUP BY
    s.id,
    s.invoice_no,
    s.grand_total
HAVING
    COALESCE(SUM(si.total_price), 0) != COALESCE(s.grand_total, 0);

-- Verify total(estimateItems.quantity) = estimates.grandTotal
SELECT
    e.id,
    e.estimate_no,
    e.grand_total AS stored_grand_total,
    COALESCE(SUM(ei.total_price), 0) AS calculated_grand_total
FROM estimates e
LEFT JOIN estimate_items ei
    ON e.id = ei.estimate_id
GROUP BY
    e.id,
    e.estimate_no,
    e.grand_total
HAVING
    COALESCE(SUM(ei.total_price), 0) != COALESCE(e.grand_total, 0);


-- Verify product history - where all price fields are null
SELECT *
FROM product_history
WHERE
    old_price IS NULL
    AND new_price IS NULL
    AND old_mrp IS NULL
    AND new_mrp IS NULL
    AND old_purchase_price IS NULL
    AND new_purchase_price IS NULL;
