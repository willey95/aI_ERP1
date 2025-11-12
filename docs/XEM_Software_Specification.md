# XEM (eXecution & Expenditure Management) System
## Software Specification Document v1.0

---

## 1. Executive Summary

### 1.1 Purpose
XEM is an enterprise-grade budget execution management platform designed for construction and real estate development companies. It provides real-time visibility, control, and predictive analytics for project budget execution across multiple stakeholders (developers, contractors, and lenders).

### 1.2 Business Problem
- **Uncontrolled Expenditure**: Multi-party approval structure (developer, contractor, lenders) leads to loss of spending control
- **Cost Shortage**: Frequent budget overruns due to reactive approval processes
- **Limited Visibility**: Lack of real-time budget execution tracking
- **Poor Forecasting**: Inability to predict and prevent financial shortfalls

### 1.3 Solution Overview
A comprehensive platform that enables:
- Pre-construction budget planning and validation
- Real-time budget execution monitoring with multi-level approval workflows
- Predictive cash flow modeling and scenario analysis
- AI-powered risk detection and automated reporting

---

## 2. System Architecture

### 2.1 Technology Stack

**Frontend**
- Framework: React 18.x + TypeScript 5.x
- Build Tool: Vite 6.x
- UI Components: shadcn/ui (Radix UI primitives)
- Styling: Tailwind CSS 4.x
- State Management: Zustand + TanStack Query
- Forms: React Hook Form + Zod validation
- Charts: Recharts + D3.js
- Tables: TanStack Table v8
- Date Handling: date-fns

**Backend** (Recommended)
- Runtime: Node.js 20.x LTS
- Framework: NestJS / Fastify
- Database: PostgreSQL 16.x
- ORM: Prisma / Drizzle
- Cache: Redis
- File Storage: S3-compatible (MinIO/AWS S3)
- Queue: BullMQ

**AI/ML**
- LLM Integration: Anthropic Claude API
- Vector DB: Pinecone / Qdrant (for RAG)
- Analytics: Python microservice (FastAPI)

**DevOps**
- Containerization: Docker + Docker Compose
- CI/CD: GitHub Actions
- Monitoring: Grafana + Prometheus
- Logging: ELK Stack / Loki

### 2.2 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web Client  │  │ Mobile App   │  │  Dashboard   │      │
│  │  (React)     │  │  (Optional)  │  │   Widgets    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│            Authentication / Rate Limiting / CORS             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────────────────────────────────────────┐       │
│  │          Core Business Services                   │       │
│  │  • Budget Management Service                     │       │
│  │  • Execution Approval Service                    │       │
│  │  • Cash Flow Projection Service                  │       │
│  │  • Simulation Engine Service                     │       │
│  │  • AI Analysis Service                           │       │
│  │  • Notification Service                          │       │
│  │  • Document Management Service                   │       │
│  │  • Integration Service (ERP Connector)           │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ PostgreSQL │  │   Redis    │  │  S3/MinIO  │           │
│  │  (Primary) │  │  (Cache)   │  │  (Files)   │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   External Integrations                      │
│  • ERP Systems (SAP, Oracle)                                │
│  • Email Server (SMTP)                                      │
│  • Document Parsing (OCR)                                   │
│  • Anthropic Claude API                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Functional Requirements

### 3.1 User Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **System Admin** | System configuration and user management | All permissions |
| **CFO / Final Approver** | Ultimate budget authority | Final approval, budget modification, full visibility |
| **RM Team Leader** | Risk management oversight | Budget change approval, execution review, analytics access |
| **Department Manager** | Project oversight | First-level approval, team execution visibility |
| **Project Manager** | Day-to-day management | Request creation, execution tracking, basic reporting |
| **Finance Staff** | Execution processing | Request drafting, document attachment, execution recording |
| **Developer (External)** | Request submission | Submit requests, view own requests only |
| **Auditor (Read-only)** | Compliance review | Read-only access to all data |

