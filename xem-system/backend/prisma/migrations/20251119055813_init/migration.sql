-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CFO', 'RM_TEAM', 'TEAM_LEAD', 'APPROVER', 'STAFF', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('SELF', 'SPC', 'JOINT', 'COOPERATIVE');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProjectPhase" AS ENUM ('PRE_CONTRACT', 'INTERNAL_APPROVAL', 'CONSTRUCTION');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('PARTIAL', 'FULL');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CashFlowType" AS ENUM ('INFLOW', 'OUTFLOW');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EXECUTION_RATE_WARNING', 'APPROVAL_REQUEST', 'APPROVAL_COMPLETED', 'APPROVAL_REJECTED', 'BUDGET_CHANGE', 'RISK_ALERT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'WARNING', 'DANGER', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "department" TEXT,
    "position" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "projectType" "ProjectType" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "landArea" DOUBLE PRECISION NOT NULL,
    "buildingArea" DOUBLE PRECISION NOT NULL,
    "totalFloorArea" DOUBLE PRECISION NOT NULL,
    "units" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "salesStartDate" TIMESTAMP(3),
    "preContractDate" TIMESTAMP(3),
    "internalApprovalDate" TIMESTAMP(3),
    "constructionStartDate" TIMESTAMP(3),
    "currentPhase" "ProjectPhase" NOT NULL DEFAULT 'PRE_CONTRACT',
    "initialBudget" DECIMAL(20,2) NOT NULL,
    "currentBudget" DECIMAL(20,2) NOT NULL,
    "executedAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "remainingBudget" DECIMAL(20,2) NOT NULL,
    "executionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expectedProfit" DECIMAL(20,2) NOT NULL,
    "roi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "mainItem" TEXT NOT NULL,
    "subItem" TEXT,
    "initialBudget" DECIMAL(20,2) NOT NULL,
    "currentBudget" DECIMAL(20,2) NOT NULL,
    "executedAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "remainingBeforeExec" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "remainingAfterExec" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "executionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingExecutionAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "isCalculable" BOOLEAN NOT NULL DEFAULT false,
    "formulaId" TEXT,
    "calculatedAmount" DECIMAL(20,2),
    "changeReason" TEXT,
    "changedAt" TIMESTAMP(3),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_history" (
    "id" TEXT NOT NULL,
    "budgetItemId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "previousBudget" DECIMAL(20,2) NOT NULL,
    "newBudget" DECIMAL(20,2) NOT NULL,
    "changeAmount" DECIMAL(20,2) NOT NULL,
    "changeReason" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pf_financing" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "totalAmount" DECIMAL(20,2) NOT NULL,
    "disbursedAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(20,2) NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "lender" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pf_financing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_revenue" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "unitsSold" INTEGER NOT NULL,
    "totalRevenue" DECIMAL(20,2) NOT NULL,
    "collectedAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(20,2) NOT NULL,
    "salesDate" TIMESTAMP(3) NOT NULL,
    "contractNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_buffers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "developerProfit" DECIMAL(20,2) NOT NULL,
    "equity" DECIMAL(20,2) NOT NULL,
    "contingency" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "totalBuffer" DECIMAL(20,2) NOT NULL,
    "constructionCost" DECIMAL(20,2) NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'SAFE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_buffers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_formulas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "description" TEXT,
    "variables" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_variables" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(20,4) NOT NULL,
    "unit" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculation_history" (
    "id" TEXT NOT NULL,
    "budgetItemId" TEXT NOT NULL,
    "formulaUsed" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "result" DECIMAL(20,2) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculatedBy" TEXT,

    CONSTRAINT "calculation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "structure" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "budgetItemId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "executionDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "attachments" TEXT[],
    "status" "ExecutionStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "execution_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "executionRequestId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "approverRole" "UserRole" NOT NULL,
    "approverId" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "decision" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_transfers" (
    "id" TEXT NOT NULL,
    "sourceItemId" TEXT NOT NULL,
    "targetItemId" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "transferType" "TransferType" NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "executionRequestId" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_flow_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "budgetItemId" TEXT,
    "type" "CashFlowType" NOT NULL,
    "category" TEXT NOT NULL,
    "mainItem" TEXT NOT NULL,
    "subItem" TEXT,
    "description" TEXT,
    "budgetAmount" DECIMAL(20,2) NOT NULL,
    "forecastAmount" DECIMAL(20,2) NOT NULL,
    "actualAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "varianceAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "varianceReason" TEXT,
    "isVarianceApproved" BOOLEAN NOT NULL DEFAULT false,
    "actualExecutionType" TEXT NOT NULL DEFAULT 'ACTUAL',
    "actualExecutionAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "nominalExecutionAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "executionNote" TEXT,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "forecastDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringMonths" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_flow_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_models" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "salesRate" DOUBLE PRECISION NOT NULL,
    "salesStartMonth" INTEGER NOT NULL,
    "constructionDelay" INTEGER NOT NULL DEFAULT 0,
    "costInflation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "monthlyProjections" JSONB NOT NULL,
    "totalRevenue" DECIMAL(20,2) NOT NULL,
    "totalCost" DECIMAL(20,2) NOT NULL,
    "expectedProfit" DECIMAL(20,2) NOT NULL,
    "roi" DOUBLE PRECISION NOT NULL,
    "lowestCashPoint" DECIMAL(20,2) NOT NULL,
    "lowestCashMonth" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculatedBy" TEXT,

    CONSTRAINT "financial_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "salesDelay" INTEGER NOT NULL DEFAULT 0,
    "salesRate" DOUBLE PRECISION NOT NULL,
    "costChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interestChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "projectedProfit" DECIMAL(20,2) NOT NULL,
    "projectedROI" DOUBLE PRECISION NOT NULL,
    "lowestCash" DECIMAL(20,2) NOT NULL,
    "lowestCashMonth" INTEGER NOT NULL,
    "recommendations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "projects_code_idx" ON "projects"("code");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_projectType_idx" ON "projects"("projectType");

