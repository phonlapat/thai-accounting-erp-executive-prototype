import { readFile } from 'node:fs/promises';
import { PRODUCTION_CSP, PRODUCTION_CSP_DIRECTIVES } from './security-policy.mjs';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const sourceHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const failures = [];

const cspTags = html.match(/<meta\s+[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi) ?? [];
if (cspTags.length !== 1) failures.push(`expected one production CSP meta tag, found ${cspTags.length}`);

const encodedCsp = cspTags[0]?.match(/content="([^"]*)"/i)?.[1] ?? cspTags[0]?.match(/content='([^']*)'/i)?.[1];
const decodedCsp = encodedCsp
  ?.replaceAll('&#39;', "'")
  .replaceAll('&quot;', '"')
  .replaceAll('&amp;', '&');
if (!decodedCsp || decodedCsp !== PRODUCTION_CSP) failures.push('production CSP does not exactly match the audited policy');

for (const directive of PRODUCTION_CSP_DIRECTIVES) {
  if (!decodedCsp?.split('; ').includes(directive)) failures.push(`missing CSP directive: ${directive}`);
}

const cspPosition = cspTags[0] ? html.indexOf(cspTags[0]) : -1;
const firstExecutablePosition = Math.min(
  ...[html.search(/<script\b/i), html.search(/<link\b[^>]*rel=["']stylesheet["']/i)].filter((position) => position >= 0),
);
if (cspPosition < 0 || !Number.isFinite(firstExecutablePosition) || cspPosition > firstExecutablePosition) {
  failures.push('CSP must appear before every script and stylesheet');
}

const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
for (const [, attributes, body] of scriptTags) {
  if (!/\bsrc=["'][^"']+["']/i.test(attributes) || body.trim()) failures.push('inline or source-less script found in production HTML');
}

if (/\son[a-z]+\s*=/i.test(html)) failures.push('inline event handler found in production HTML');
if (/<(?:script|img|link)\b[^>]*(?:src|href)=["']https?:\/\//i.test(html)) failures.push('external executable or presentation asset found in production HTML');
if (/http-equiv=["']Content-Security-Policy["']/i.test(sourceHtml)) failures.push('development HTML must not carry the production CSP');
if (!/<div\s+id=["']root["']><\/div>/i.test(html)) failures.push('production application root is missing');

if (failures.length) {
  console.error('Production security verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Production security boundary verified.');
}