### 3.2 Module Breakdown

#### Module 1: Project Setup & Budget Planning (Pre-Construction)

**3.2.1 Project Creation**
- Project type selection (Self-development, SPC, Joint Venture, Cooperative)
- Stakeholder mapping (Developer, Contractor, Lenders, Cooperative)
- Basic information (Location, Scale, Timeline, Target ROI)
- Document repository setup

**3.2.2 Budget Template Management**
- Industry-standard templates (Residential, Commercial, Mixed-use)
- Customizable line items
- Budget categories:
  ```
  Revenue
  ├── Pre-sale Revenue (Residential/Commercial/Office-tel)
  ├── Rental Income
  └── Other Revenue
  
  Expenditure
  ├── Land Cost
  ├── Construction Cost
  │   ├── Direct Construction Cost
  │   └── Indirect Construction Cost
  ├── Design Fee
  ├── Supervision Fee
  ├── Mandatory Contributions
  │   ├── Infrastructure Development Charge
  │   ├── Disaster Recovery Fund
  │   ├── Congestion Charge
  │   └── School Site Contribution
  ├── Financial Cost (Interest)
  ├── Taxes & Public Charges
  ├── Marketing & Sales
  ├── Contingency Reserve
  └── Other
  
  Project Profit
  ```

**3.2.3 Budget Input & Validation**
- Multi-sheet input interface (Excel-like grid)
- Auto-calculation formulas:
  - Infrastructure Charge = Floor Area × Unit Rate
  - School Contribution = Number of Units × Contribution Amount
  - Disaster Fund = Land Area × Contribution Rate
  - Congestion Charge (for restricted zones)
- Validation rules:
  - Financial integrity: Revenue = Expenditure + Profit (±0.1% tolerance)
  - Mandatory item check (30+ standard items)
  - Reasonability check (benchmark comparison)
  - Formula consistency check

**3.2.4 Approval Workflow (Budget Establishment)**
- Gate-keeper approval chain configuration
- Stage-by-stage checklist
- Version control (V1.0, V1.1, V2.0...)
- Approval history audit trail
- Budget freeze/unfreeze control

---

#### Module 2: Budget Execution Management (Post-Construction)

**3.2.5 Execution Request Processing**

**Request Initiation**
- Two channels:
  1. Manual entry by finance staff
  2. Email parsing from developer (optional OCR)
- Required fields:
  - Request date
  - Budget line item (dropdown with search)
  - Execution amount
  - Supporting documents (Tax invoice, Contract, Receipt)
  - Justification/Notes
- Auto-populated fields:
  - Current budget balance
  - Execution rate (%)
  - Previous execution history
  - Requester information

**Budget Verification Logic**
```
IF execution_amount <= budget_balance THEN
    → Proceed to standard approval
ELSE IF execution_amount > budget_balance THEN
    → Check contingency reserve availability
    → IF contingency available THEN
        → Transfer from contingency (with tagging)
        → Require budget modification approval
    → ELSE
        → Block execution OR trigger emergency approval workflow
END IF
```

**Multi-Level Approval Workflow**
```
Stage 1: Project Manager
  ↓ Reviews: Budget alignment, justification adequacy
Stage 2: Department Manager  
  ↓ Reviews: Execution history, rate threshold (25/50/75/90%)
Stage 3: RM Team Leader
  ↓ Reviews: Budget modification validity, financial risk
Stage 4: CFO (Final Approver)
  ↓ Reviews: Overall financial impact, strategic alignment
  ↓
[Approved] → Record Execution
[Rejected] → Return to requester with comments
```

**3.2.6 Real-Time Monitoring Dashboard**

**KPI Widgets (Top Section)**
- Total Budget: ₩500B
- Executed: ₩320B (64%)
- Remaining: ₩180B
- Risk Score: 72/100 (color-coded)
- Next Critical Milestone: Q3 Interim Payment

