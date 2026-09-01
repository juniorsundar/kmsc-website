export type BlogPost = {
  title: string;
  slug: string;
  summary: string;
  date: string;
  cover?: string;
  coverAlt?: string;
  body: string;
  tags: string[];
  author: string;
  noindex: boolean;
};

const postModules = import.meta.glob('../../content/blog/*.json', {
  eager: true,
  import: 'default'
});

export const blogPosts = Object.values(postModules)
  .map(post => {
    const blogPost = post as Partial<BlogPost>;
    return { ...blogPost, tags: blogPost.tags ?? [], noindex: blogPost.noindex ?? true } as BlogPost;
  })
  .sort((first, second) => second.date.localeCompare(first.date) || first.slug.localeCompare(second.slug));

export function formatBlogDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${date}T00:00:00Z`));
}
