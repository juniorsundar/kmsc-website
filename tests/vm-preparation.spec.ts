import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();

test('Caddy serves only the atomic live tree', async () => {
  const config = await readFile(join(root, 'deploy/caddy/Caddyfile'), 'utf8');
  expect(config).toContain('root * /srv/kmsc-website/live');
  expect(config).toContain('file_server');
  expect(config).not.toMatch(/reverse_proxy|headscale|8080|node|npm/i);
});

test('VM preparation is an explicit, additive dry-run', () => {
  const output = execFileSync('bash', [join(root, 'scripts/prepare-vm.sh'), '--root', '/tmp/kmsc-website'], { encoding: 'utf8' });
  expect(output).toContain('dry-run VM preparation plan complete');
  expect(output).toMatch(/allow.*HTTP/);
  expect(output).toMatch(/allow.*HTTPS/);
  expect(output).not.toMatch(/ufw (delete|deny|reset)/);
  expect(output).not.toMatch(/headscale|tailscale|ssh/i);
});

test('evidence collection names the required operational checks', async () => {
  const script = await readFile(join(root, 'scripts/vm-evidence.sh'), 'utf8');
  for (const command of ['systemctl', 'ss', 'ufw', 'df', 'free', 'live']) expect(script).toContain(command);
});