**Execution Rate Heatmap**
- Visual table showing all budget items
- Color coding:
  - Green: 0-50%
  - Yellow: 50-75%
  - Orange: 75-90%
  - Red: 90-100%
  - Dark Red: >100%

**Automated Alert System**
| Threshold | Trigger | Action |
|-----------|---------|--------|
| 25% | Line item reaches 25% execution | Email to Project Manager |
| 50% | Line item reaches 50% execution | Email to Dept Manager + Comment required |
| 75% | Line item reaches 75% execution | Email to RM Team + Action plan required |
| 90% | Line item reaches 90% execution | Email to CFO + Emergency review |
| Anomaly | Sudden spike in execution (>2σ) | Immediate alert to RM Team + Freeze option |

**3.2.7 Budget Modification Process**

**Modification Types**
1. **Line Item Addition/Deletion**
   - Add new unforeseen expense category
   - Remove obsolete line items
   - Maintain audit trail

2. **Budget Transfer Between Items**
   - Source item must have sufficient balance
   - Original purpose tagging (e.g., "Contingency → Construction Cost Overrun")
   - Require justification document

3. **Total Budget Increase**
   - Additional funding source identification
   - Approval from all stakeholders (Developer, Lender, Contractor)
   - Impact analysis on project ROI

**Traceability Features**
- Fund source tagging throughout lifecycle
- Modification reason documentation
- Approval history with digital signatures
- Before/After comparison view

---

#### Module 3: Cash Flow Projection & Simulation

**3.2.8 Dynamic Cash Flow Modeling**

**Input Data Sources**
- Pre-sale payment schedule (Contract, Down payment, Interim, Final)
- Construction payment schedule (linked to progress billing)
- Loan drawdown schedule
- Interest payment schedule
- Contribution payment deadlines

**Monthly Cash Flow Projection**
```
Month | Inflow | Outflow | Net | Cumulative | Min Cash
------|--------|---------|-----|------------|----------
Jan   | 5,000  | 3,200   |1,800| 1,800      | 1,800
Feb   | 3,500  | 4,100   |-600 | 1,200      | 1,200
Mar   | 2,000  | 5,500   |-3,500| -2,300    | -2,300 ⚠️
...
```

**Critical Point Detection**
- Identify minimum cash point
- Calculate required bridge financing
- Flag negative cash flow months

**3.2.9 Scenario Analysis Engine**

**Pre-defined Scenario Variables**
1. **Sales Scenarios**
   - Pre-sale timing delay: +3m, +6m, +12m
   - Pre-sale rate: 60%, 70%, 80%, 90%, 100%
   - Selling price adjustment: -10%, -5%, Base, +5%

2. **Construction Scenarios**
   - Cost overrun: +5%, +10%, +15%, +20%
   - Schedule delay: +2m, +4m, +6m
   - Material price escalation: +3%, +5%, +8%

3. **Financial Scenarios**
   - Interest rate change: +0.5%p, +1.0%p, +1.5%p
   - PF loan maturity extension: +6m, +12m
   - Bridge loan requirement

4. **Regulatory Scenarios**
   - Acquisition tax rate change
   - Corporate tax rate change
   - New contribution mandates

**Monte Carlo Simulation (Optional)**
- Run 10,000 iterations with variable distributions
- Probability distribution of final profit
- Value at Risk (VaR) calculation
- Stress test under worst-case scenarios

**3.2.10 Visual Analytics**

**Chart Types**
1. **Waterfall Chart**: Budget composition breakdown
2. **Gantt Chart**: Execution timeline by category
3. **Line Chart**: Monthly cumulative cash flow
4. **Area Chart**: Revenue vs. Expenditure over time
5. **Heatmap**: Execution rate by category and time
6. **Sankey Diagram**: Budget flow and transfers
7. **Gauge Chart**: Overall project health score