-- CreateIndex
CREATE INDEX "projects_createdById_idx" ON "projects"("createdById");

-- CreateIndex
CREATE INDEX "project_members_userId_idx" ON "project_members"("userId");

-- CreateIndex
CREATE INDEX "project_members_projectId_idx" ON "project_members"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_userId_key" ON "project_members"("projectId", "userId");

-- CreateIndex
CREATE INDEX "budget_items_projectId_idx" ON "budget_items"("projectId");

-- CreateIndex
CREATE INDEX "budget_items_category_idx" ON "budget_items"("category");

-- CreateIndex
CREATE INDEX "budget_items_projectId_isActive_idx" ON "budget_items"("projectId", "isActive");

-- CreateIndex
CREATE INDEX "budget_items_formulaId_idx" ON "budget_items"("formulaId");

-- CreateIndex
CREATE INDEX "budget_history_budgetItemId_idx" ON "budget_history"("budgetItemId");

-- CreateIndex
CREATE INDEX "budget_history_projectId_idx" ON "budget_history"("projectId");

-- CreateIndex
CREATE INDEX "budget_history_revision_idx" ON "budget_history"("revision");

-- CreateIndex
CREATE UNIQUE INDEX "pf_financing_projectId_key" ON "pf_financing"("projectId");

-- CreateIndex
CREATE INDEX "sales_revenue_projectId_idx" ON "sales_revenue"("projectId");

-- CreateIndex
CREATE INDEX "sales_revenue_salesDate_idx" ON "sales_revenue"("salesDate");

-- CreateIndex
CREATE UNIQUE INDEX "discount_buffers_projectId_key" ON "discount_buffers"("projectId");

-- CreateIndex
CREATE INDEX "budget_formulas_category_idx" ON "budget_formulas"("category");

-- CreateIndex
CREATE INDEX "project_variables_projectId_idx" ON "project_variables"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_variables_projectId_name_key" ON "project_variables"("projectId", "name");

-- CreateIndex
CREATE INDEX "calculation_history_budgetItemId_idx" ON "calculation_history"("budgetItemId");

-- CreateIndex
CREATE INDEX "calculation_history_calculatedAt_idx" ON "calculation_history"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "execution_requests_requestNumber_key" ON "execution_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "execution_requests_requestNumber_idx" ON "execution_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "execution_requests_status_idx" ON "execution_requests"("status");

