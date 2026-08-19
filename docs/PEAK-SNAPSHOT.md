# PEAK snapshot v3

Siam ERP opens an allowlisted, read-only PEAK snapshot in the current browser tab. The file is never uploaded by the application and must never be committed to this repository.

## Import assurance

The pre-open review is built only from the sanitized snapshot. Invalid JSON never produces an actionable preview, and the open action remains disabled until schema, chronology, arithmetic, identifiers, and allowlisted fields pass validation.

The review reports freshness, monthly-history gaps, source-page lag, captured income and expense rows, quality findings, and the declared bank-evidence coverage. These are separate evidence signals, not a combined quality score. A warning does not disappear when the snapshot opens.

Source-page and activity timestamps later than the snapshot capture time are rejected. Missing months remain missing and sample bank evidence remains labelled as a sample.

## Reporting history

`monthlyPL` accepts 2–60 unique monthly rows. This supports the five-year reporting range available in PEAK while keeping the imported snapshot bounded.

- The 3-, 6-, and 12-month views keep exact monthly marks.
- A view longer than 12 months aggregates chart marks by calendar year. The monthly statement table remains unaggregated.
- Period comparison appears only when both the selected window and the immediately preceding equal-length window are complete, contiguous, and closed. A missing or open month suppresses the comparison instead of being treated as zero.
- Partial calendar years show the number of included months. They are not presented as full-year results.

The dashboard never annualizes a partial year or infers an absent month.

## Bank reconciliation evidence

Each `financeAccounts` row always requires `id`, `type`, `name`, and `balance`. A bank row may also include:

| Field | Meaning |
| --- | --- |
| `reconciliationStatus` | `not_started`, `partial`, or `complete`, copied from the visible PEAK bank status. |
| `unmatchedCount` | Visible unresolved item count. Omit when the source does not show an exact count; omission means unknown, not zero. |
| `lastReconciledAt` | Visible reconciliation timestamp in ISO 8601 form. Omit when it is not shown. |

These optional fields are rejected on cash and e-Wallet rows. A `complete` bank row cannot have a non-zero `unmatchedCount`, and `lastReconciledAt` cannot be later than the snapshot capture time.

```json
{
  "id": "bank-primary",
  "type": "bank",
  "name": "ธนาคารตัวอย่าง •••• 1234",
  "balance": 0,
  "reconciliationStatus": "partial",
  "unmatchedCount": 3,
  "lastReconciledAt": "2026-08-20T09:30:00+07:00"
}
```

The example is synthetic. Real balances, names, records, screenshots, credentials, tokens, and snapshots remain outside Git and CI.

Legacy schema-v3 snapshots without account-level reconciliation fields remain valid. Siam ERP hides the account-level reconciliation columns and does not infer their values.

## Unmatched bank-item evidence

`bankReconciliation` is optional. It appears only when unmatched bank rows were visibly inspected. Each group belongs to one incomplete bank account and declares its coverage:

- `full`: every visible unmatched row was captured. The row count must equal the account's `unmatchedCount`.
- `sample`: only a bounded sample was captured. The interface labels it as partial and never treats it as the complete queue.

A row requires a transaction date, description, direction, and positive amount. A candidate document is optional. Candidate confidence is accepted only with explicit matching signals: amount, date, reference, or party. High confidence requires at least three distinct signals. The application presents candidates for review; it never confirms a match or writes to PEAK.

```json
{
  "bankReconciliation": [
    {
      "accountId": "bank-primary",
      "coverage": "sample",
      "items": [
        {
          "id": "bank-row-example-1",
          "date": "2026-08-20",
          "description": "รับโอนตัวอย่าง",
          "direction": "inflow",
          "amount": 1500,
          "reference": "IV-EXAMPLE-001",
          "candidate": {
            "kind": "income",
            "documentNo": "IV-EXAMPLE-001",
            "party": "บริษัท ตัวอย่าง จำกัด",
            "issueDate": "2026-08-20",
            "amount": 1500,
            "confidence": "high",
            "signals": ["amount", "date", "reference"]
          }
        }
      ]
    }
  ]
}
```

The example is synthetic. Transaction descriptions, counterparties, references, and suggested documents are private financial data and must remain browser-local.