**Excel Export Features**
- Pivot table with all raw data
- Embedded formulas for recalculation
- Multiple worksheets (Summary, Detail, Cash Flow, Simulation)
- Print-optimized layout
- Password protection option

---

#### Module 4: AI-Powered Analytics & Reporting

**3.2.11 Automated Risk Detection**

**Anomaly Detection Algorithms**
- Time-series analysis for spending patterns
- Statistical outlier detection (Z-score > 3)
- Deviation from industry benchmarks
- Clustering analysis for similar projects

**Risk Indicators**
| Indicator | Formula | Threshold |
|-----------|---------|-----------|
| Construction Cost Shortage Risk | (Remaining Work / Remaining Budget) × 100 | >105% |
| Cash Flow Risk | Min(Monthly Cash Flow) / Avg(Monthly Expenditure) | <-1.5 |
| Execution Velocity Risk | Avg(Monthly Execution) × Remaining Months | >Remaining Budget |
| Interest Coverage Ratio | Operating Cash Flow / Interest Payment | <1.2 |

**3.2.12 AI Agent Integration**

**Natural Language Query Interface**
```
User: "Why did Q3 construction costs increase by 15%?"
AI: "Analysis shows three primary factors:
     1. Material price escalation (steel +12%, concrete +8%)
     2. Scope change: Additional basement waterproofing (₩1.2B)
     3. Schedule compression penalties (₩800M)
     
     Recommendation: Negotiate material price hedging for Q4."
```

**Automated Report Generation**
- **Weekly Executive Summary**
  - Top 5 execution items
  - Budget utilization rate
  - Alerts triggered
  - Key decisions required

- **Monthly Management Report**
  - Comprehensive financial position
  - Variance analysis (Budget vs. Actual)
  - Rolling forecast update
  - Risk assessment update

- **Board Report (Quarterly)**
  - Strategic KPIs
  - Scenario analysis results
  - Major decisions log
  - Recommendations

**3.2.13 Predictive Analytics**

**Machine Learning Models**
1. **Cost Overrun Prediction**
   - Features: Project type, scale, location, contractor history
   - Output: Probability of >10% overrun
   - Model: Gradient Boosting (XGBoost)

2. **Cash Flow Forecasting**
   - Features: Historical patterns, seasonality, market conditions
   - Output: 3-month forward cash flow
   - Model: LSTM Neural Network

3. **Pre-sale Success Prediction**
   - Features: Location, price, marketing spend, market sentiment
   - Output: Expected pre-sale rate by month
   - Model: Random Forest

---

## 4. Data Model

### 4.1 Entity Relationship Diagram (Conceptual)