-- CreateIndex
CREATE INDEX "execution_requests_projectId_idx" ON "execution_requests"("projectId");

-- CreateIndex
CREATE INDEX "execution_requests_budgetItemId_idx" ON "execution_requests"("budgetItemId");

-- CreateIndex
CREATE INDEX "execution_requests_requestedById_idx" ON "execution_requests"("requestedById");

-- CreateIndex
CREATE INDEX "execution_requests_status_currentStep_idx" ON "execution_requests"("status", "currentStep");

-- CreateIndex
CREATE INDEX "approvals_status_idx" ON "approvals"("status");

-- CreateIndex
CREATE INDEX "approvals_approverRole_idx" ON "approvals"("approverRole");

-- CreateIndex
CREATE INDEX "approvals_approverId_idx" ON "approvals"("approverId");

-- CreateIndex
CREATE INDEX "approvals_executionRequestId_idx" ON "approvals"("executionRequestId");

-- CreateIndex
CREATE INDEX "approvals_approverRole_status_idx" ON "approvals"("approverRole", "status");

-- CreateIndex
CREATE UNIQUE INDEX "approvals_executionRequestId_step_key" ON "approvals"("executionRequestId", "step");

-- CreateIndex
CREATE INDEX "budget_transfers_sourceItemId_idx" ON "budget_transfers"("sourceItemId");

-- CreateIndex
CREATE INDEX "budget_transfers_targetItemId_idx" ON "budget_transfers"("targetItemId");

-- CreateIndex
CREATE INDEX "budget_transfers_status_idx" ON "budget_transfers"("status");

-- CreateIndex
CREATE INDEX "budget_transfers_executionRequestId_idx" ON "budget_transfers"("executionRequestId");

-- CreateIndex
CREATE INDEX "budget_transfers_createdById_idx" ON "budget_transfers"("createdById");

-- CreateIndex
CREATE INDEX "cash_flow_items_projectId_idx" ON "cash_flow_items"("projectId");

-- CreateIndex
CREATE INDEX "cash_flow_items_budgetItemId_idx" ON "cash_flow_items"("budgetItemId");

-- CreateIndex
CREATE INDEX "cash_flow_items_plannedDate_idx" ON "cash_flow_items"("plannedDate");

-- CreateIndex
CREATE INDEX "cash_flow_items_type_idx" ON "cash_flow_items"("type");

-- CreateIndex
CREATE INDEX "financial_models_projectId_idx" ON "financial_models"("projectId");

-- CreateIndex
CREATE INDEX "financial_models_version_idx" ON "financial_models"("version");

-- CreateIndex
CREATE INDEX "financial_models_projectId_isActive_idx" ON "financial_models"("projectId", "isActive");

-- CreateIndex
CREATE INDEX "simulations_projectId_idx" ON "simulations"("projectId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_projectId_idx" ON "notifications"("projectId");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_projectId_idx" ON "activity_logs"("projectId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "budget_formulas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_history" ADD CONSTRAINT "budget_history_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "budget_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculation_history" ADD CONSTRAINT "calculation_history_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "budget_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_requests" ADD CONSTRAINT "execution_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_requests" ADD CONSTRAINT "execution_requests_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "budget_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_requests" ADD CONSTRAINT "execution_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_executionRequestId_fkey" FOREIGN KEY ("executionRequestId") REFERENCES "execution_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_transfers" ADD CONSTRAINT "budget_transfers_sourceItemId_fkey" FOREIGN KEY ("sourceItemId") REFERENCES "budget_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_transfers" ADD CONSTRAINT "budget_transfers_targetItemId_fkey" FOREIGN KEY ("targetItemId") REFERENCES "budget_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_transfers" ADD CONSTRAINT "budget_transfers_executionRequestId_fkey" FOREIGN KEY ("executionRequestId") REFERENCES "execution_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_transfers" ADD CONSTRAINT "budget_transfers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_transfers" ADD CONSTRAINT "budget_transfers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_items" ADD CONSTRAINT "cash_flow_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_models" ADD CONSTRAINT "financial_models_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
