# FinAudit - 4-Hour Hackathon Execution README

## Context

We are building **FinAudit** for **Theme 11: FinAudit - Detecteur d'Anomalies Comptables**.

The goal is to produce a working MVP that helps an auditor import accounting transactions, run automatic anomaly checks, and get AI-assisted explanations for suspicious records.

We have **5 people** and **4 hours left**, so the priority is a reliable demo, not a complete accounting platform.

## One-Sentence Product Pitch

FinAudit helps auditors quickly detect suspicious accounting transactions from CSV files, prioritize high-risk anomalies, and receive AI-generated audit recommendations.

## MVP Scope

We will build only the features needed for a strong 3-minute demo:

- Load demo accounting data.
- Upload a CSV file if time allows.
- Display transactions in a searchable/filterable table.
- Run rule-based anomaly detection.
- Show dashboard metrics and risk distribution.
- Show an anomaly report with reasons.
- Generate AI or mock-AI explanations for suspicious transactions.

## Out Of Scope

Do not spend time on these unless everything above is finished:

- User authentication.
- Database persistence.
- Complex machine learning training.
- Real accounting integrations.
- Multi-company management.
- PDF export.
- Full role/permission system.

## Technology Stack

### Frontend

- **Next.js**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** if already available or quick to install
- **Recharts** for charts

### Data Processing

- **PapaParse** for CSV parsing
- TypeScript functions for audit rules
- In-memory/local state for hackathon speed

### Backend

Use a minimal backend with **Next.js API routes** only.

Backend responsibilities:

- Securely call the AI API.
- Return AI anomaly explanations.
- Provide a mock fallback if no API key is available.

Do **not** build a separate Express/NestJS backend for this MVP.

### AI Bonus

Use one of:

- OpenAI API
- Gemini API
- Mock AI fallback with predefined explanation templates

The AI feature must be visible in the demo. The safest button is:

> Explain anomalies with AI

## App Screens

### 1. Dashboard

Purpose: show the overall audit status.

Must include:

- Total transactions
- Total debit
- Total credit
- Balance difference
- Number of suspicious transactions
- High/medium/low risk count
- Small chart: normal vs suspicious or risk distribution
- Recent anomalies

### 2. Transactions

Purpose: show all imported accounting lines.

Must include:

- Table with date, account code, vendor, invoice number, description, debit, credit, amount, risk status.
- Filter: All, Normal, Suspicious, High Risk.
- Search by vendor, invoice number, or description.
- Suspicious rows visually highlighted.

### 3. Anomaly Report

Purpose: help the auditor understand what to verify.

Must include:

- List of suspicious transactions.
- Detection reasons.
- Risk level.
- Recommended action.
- AI explanation button/result.

## CSV Format

Use this format for demo data and upload:

```csv
date,accountCode,description,vendor,invoiceNumber,debit,credit,amount
2026-05-01,601,Achat materiel informatique,TechPro,INV-001,500000,0,500000
2026-05-02,602,Prestation consultant,ConsultPlus,INV-002,1200000,0,1200000
2026-05-04,,Paiement fournisseur inconnu,Unknown Vendor,INV-003,300000,0,300000
2026-05-04,601,Achat materiel informatique,TechPro,INV-001,500000,0,500000
```

## Anomaly Detection Rules

Implement simple, reliable rules first:

| Rule | Risk | Description |
|---|---|---|
| Duplicate invoice number | High | Same invoice appears more than once |
| Missing account code | Medium | Account code is empty |
| Negative amount | High | Amount is less than zero |
| Very large amount | High | Amount is above a fixed threshold or statistical threshold |
| Debit/credit imbalance | High | Total debit and total credit are not balanced |
| Weekend transaction | Medium | Transaction date is Saturday or Sunday |
| Suspicious round amount | Low/Medium | Amount is a large round number |
| Rare vendor with large amount | High | Vendor appears once and amount is large |

Start with fixed thresholds. Example:

- Very large amount: amount greater than `1,000,000`.
- Suspicious round amount: amount divisible by `100,000`.

## Data Model

```ts
type Transaction = {
  id: string;
  date: string;
  accountCode: string;
  description: string;
  vendor: string;
  invoiceNumber: string;
  debit: number;
  credit: number;
  amount: number;
};

type AuditFinding = {
  transactionId: string;
  risk: "low" | "medium" | "high";
  reasons: string[];
  recommendation: string;
  aiExplanation?: string;
};
```

## Team Repartition

### Person 1 - Frontend/UI Lead

Main responsibility: make the app look professional and demo-ready.

Tasks:

- Create layout/navigation.
- Build dashboard cards.
- Build transactions table.
- Add filters/search UI.
- Add risk badges and row highlighting.
- Help integrate final data from the audit logic.

Deliverable after 2 hours:

- Dashboard and transactions screens visible with demo data.

### Person 2 - Data & Audit Logic Lead

Main responsibility: make anomaly detection work.

Tasks:

- Create demo CSV/data file.
- Implement transaction types.
- Implement CSV parsing with PapaParse.
- Implement audit rules.
- Compute summary metrics.
- Return findings with risk level and reasons.

Deliverable after 2 hours:

- `runAudit(transactions)` returns suspicious transactions with reasons and risk levels.

### Person 3 - AI/API Lead

