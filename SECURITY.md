# Security boundary

Siam ERP is a public, static executive-review prototype. The repository and deployed site must contain no PEAK credential, token, company snapshot, financial value, customer record, bank detail, or other private business data.

## Protected data

- A validated PEAK snapshot is parsed locally, rebuilt from an explicit field allowlist, and kept only in the current browser tab.
- Private snapshot data is removed on exit, tab close, or after 15 minutes without activity.
- Persistent freshness history is limited to the source data date and inspection time. It excludes company identity, balances, documents, counterparties, and evidence rows.
- The public zero-data state must never substitute demo values for missing or private data.

## Browser boundary

Production builds inject an early Content Security Policy that permits only the generated same-origin script and stylesheet plus local/data images. It blocks application network connections, form submissions, frames, media, workers, plug-ins, inline scripts, inline event handlers, style attributes parsed from markup, and base URL changes. Runtime chart geometry uses direct, numeric DOM style properties and is browser-tested under the policy.

The source `index.html` intentionally omits this policy so Vite development can use its local connection. `npm run build` injects the production policy and then runs `scripts/verify-production-security.mjs`. The build fails if the policy is missing, duplicated, reordered after executable resources, weakened, or paired with inline or external executable assets.

The document also uses a `no-referrer` policy. Links to PEAK are ordinary top-level navigation and do not grant this site access to the PEAK session.

## Static-hosting limits

The policy is delivered in HTML because GitHub Pages does not give this repository an application server. A meta-delivered CSP cannot enforce `frame-ancestors`, use report-only mode, or send violation reports. Response-header controls such as clickjacking protection, HSTS ownership, MIME sniffing protection, cross-origin isolation, and a permissions policy require controlled hosting in front of the app.

This means the Pages deployment is suitable for public interface evaluation, not production financial processing. Production use additionally requires private hosting, authenticated organizations, role-based access, server-side validation, encrypted storage, immutable audit logs, backups, monitoring, incident response, retention controls, and accounting/legal verification.

## Release checks

Every release must pass `npm run check`, `npm audit --audit-level=high`, repository secret/private-data inspection, desktop and mobile smoke tests, and a successful GitHub Pages deployment. See [docs/RELEASE.md](docs/RELEASE.md).

## Reporting a vulnerability

Do not include private financial data or credentials in an issue. Use the repository's private security-advisory channel when available; otherwise report only the minimal reproduction and affected public code path.
