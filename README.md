# Thai Accounting + ERP Executive Prototype

An interactive Thai-language executive workbench for exploring accounting and ERP workflows across sales, purchasing, expenses, inventory, banking, payroll, assets, projects, tax, and management reporting.

## Online demo

[Open the interactive demo](https://phonlapat.github.io/thai-accounting-erp-executive-prototype/)

The default records are fictional demonstration data. The sample account is prefilled on the entry screen; choose **เปิดพื้นที่ทดลอง** to enter. Changes are stored only in the current browser; use **รีเซ็ต** to restore the original sample.

The workbench can also load a validated PEAK snapshot from **นำเข้า PEAK**. PEAK mode is a separate read-only workspace with Overview, Revenue, Expenses, Cash & Bank, Financial Statements, and Data Checks. Demo modules and write actions are hidden while real data is active. The validated snapshot is kept only in the current browser tab, removed on sign-out or tab close, and never included in this public repository. Unknown fields are stripped before the snapshot reaches application state.

PEAK mode is source-aware: it records when each PEAK page was inspected, keeps repeated document numbers when they represent different status-history rows, and shows unresolved reconciliation differences without collapsing them into a false single total. It is still a manually captured snapshot, not a live PEAK API connection.

> Prototype notice: this project is intended for interface and workflow exploration. It is not production accounting software and should not be used for tax filing, payroll calculation, or financial reporting.

The entry screen is also a prototype. It accepts only the displayed sample account, stores a temporary browser session, and is not connected to a production identity provider or permission system.

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run check
```

This runs linting, nine regression tests, TypeScript checks, and the production build. The Pages workflow runs the same gate before deployment.

## Security and release boundary

- No PEAK snapshot, token, password, or private financial record belongs in Git, issues, CI artifacts, or screenshots.
- The static site makes no application network requests; imported JSON is parsed locally and rebuilt from an audited field allowlist.
- See [SECURITY.md](SECURITY.md) for the threat model and [docs/RELEASE.md](docs/RELEASE.md) for verification, rollback, and production blockers.

Originally generated from a [Magic Patterns design](https://www.magicpatterns.com/c/2sy9ramnbdehhpmp42bjdk) and prepared as a public demonstration repository.
