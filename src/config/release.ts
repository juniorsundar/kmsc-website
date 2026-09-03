import content from '../../content/page-content.json';

/** The release-wide indexing gate, supplied per build by the deployment. */
export const indexingEnabled = import.meta.env.PUBLIC_INDEXING_ENABLED === 'true';

/**
 * Whether the site may be indexed at all: the release gate AND the editor's
 * global "Exclude from search engines" setting must both permit it. Individual
 * pages can still withhold themselves on top of this.
 */
export const siteIndexable = indexingEnabled && !content.site.noindex;
