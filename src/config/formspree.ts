const placeholderEndpoint = 'https://formspree.io/f/placeholder';
const endpointPattern = /^https:\/\/formspree\.io\/f\/[^/]+$/;

/**
 * Resolve the public Formspree endpoint at build time.
 *
 * The endpoint is not a credential, but it is deliberately supplied as a
 * deployment variable so a provider form ID is never guessed or committed.
 * The content value remains useful for local preview and browser tests.
 */
export function getFormspreeEndpoint(contentEndpoint?: string): string {
  const endpoint = import.meta.env.PUBLIC_FORMSPREE_ENDPOINT || contentEndpoint || placeholderEndpoint;
  if (!endpointPattern.test(endpoint)) {
    throw new Error('PUBLIC_FORMSPREE_ENDPOINT must be an https://formspree.io/f/<form-id> URL.');
  }
  if (import.meta.env.PUBLIC_INDEXING_ENABLED === 'true' && endpoint === placeholderEndpoint) {
    throw new Error('PUBLIC_FORMSPREE_ENDPOINT is required for an indexable production build.');
  }
  return endpoint;
}

export const isPlaceholderFormspreeEndpoint = (endpoint: string) => endpoint === placeholderEndpoint;