Main responsibility: secure and demo-safe AI explanation.

Tasks:

- Create `/api/explain-anomalies`.
- Call OpenAI/Gemini if API key exists.
- Return mock AI explanations if API key is missing.
- Add frontend action button: "Explain anomalies with AI".
- Format AI response as risk explanation + recommended action.

Deliverable after 2 hours:

- AI button works even without internet/API key using fallback.

### Person 4 - Product & Pitch Lead

Main responsibility: make sure the final project tells a clear story.

Tasks:

- Prepare clean demo data with obvious anomalies.
- Write the 3-minute pitch.
- Test the full demo flow repeatedly.
- Help polish labels, empty states, and final wording.
- Prepare final backup screenshots if deployment fails.
- Keep the team focused on the MVP and stop scope creep.

Deliverable after 2 hours:

- Demo script ready and sample data validated.

### Person 5 - Integration, QA & Deployment Lead

Main responsibility: make sure all parts work together and the final demo does not break.

Tasks:

- Own the main branch/final integrated version.
- Connect UI, audit logic, demo data, and AI endpoint.
- Run the app frequently after each merge/change.
- Track blocking bugs and assign quick fixes.
- Prepare deployment if possible.
- Keep a local demo ready as backup.

Deliverable after 2 hours:

- Full flow works locally: load data, run audit, show anomalies, generate AI/mock-AI explanation.

## 4-Hour Execution Plan

### 0:00 - 0:15: Alignment

- Confirm stack.
- Confirm files/screens.
- Assign responsibilities.
- Create demo data immediately.
- Person 5 becomes final integrator and controls the final runnable version.

### 0:15 - 1:15: Build Core Skeleton

- Frontend creates layout, dashboard, table.
- Data lead creates transaction types, demo data, parsing function.
- AI lead creates API route with mock response first.
- Product lead writes demo script and validates sample anomalies.
- Integration lead starts the app, checks project setup, and prepares the final integration path.

### 1:15 - 2:15: Core Feature Completion

- Implement `runAudit`.
- Connect dashboard metrics.
- Highlight suspicious rows.
- Add anomaly report page/section.
- Make AI button return useful explanations.
- Integration lead connects the first full end-to-end flow.

### 2:15 - 3:00: Integration

- Connect all screens to the same data flow.
- Verify demo data works from start to finish.
- Fix broken states.
- Make sure the app works even without real CSV upload.
- Product lead rehearses the demo while integration lead fixes blocking issues.

### 3:00 - 3:30: Polish

- Improve spacing, labels, colors, and risk badges.
- Add loading states for AI.
- Add empty state before data load.
- Add chart if not already done.

### 3:30 - 4:00: Demo Preparation

- Run through the demo at least 3 times.
- Fix only blocking bugs.
- Deploy if possible.
- Keep local demo ready as backup.
- Presenter memorizes the pitch and flow.
- Stop adding features; only stabilize the demo.

## Recommended Demo Flow

1. Open FinAudit.
2. Click **Load Demo Data**.
3. Show the dashboard metrics.
4. Open the transactions table.
5. Click **Run Audit**.
6. Suspicious rows become highlighted.
7. Open the anomaly report.
8. Click **Explain anomalies with AI**.
9. Show risk explanations and auditor recommendations.
10. End with the value proposition.

## 3-Minute Pitch Structure

### Problem

Auditors often receive large accounting files and must manually identify duplicates, missing accounts, abnormal amounts, and suspicious payments.

### Solution

FinAudit imports transaction data, runs automatic audit checks, prioritizes anomalies by risk, and uses AI to explain why each transaction requires verification.

### Demo

Show CSV/demo data, run audit, show suspicious rows, then show AI explanations.

### Impact

FinAudit reduces manual review time, improves audit consistency, and helps teams focus on the riskiest transactions first.

## AI Prompt Template

Use this prompt for the AI endpoint:

```txt
You are an accounting audit assistant.

Analyze the following suspicious transaction and explain:
1. Why it is risky.
2. The risk level: low, medium, or high.
3. What the auditor should verify next.

Transaction:
{transaction_json}

Detected rule reasons:
{reasons}

Return a concise professional audit explanation.
```

## Demo Data Requirements

The demo dataset must include at least:

- 1 duplicate invoice.
- 1 missing account code.
- 1 very large amount.
- 1 weekend transaction.
- 1 rare vendor with a large amount.
- 1 normal transaction.

This guarantees the demo always shows useful findings.

## Definition Of Done

The project is demo-ready when:

- The app opens without errors.
- Demo data can be loaded.
- Audit can be run.
- At least 5 anomaly types are detected.
- Dashboard metrics update correctly.
- Suspicious transactions are highlighted.
- AI or mock-AI explanations are displayed.
- The presenter can complete the demo in less than 3 minutes.

## Emergency Fallback Plan

If CSV upload breaks:

- Use only **Load Demo Data**.

If AI API fails:

- Use mock explanations.

If charts break:

- Remove charts and keep summary cards.

If deployment fails:

- Demo locally.

If time is almost finished:

- Prioritize working flow over extra features.

## Final Priority

The winning version is not the biggest version.

The winning version is the one where the judges can clearly see:

- What problem we solve.
- How the auditor uses the app.
- Which anomalies were detected.
- How AI improves the audit process.
