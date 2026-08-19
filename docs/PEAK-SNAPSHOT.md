# PEAK snapshot v3

Siam ERP opens an allowlisted, read-only PEAK snapshot in the current browser tab. The file is never uploaded by the application and must never be committed to this repository.

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