```
┌─────────────────┐
│    Projects     │
├─────────────────┤
│ id (PK)         │
│ name            │
│ type            │─────┐
│ start_date      │     │
│ end_date        │     │
│ location        │     │
│ scale           │     │
│ target_roi      │     │
│ status          │     │
└─────────────────┘     │
         │              │
         │1             │
         │              │
         │*             │
┌─────────────────┐     │
│  Stakeholders   │     │
├─────────────────┤     │
│ id (PK)         │     │
│ project_id (FK) │─────┘
│ entity_name     │
│ role            │ (Developer/Contractor/Lender)
│ contact_info    │
└─────────────────┘
         │
         │
         │
┌─────────────────┐
│  BudgetMaster   │
├─────────────────┤
│ id (PK)         │
│ project_id (FK) │
│ version         │ (V1.0, V1.1, V2.0...)
│ status          │ (Draft/Approved/Archived)
│ total_revenue   │
│ total_expense   │
│ project_profit  │
│ approved_by     │
│ approved_at     │
└─────────────────┘
         │
         │1
         │
         │*
┌─────────────────┐
│  BudgetItems    │
├─────────────────┤
│ id (PK)         │
│ budget_id (FK)  │
│ category        │ (Revenue/Expenditure)
│ subcategory     │
│ item_code       │
│ item_name       │
│ initial_amount  │
│ current_amount  │
│ formula         │ (For auto-calculated items)
│ is_mandatory    │
└─────────────────┘
         │
         │1
         │
         │*
┌─────────────────┐
│   Executions    │
├─────────────────┤
│ id (PK)         │
│ project_id (FK) │
│ budget_item_id  │
│ request_number  │ (Auto-generated)
│ request_date    │
│ requester_id    │
│ amount          │
│ justification   │
│ status          │ (Draft/Pending/Approved/Rejected)
│ current_stage   │
└─────────────────┘
         │
         │1
         │
         │*
┌─────────────────┐
│ ApprovalHistory │
├─────────────────┤
│ id (PK)         │
│ execution_id    │
│ stage           │ (1/2/3/4)
│ approver_id     │
│ action          │ (Approved/Rejected/Returned)
│ comments        │
│ acted_at        │
└─────────────────┘

┌─────────────────┐
│ BudgetTransfers │
├─────────────────┤
│ id (PK)         │
│ project_id (FK) │
│ from_item_id    │
│ to_item_id      │
│ amount          │
│ original_purpose│ (Tagging)
│ reason          │
│ approved_by     │
│ transferred_at  │
└─────────────────┘

┌─────────────────┐
│   CashFlow      │
├─────────────────┤
│ id (PK)         │
│ project_id (FK) │
│ month           │
│ inflow          │
│ outflow         │
│ net_flow        │
│ cumulative      │
└─────────────────┘

┌─────────────────┐
│   Scenarios     │
├─────────────────┤
│ id (PK)         │
│ project_id (FK) │
│ name            │
│ variables       │ (JSONB)
│ results         │ (JSONB)
│ created_by      │
│ created_at      │
└─────────────────┘

┌─────────────────┐
│ AIAnalysisLogs  │
├─────────────────┤
│ id (PK)         │
│ project_id (FK) │
│ analysis_type   │
│ input_data      │ (JSONB)
│ output_result   │ (JSONB)
│ model_version   │
│ executed_at     │
└─────────────────┘

┌─────────────────┐
│ Notifications   │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ type            │ (Alert/Approval/Info)
│ title           │
│ message         │
│ read            │
│ created_at      │
└─────────────────┘

┌─────────────────┐
│     Users       │
├─────────────────┤
│ id (PK)         │
│ email           │
│ name            │
│ role            │
│ projects        │ (JSONB array)
│ permissions     │ (JSONB)
└─────────────────┘
```

### 4.2 Key Database Tables (PostgreSQL Schema)

```sql
-- Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'self', 'spc', 'joint', 'cooperative'
  start_date DATE,
  end_date DATE,
  location VARCHAR(255),
  scale JSONB, -- {total_area: 50000, units: 500, floors: 25}
  target_roi DECIMAL(5,2),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'suspended'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Budget Master Table
CREATE TABLE budget_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL, -- 'V1.0', 'V1.1'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'archived'
  total_revenue BIGINT NOT NULL,
  total_expense BIGINT NOT NULL,
  project_profit BIGINT GENERATED ALWAYS AS (total_revenue - total_expense) STORED,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, version)
);

-- Budget Items Table
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES budget_master(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'revenue', 'expenditure'
  subcategory VARCHAR(100),
  item_code VARCHAR(50) UNIQUE NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  initial_amount BIGINT NOT NULL,
  current_amount BIGINT NOT NULL,
  formula TEXT, -- For auto-calculated items
  is_mandatory BOOLEAN DEFAULT false,
  sort_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Executions Table
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  budget_item_id UUID REFERENCES budget_items(id),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  request_date DATE NOT NULL,
  requester_id UUID REFERENCES users(id),
  amount BIGINT NOT NULL,
  justification TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending', 'approved', 'rejected'
  current_stage INTEGER DEFAULT 1,
  attachment_urls TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Approval History Table
CREATE TABLE approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES executions(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL,
  approver_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'returned'
  comments TEXT,
  acted_at TIMESTAMP DEFAULT NOW()
);

-- Budget Transfers Table
CREATE TABLE budget_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  from_item_id UUID REFERENCES budget_items(id),
  to_item_id UUID REFERENCES budget_items(id),
  amount BIGINT NOT NULL,
  original_purpose VARCHAR(255), -- Tagging
  reason TEXT NOT NULL,
  approved_by UUID REFERENCES users(id),
  transferred_at TIMESTAMP DEFAULT NOW()
);

-- Cash Flow Table
CREATE TABLE cash_flow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  inflow BIGINT DEFAULT 0,
  outflow BIGINT DEFAULT 0,
  net_flow BIGINT GENERATED ALWAYS AS (inflow - outflow) STORED,
  cumulative BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, month)
);

-- Indexes for performance
CREATE INDEX idx_executions_project ON executions(project_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_budget_items_code ON budget_items(item_code);
CREATE INDEX idx_cash_flow_project_month ON cash_flow(project_id, month);
```

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Page load time: <2 seconds
- API response time: <500ms (p95)
- Large dataset rendering: Support 10,000+ budget items
- Concurrent users: Support 100+ simultaneous users
- Real-time updates: WebSocket latency <100ms

