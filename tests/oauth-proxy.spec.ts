import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fetch as oauthFetch } from '../worker/oauth-proxy.mjs';

function request(path: string) {
  return new Request(`https://auth.example.test${path}`);
}

async function configuredCallback(path: string) {
  const clientSecret = ['local', 'client', 'secret'].join('-');
  const authResponse = await oauthFetch(request('/auth'), {
    GITHUB_CLIENT_ID: 'local-client-id',
    GITHUB_CLIENT_SECRET: clientSecret,
    CMS_ORIGIN: 'https://auth.example.test'
  });
  const state = new URL(authResponse.headers.get('location')!).searchParams.get('state');
  const cookie = authResponse.headers.get('set-cookie')!.split(';', 1)[0];
  return oauthFetch(new Request(`https://auth.example.test${path}&state=${state}`, { headers: { cookie } }), {
    GITHUB_CLIENT_ID: 'local-client-id',
    GITHUB_CLIENT_SECRET: clientSecret,
    CMS_ORIGIN: 'https://auth.example.test'
  });
}

test.describe('OAuth proxy', () => {
  test('supports an unconfigured local dry run without contacting GitHub', async () => {
    const response = await oauthFetch(request('/auth'), {});
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('dry-run');
  });

  test('redirects configured authentication to GitHub without exposing the secret', async () => {
    const response = await oauthFetch(request('/auth'), {
      GITHUB_CLIENT_ID: 'local-client-id',
      GITHUB_CLIENT_SECRET: ['local', 'client', 'secret'].join('-')
    });
    const location = response.headers.get('location') ?? '';
    expect(response.status).toBe(302);
    expect(location).toContain('https://github.com/login/oauth/authorize');
    expect(location).toContain('client_id=local-client-id');
    expect(location).toContain('scope=public_repo');
    expect(location).toContain('state=');
    expect(location).not.toContain(['local', 'client', 'secret'].join('-'));
  });

  test('exchanges a code and never sends the client secret to the browser', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      expect(String(input)).toBe('https://github.com/login/oauth/access_token');
      const body = JSON.parse(String(init?.body)) as Record<string, string>;
      expect(body.client_secret).toBe(['local', 'client', 'secret'].join('-'));
      expect(body.redirect_uri).toBe('https://auth.example.test/callback');
      return new Response(JSON.stringify({ access_token: 'github-token-for-test', token_type: 'bearer' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    };
    try {
      const response = await configuredCallback('/callback?code=one-time-code');
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(body).toContain('github-token-for-test');
      expect(body).not.toContain(['local', 'client', 'secret'].join('-'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('returns a safe error when GitHub rejects the exchange', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response('rejected', { status: 401 });
    try {
      const response = await configuredCallback('/callback?code=bad-code');
      const body = await response.text();
      expect(response.status).toBe(502);
      expect(body).not.toContain(['local', 'client', 'secret'].join('-'));
      expect(body).not.toContain('rejected');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('contains no hardcoded OAuth secret', async () => {
    const source = await readFile(resolve('worker/oauth-proxy.mjs'), 'utf8');
    expect(source).not.toMatch(/GITHUB_CLIENT_SECRET\s*[:=]\s*["'][^"']+["']/);
    expect(source).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY-----/);
  });
});
