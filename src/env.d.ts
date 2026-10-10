/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_INDEXING_ENABLED?: string;
  readonly PUBLIC_FORMSPREE_ENDPOINT?: string;
  readonly PUBLIC_FORMSPREE_RECAPTCHA_SITE_KEY?: string;
}

// turndown-plugin-gfm ships no types; this is the one export we use.
declare module 'turndown-plugin-gfm' {
  import type TurndownService from 'turndown';
  export const gfm: TurndownService.Plugin;
}