### 5.2 Security
- Authentication: OAuth 2.0 / SAML 2.0
- Authorization: Role-Based Access Control (RBAC)
- Data encryption: TLS 1.3 in transit, AES-256 at rest
- Audit logging: All write operations logged
- Session management: JWT with refresh tokens
- File upload: Virus scanning, type validation, size limits

### 5.3 Scalability
- Horizontal scaling: Stateless backend services
- Database: Read replicas for reporting queries
- Caching: Redis for frequently accessed data
- CDN: Static assets served via CDN

### 5.4 Reliability
- Uptime SLA: 99.9%
- Backup: Daily automated backups with 30-day retention
- Disaster recovery: RPO <4 hours, RTO <1 hour
- Error handling: Graceful degradation, retry logic

### 5.5 Usability
- Responsive design: Desktop (1920px), Tablet (768px), Mobile (375px)
- Accessibility: WCAG 2.1 AA compliance
- Browser support: Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
- i18n: Korean (primary), English (secondary)
- Dark mode: Optional theme switching

### 5.6 Maintainability
- Code coverage: >80% for critical paths
- Documentation: API docs (OpenAPI 3.0), architecture diagrams
- Logging: Structured logging (JSON format)
- Monitoring: Application metrics, error tracking

---

## 6. Integration Requirements

### 6.1 ERP System Integration
- **Bi-directional sync**
  - Budget data: XEM → ERP (initial budget setup)
  - Execution records: XEM → ERP (accounting entries)
  - Actual costs: ERP → XEM (periodic reconciliation)
- **Integration methods**
  - REST API (preferred)
  - SOAP Web Services (legacy systems)
  - Batch file transfer (SFTP)
- **Data mapping**
  - Budget item codes ↔ ERP GL accounts
  - Project IDs ↔ ERP cost centers

### 6.2 Email Integration
- **Inbound**: Parse developer requests from email
  - OCR for PDF attachments
  - NLP for email body extraction
- **Outbound**: Send notifications and reports
  - Approval requests
  - Alert notifications
  - Scheduled reports

### 6.3 Document Management
- **Supported formats**: PDF, DOCX, XLSX, PNG, JPG
- **Features**:
  - Version control
  - Full-text search
  - Metadata tagging
  - Digital signatures

---

## 7. User Interface Specifications

### 7.1 Design System

**Color Palette**
- Primary: #2563EB (Blue)
- Success: #10B981 (Green)
- Warning: #F59E0B (Amber)
- Danger: #EF4444 (Red)
- Neutral: #6B7280 (Gray)

**Typography**
- Headings: Inter (Semi-bold, 600)
- Body: Inter (Regular, 400)
- Code: Fira Code (Regular, 400)

