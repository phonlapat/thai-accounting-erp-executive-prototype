# Security policy

## Supported scope

This repository is a public, static product prototype. It contains fictional demo records and an allowlisted schema for a user-supplied PEAK executive snapshot. It does not provide production authentication, authorization, tenancy, server-side storage, audit immutability, backups, or a live PEAK integration.

## Private-data rules

- Never commit PEAK exports, snapshots, credentials, tokens, tax IDs, bank account numbers, or customer records.
- Keep private snapshot files outside this repository.
- Import snapshots only on a trusted device. The app validates them locally, strips unknown fields, stores the result in the current tab session, and removes it on sign-out or tab close.
- Bank account labels must be masked; an imported bank label containing six or more consecutive digits is rejected.
- Do not paste a real password into the sample entry form. It is not a production identity flow.

## Browser threat model

The prototype protects against accidental repository disclosure, persistence of private snapshots across browser sessions, unknown JSON fields, malformed arithmetic, and obvious unmasked bank labels. It does not protect against a compromised device, malicious browser extension, shared access to an open tab, developer-tools access, or hostile scripts introduced through a future code change.

## Reporting

Report a suspected issue privately to the repository owner. Do not include private business data or credentials in a public issue. Include reproduction steps using fictional data whenever possible.
