-- ============================================================
-- Migration: RLS Policies for Debts & Debt Payments
-- Fix: Debtors not appearing after creation due to missing RLS
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Enable RLS on debts table (if not already enabled)
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on debt_payments table (if not already enabled)
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS Policies for debts table
-- ============================================================

-- 3a. SELECT: Authenticated users can read all debts
DROP POLICY IF EXISTS "Authenticated users can read debts" ON debts;
CREATE POLICY "Authenticated users can read debts"
ON debts FOR SELECT
TO authenticated
USING (true);

-- 3b. INSERT: Authenticated users can insert debts
DROP POLICY IF EXISTS "Authenticated users can insert debts" ON debts;
CREATE POLICY "Authenticated users can insert debts"
ON debts FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3c. UPDATE: Authenticated users can update debts
DROP POLICY IF EXISTS "Authenticated users can update debts" ON debts;
CREATE POLICY "Authenticated users can update debts"
ON debts FOR UPDATE
TO authenticated
USING (true);

-- 3d. DELETE: Authenticated users can delete debts
DROP POLICY IF EXISTS "Authenticated users can delete debts" ON debts;
CREATE POLICY "Authenticated users can delete debts"
ON debts FOR DELETE
TO authenticated
USING (true);

-- ============================================================
-- 4. RLS Policies for debt_payments table
-- ============================================================

-- 4a. SELECT: Authenticated users can read all payments
DROP POLICY IF EXISTS "Authenticated users can read debt_payments" ON debt_payments;
CREATE POLICY "Authenticated users can read debt_payments"
ON debt_payments FOR SELECT
TO authenticated
USING (true);

-- 4b. INSERT: Authenticated users can insert payments
DROP POLICY IF EXISTS "Authenticated users can insert debt_payments" ON debt_payments;
CREATE POLICY "Authenticated users can insert debt_payments"
ON debt_payments FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4c. UPDATE: Authenticated users can update payments
DROP POLICY IF EXISTS "Authenticated users can update debt_payments" ON debt_payments;
CREATE POLICY "Authenticated users can update debt_payments"
ON debt_payments FOR UPDATE
TO authenticated
USING (true);

-- 4d. DELETE: Authenticated users can delete payments
DROP POLICY IF EXISTS "Authenticated users can delete debt_payments" ON debt_payments;
CREATE POLICY "Authenticated users can delete debt_payments"
ON debt_payments FOR DELETE
TO authenticated
USING (true);

-- ============================================================
-- تمت إضافة سياسات RLS بنجاح
-- ============================================================
