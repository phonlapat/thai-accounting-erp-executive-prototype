# Product pattern benchmark

Reviewed 12 August 2026. This is a feature-pattern benchmark, not a ranking or claim that Siam ERP has production integrations.

| Product | Useful pattern | Adapted in Siam ERP |
| --- | --- | --- |
| [FlowAccount](https://flowaccount.com/en/functions/business) | Thai tax calendar, owner-friendly financial view, and reconciliation | Tax readiness checklist and clearer Thai deadlines |
| [PEAK](https://www.peakaccount.com/peak-account) | e-Tax document workflows and statement-assisted bookkeeping | Demo e-Tax readiness and reviewable bank-match suggestions |
| [Xero](https://www.xero.com/us/accounting-software/analytics/cash-flow/) | Short-term cash forecast with expected money in and out | 30-day forecast on the executive dashboard and reports |
| [QuickBooks](https://quickbooks.intuit.com/learn-support/en-us/help-article/invoicing/send-invoice-reminders-automatically-manually/L84cQjpxo_US_en_US) | Structured invoice reminders | Demo reminder logging for overdue invoices |
| [Odoo](https://www.odoo.com/app/accounting-features) | Sales, inventory, purchasing, and accounting connected in one flow | Existing quote-to-cash and procure-to-pay flows now feed the same audit history |
| [NetSuite](https://www.netsuite.com/portal/assets/pdf/ds-netsuite-erp-emea.pdf) | Role-relevant KPIs and transaction audit visibility | A concise executive view plus searchable activity history |

Thai filing dates are checked against the [Revenue Department tax calendar](https://www.rd.go.th/62348/archive/2026/8.html?cHash=a76e8de590aa8504d4278d4428f3982a); August 2026 ภ.พ.30 is shown as 17 August for paper filing and 24 August for internet filing.

## Product boundary

- Bank matching uses local demo records; it does not connect to a bank.
- Reminder actions create a demo history entry; they do not send email.
- Tax readiness checks data completeness only; they do not create or submit official e-Tax documents or returns.
- Authentication, permissions, immutable audit records, integrations, backups, and concurrent processing require a production backend.
