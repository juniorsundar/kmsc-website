import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';


test('production Caddy config serves the canonical host and redirects www', async () => {
  const config = await readFile('deploy/caddy/Caddyfile', 'utf8');
  expect(config).toContain('kautilyamsc.com {');
  expect(config).toContain('www.kautilyamsc.com {');
  expect(config).toContain('root * /srv/kmsc-website/live');
  expect(config).toContain('file_server');
  expect(config).toContain('redir https://kautilyamsc.com{uri} permanent');
  expect(config).not.toMatch(/reverse_proxy|headscale|8080|node|npm/i);
});

test('production smoke check is read-only and covers the launch gate', async () => {
  const script = await readFile('scripts/production-smoke-check.sh', 'utf8');
  expect(script).toContain('dig +short A');
  expect(script).toContain('https://$canonical');
  expect(script).toContain('301');
  expect(script).toContain('headscale_port=8080');
  expect(script).not.toMatch(/(ufw|systemctl|cloudflare|registrar).*\b(add|delete|set|reload|update)/i);
});

test('domain runbook defers DNSSEC until ordinary DNS is stable', async () => {
  const runbook = await readFile('docs/production-domain-cutover.md', 'utf8');
  expect(runbook).toContain('DNSSEC **disabled**');
  expect(runbook).toContain('scripts/production-smoke-check.sh');
  expect(runbook).toContain('TCP 8080');
  expect(runbook).toContain('payment details');
});
