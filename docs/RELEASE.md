# Release and operating guide

## Release acceptance gate

A public prototype release is acceptable only when all of the following pass:

1. `npm run check` passes lint, regression tests, TypeScript validation, and production build.
2. `npm audit --audit-level=high` reports no high or critical advisories.
3. Desktop and mobile smoke tests cover entry, navigation, demo reset, JSON import, stale-data state, PEAK-only navigation, return to demo, and sign-out removal.
4. The generated site makes no application request to PEAK or another data service.
5. `git diff` and repository search contain no real PEAK snapshot, credential, token, bank account number, or customer data.
6. GitHub Pages deploys from `main`, and its workflow completes successfully.

## Operator workflow

1. Open the public demo and enter with the prefilled sample account.
2. Select **นำเข้า PEAK**, choose the private schema-v3 JSON file, and confirm the company and capture time.
3. Treat all PEAK values as a read-only review snapshot. Follow any visible reconciliation or staleness warning before making a business decision.
4. Select **ออก** and confirm **ออกและลบ** before leaving a trusted device. Closing the tab also ends the private snapshot session.

## Deployment

Merge a reviewed branch into `main`. GitHub Actions installs locked dependencies, runs `npm run check`, builds the static site, and deploys `dist` to GitHub Pages.

## Rollback

If the live smoke test fails, revert the release commit on `main` and let the Pages workflow redeploy the previous build. Do not change or upload a private snapshot as part of rollback. For a local corrupted demo state, use **คืนค่าข้อมูล** on the error screen or **รีเซ็ต** inside the demo.

## Production blockers

This static Pages release is production-grade only as a public interface prototype. Financial production use remains blocked until there is a private backend with real identity and role-based access, organization isolation, encrypted server storage, PEAK API or governed ingestion, immutable audit logging, backup and restore, monitoring and incident response, data-retention controls, accounting-domain verification, and Thai tax/legal review.