**Spacing System**
- Base unit: 4px
- Scale: 0.5x, 1x, 1.5x, 2x, 3x, 4x, 6x, 8x

**Components**
- Based on shadcn/ui primitives
- Consistent interaction patterns
- Keyboard navigation support

### 7.2 Screen Specifications (Detailed in separate document)

---

## 8. Testing Requirements

### 8.1 Unit Testing
- Framework: Vitest + React Testing Library
- Coverage: >80% for business logic
- Focus areas: Budget calculations, validation logic

### 8.2 Integration Testing
- Framework: Playwright
- Scenarios: End-to-end approval workflows
- API testing: Supertest

### 8.3 Performance Testing
- Tool: k6 / Apache JMeter
- Scenarios: Concurrent user load, large data operations

### 8.4 Security Testing
- OWASP Top 10 compliance
- Penetration testing (annual)
- Dependency vulnerability scanning (automated)

---

## 9. Deployment & DevOps

### 9.1 Environments
- Development
- Staging
- Production

### 9.2 CI/CD Pipeline
```
Code Push → GitHub
    ↓
Automated Tests (GitHub Actions)
    ↓
Build Docker Images
    ↓
Push to Registry
    ↓
Deploy to Staging
    ↓
Manual Approval
    ↓
Deploy to Production
    ↓
Health Check & Monitoring
```

### 9.3 Monitoring & Alerting
- Application metrics: Response times, error rates
- Infrastructure metrics: CPU, memory, disk, network
- Business metrics: Daily execution count, approval cycle time
- Alerting: Slack/Email notifications for critical issues

---

## 10. Compliance & Governance

### 10.1 Data Privacy
- PIPA (Personal Information Protection Act) compliance (Korea)
- GDPR considerations (if operating in EU)
- Data retention policies

### 10.2 Audit Trail
- All write operations logged with:
  - User ID
  - Timestamp
  - Action type
  - Before/After values
  - IP address

### 10.3 Financial Controls
- Segregation of duties
- Maker-checker approval for critical operations
- Regular reconciliation with ERP systems

---

## 11. Future Enhancements (Roadmap)

### Phase 1 (MVP) - 6 months
- Core budget planning
- Basic execution workflow
- Simple dashboard

### Phase 2 - 9 months
- Advanced analytics
- Scenario simulation
- AI-powered insights

### Phase 3 - 12 months
- Mobile application
- OCR automation
- Blockchain-based approval (optional)

### Phase 4 - 15+ months
- Multi-project portfolio management
- Advanced ML predictions
- API marketplace for third-party integrations

---

## 12. Success Metrics

### 12.1 Operational KPIs
- Approval cycle time: <2 days (target)
- Budget deviation: <5% (target)
- System uptime: >99.9%
- User adoption rate: >90% within 3 months

### 12.2 Business Impact
- Cost overrun reduction: 20-30%
- Early warning detection: 60+ days advance notice
- Decision-making speed: 50% improvement
- Audit preparation time: 70% reduction

---

## Appendix A: Glossary

- **PF (Project Financing)**: Loan structure for real estate development
- **SPC (Special Purpose Company)**: Legal entity for project isolation
- **Congestion Charge**: Fee for developments in high-density areas
- **DSCR (Debt Service Coverage Ratio)**: Cash flow / Debt payments
- **VaR (Value at Risk)**: Worst-case financial loss estimate
- **ROI (Return on Investment)**: (Profit / Total Investment) × 100

---

## Appendix B: Reference Documents

1. Construction Industry Standard Budget Classifications (Korea)
2. Real Estate Development Financial Models (Best Practices)
3. OWASP Web Security Guidelines
4. Anthropic Claude API Documentation

---

**Document Control**
- Version: 1.0
- Date: 2025-11-12
- Author: Enterprise Architecture Team
- Status: Draft for Review
- Next Review: 2025-12-12
