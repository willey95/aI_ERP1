-- AlterTable: Add new fields to BudgetItem
ALTER TABLE "BudgetItem"
ADD COLUMN IF NOT EXISTS "remainingBeforeExec" DECIMAL(20,2),
ADD COLUMN IF NOT EXISTS "remainingAfterExec" DECIMAL(20,2),
ADD COLUMN IF NOT EXISTS "pendingExecutionAmount" DECIMAL(20,2) DEFAULT 0;

-- Update existing records to populate new fields
UPDATE "BudgetItem"
SET
  "remainingBeforeExec" = "remainingBudget",
  "remainingAfterExec" = "remainingBudget",
  "pendingExecutionAmount" = 0
WHERE "remainingBeforeExec" IS NULL;

-- Make the new columns NOT NULL after populating them
ALTER TABLE "BudgetItem"
ALTER COLUMN "remainingBeforeExec" SET NOT NULL,
ALTER COLUMN "remainingAfterExec" SET NOT NULL,
ALTER COLUMN "pendingExecutionAmount" SET NOT NULL;
