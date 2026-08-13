# Thai Accounting + ERP Executive Prototype

An interactive Thai-language executive workbench for exploring accounting and ERP workflows across sales, purchasing, expenses, inventory, banking, payroll, assets, projects, tax, and management reporting.

## Online app

[Open Siam ERP](https://phonlapat.github.io/thai-accounting-erp-executive-prototype/)

The public app is **PEAK-only**. It does not display fictional invoices, balances, or operational records. Until a validated private snapshot is supplied, the app shows a zero-data access gate.

Choose **เลือก snapshot PEAK** and load a validated schema-v3 snapshot. If there is no API connection, open PEAK, sign in, and ask Codex to perform the manual inspection and browser-local import. The read-only workspace includes Overview, Revenue, Expenses, Cash & Bank, Financial Statements, and Data Checks. The validated snapshot is kept only in the current browser tab, removed on exit or tab close, and never included in this public repository. Unknown fields are stripped before the snapshot reaches application state.

PEAK mode is source-aware: it records when each PEAK page was inspected, keeps repeated document numbers when they represent different status-history rows, and shows unresolved reconciliation differences without collapsing them into a false single total. It is still a manually captured snapshot, not a live PEAK API connection.

> Prototype notice: this project is intended for private executive review. It is not production accounting software and should not be used for tax filing, payroll calculation, or authoritative financial reporting.

This static app does not provide production authentication. The snapshot itself stays browser-local; real identity, roles, and automatic PEAK synchronization require a private backend.

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run check
```

This runs linting, regression tests, TypeScript checks, and the production build. The Pages workflow runs the same gate before deployment.

## Security and release boundary

- No PEAK snapshot, token, password, or private financial record belongs in Git, issues, CI artifacts, or screenshots.
- The static site makes no application network requests; imported JSON is parsed locally and rebuilt from an audited field allowlist.
- See [SECURITY.md](SECURITY.md) for the threat model and [docs/RELEASE.md](docs/RELEASE.md) for verification, rollback, and production blockers.

Originally generated from a [Magic Patterns design](https://www.magicpatterns.com/c/2sy9ramnbdehhpmp42bjdk) and hardened as a PEAK-only executive-review interface.
