-- تعبئة customer_name و customer_phone من جدول customers
-- نفذ هذا في Supabase SQL Editor
UPDATE debts d
SET 
  customer_name = COALESCE(c.name, ''),
  customer_phone = COALESCE(c.phone, '')
FROM customers c
WHERE d.customer_id = c.id
  AND (d.customer_name = '' OR d.customer_name IS NULL);
