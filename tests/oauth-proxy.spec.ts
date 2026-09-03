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
  const cookie = authResponse.headers.get('set-cookie')!.split(';', 1)[0];
  const state = cookie.split('=', 2)[1];
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

  test('starts configured authentication with a Decap handshake without exposing the secret', async () => {
    const response = await oauthFetch(request('/auth'), {
      GITHUB_CLIENT_ID: 'local-client-id',
      GITHUB_CLIENT_SECRET: ['local', 'client', 'secret'].join('-')
    });
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('authorizing:github');
    expect(body).toContain('https://kautilyamsc.com');
    expect(body).toContain('https://github.com/login/oauth/authorize');
    expect(body).toContain('client_id=local-client-id');
    expect(body).toContain('scope=public_repo');
    expect(response.headers.get('set-cookie')).toContain('kmsc_oauth_state=');
    expect(body).not.toContain(['local', 'client', 'secret'].join('-'));
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

  test('pins the requested scope so a crafted link cannot widen the token', async () => {
    const env = {
      GITHUB_CLIENT_ID: 'local-client-id',
      GITHUB_CLIENT_SECRET: ['local', 'client', 'secret'].join('-')
    };
    for (const attempt of ['repo', 'repo,delete_repo', 'admin:org', 'public_repo,admin:org', '']) {
      const response = await oauthFetch(request(`/auth?scope=${encodeURIComponent(attempt)}`), env);
      const body = await response.text();
      expect(body, `scope=${attempt} must not reach GitHub`).toContain('scope=public_repo&');
      for (const forbidden of ['delete_repo', 'admin%3Aorg', 'admin:org']) {
        expect(body, `scope=${attempt} leaked ${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  test('contains no hardcoded OAuth secret', async () => {
    const source = await readFile(resolve('worker/oauth-proxy.mjs'), 'utf8');
    expect(source).not.toMatch(/GITHUB_CLIENT_SECRET\s*[:=]\s*["'][^"']+["']/);
    expect(source).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY-----/);
  });
});
