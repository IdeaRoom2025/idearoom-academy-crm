-- Completely disable RLS for the review table
-- This is the simplest solution to ensure all operations work

-- First, drop any existing policies that might be conflicting
DROP POLICY IF EXISTS "Enable all operations for authenticated users only" ON "review";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "review";
DROP POLICY IF EXISTS "Enable read access for authenticated users only" ON "review";
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON "review";
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON "review";

-- Disable RLS completely on the review table
ALTER TABLE "review" DISABLE ROW LEVEL SECURITY;

-- If we ever need to re-enable it, we could use:
-- ALTER TABLE "review" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable all operations for authenticated users" ON "review" TO authenticated USING (true) WITH CHECK (true); 