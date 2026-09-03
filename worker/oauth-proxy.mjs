const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const stateCookie = 'kmsc_oauth_state';
// The editor only ever needs to commit content to one public repository. The
// requested scope is pinned rather than forwarded, so a crafted /auth link can
// never widen what the minted token is able to do.
const allowedScopes = new Set(['public_repo']);
const defaultScope = 'public_repo';

function html(value) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function page(message) {
  return new Response(`<!doctype html><meta charset="utf-8"><title>KMSC Editor authentication</title><p>${html(message)}</p>`, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function authorizationPage(authorization, origin) {
  const target = JSON.stringify(authorization);
  const messageOrigin = JSON.stringify(origin);
  return new Response(`<!doctype html><meta charset="utf-8"><title>KMSC Editor authentication</title><script>
    const openerOrigin = ${messageOrigin};
    const authorizationUrl = ${target};
    window.opener && window.opener.postMessage('authorizing:github', openerOrigin);
    window.addEventListener('message', event => {
      if (event.origin === openerOrigin && event.data === 'authorizing:github') {
        window.location.href = authorizationUrl;
      }
    });
  </script>`, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function resultPage(status, payload, origin) {
  const serialized = JSON.stringify(payload).replace(/</g, '\\u003c');
  const message = `authorization:github:${status}:${serialized}`;
  return new Response(`<!doctype html><meta charset="utf-8"><script>window.opener&&window.opener.postMessage(${JSON.stringify(message)}, ${JSON.stringify(origin)});window.close();</script>`, {
    status: status === 'error' ? 502 : 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function isConfigured(env) {
  return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
}

async function authenticate(request, env) {
  if (!isConfigured(env)) return page('OAuth proxy dry-run: configure the GitHub OAuth application before editor login.');

  const requestUrl = new URL(request.url);
  const redirect = new URL('/callback', requestUrl.origin).toString();
  const state = crypto.randomUUID();
  const authorization = new URL(GITHUB_AUTHORIZE_URL);
  authorization.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorization.searchParams.set('redirect_uri', redirect);
  const requestedScope = requestUrl.searchParams.get('scope');
  authorization.searchParams.set('scope', allowedScopes.has(requestedScope) ? requestedScope : defaultScope);
  authorization.searchParams.set('state', state);
  const messageOrigin = env.CMS_ORIGIN || 'https://kautilyamsc.com';
  return new Response(authorizationPage(authorization.toString(), messageOrigin).body, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'set-cookie': `${stateCookie}=${state}; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=600`
    }
  });
}

async function callback(request, env) {
  if (!isConfigured(env)) return page('OAuth proxy dry-run: no GitHub token exchange was attempted.');

  const callbackUrl = new URL(request.url);
  const code = callbackUrl.searchParams.get('code');
  const returnedState = callbackUrl.searchParams.get('state');
  const expectedState = request.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${stateCookie}=([^;]+)`))?.[1];
  const messageOrigin = env.CMS_ORIGIN || 'https://kautilyamsc.com';
  if (!code) return resultPage('error', { error: 'missing_code' }, messageOrigin);
  if (!returnedState || !expectedState || returnedState !== expectedState) return resultPage('error', { error: 'invalid_state' }, messageOrigin);

  const redirect = new URL('/callback', callbackUrl.origin).toString();
  let response;
  try {
    response = await globalThis.fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: redirect })
    });
  } catch {
    return resultPage('error', { error: 'token_exchange_failed' }, messageOrigin);
  }

  if (!response.ok) return resultPage('error', { error: 'token_exchange_failed' }, messageOrigin);
  let token;
  try {
    token = (await response.json()).access_token;
  } catch {
    return resultPage('error', { error: 'invalid_token_response' }, messageOrigin);
  }
  if (typeof token !== 'string' || token.length === 0) return resultPage('error', { error: 'invalid_token_response' }, messageOrigin);
  return resultPage('success', { token, provider: 'github' }, messageOrigin);
}

export async function fetch(request, env = {}) {
  const url = new URL(request.url);
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  if (url.pathname === '/auth') return authenticate(request, env);
  if (url.pathname === '/callback') return callback(request, env);
  return new Response('Not found', { status: 404 });
}

export default { fetch };
