import { test, expect } from '@playwright/test';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

type BlogMutation = (post: Record<string, unknown>, blogDirectory: string) => Promise<void> | void;

async function runBlogValidation(mutate: BlogMutation) {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'kmsc-content-'));
  const fixtureContent = join(fixtureRoot, 'content');
  const blogDirectory = join(fixtureContent, 'blog');
  const postPath = join(blogDirectory, 'representative.json');

  try {
    await cp('content', fixtureContent, { recursive: true });
    await mkdir(blogDirectory, { recursive: true });
    const post = JSON.parse(await readFile('tests/fixtures/blog/representative.json', 'utf8')) as Record<string, unknown>;
    await mutate(post, blogDirectory);
    await writeFile(postPath, JSON.stringify(post));

    const result = spawnSync(process.execPath, ['scripts/validate-content.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, CONTENT_DIR: fixtureContent },
      encoding: 'utf8'
    });

    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
}

test('missing Training Service fields fail validation with an actionable error', async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'kmsc-content-'));
  const fixtureContent = join(fixtureRoot, 'content');

  try {
    await cp('content', fixtureContent, { recursive: true });
    const servicePath = join(fixtureContent, 'services', 'management-system-design-and-implementation.json');
    const service = JSON.parse(await readFile(servicePath, 'utf8')) as Record<string, unknown>;
    delete service.summary;
    await writeFile(servicePath, JSON.stringify(service));

    const result = spawnSync(process.execPath, ['scripts/validate-content.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, CONTENT_DIR: fixtureContent },
      encoding: 'utf8'
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'Invalid Training Service content/services/management-system-design-and-implementation.json'
    );
    expect(`${result.stdout}${result.stderr}`).toContain('summary');
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test('invalid Blog Post fields fail validation with actionable errors', async () => {
  const cases: Array<{ mutate: BlogMutation; message: string }> = [
    { mutate: post => delete post.summary, message: 'summary' },
    { mutate: post => { post.slug = 'Not a stable slug'; }, message: 'slug' },
    { mutate: post => { post.date = '2025-02-30'; }, message: 'date' },
    { mutate: post => { post.cover = '/media/missing.png'; }, message: 'cover Media Asset "/media/missing.png" does not exist' },
    { mutate: post => { delete post.coverAlt; }, message: 'coverAlt: is required when cover is provided' },
    { mutate: post => { post.body = '![Unsupported](/media/missing.gif)'; }, message: 'body Media Asset "/media/missing.gif" must reference an approved' },
    { mutate: post => { post.body = '![Missing](/media/missing.png)'; }, message: 'body Media Asset "/media/missing.png" does not exist' },
    { mutate: post => { post.body = '- ![Missing](/media/missing.png)'; }, message: 'body Media Asset "/media/missing.png" does not exist' },
    {
      mutate: async (post, blogDirectory) => {
        await writeFile(join(blogDirectory, 'duplicate.json'), JSON.stringify(post));
      },
      message: 'duplicate slug "practical-starting-point-training-conversations"'
    }
  ];

  for (const { mutate, message } of cases) {
    const result = await runBlogValidation(mutate);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain(message);
  }
});

test('malformed Blog Post identifies the file during validation', async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'kmsc-content-'));
  const fixtureContent = join(fixtureRoot, 'content');

  try {
    await cp('content', fixtureContent, { recursive: true });
    await mkdir(join(fixtureContent, 'blog'), { recursive: true });
    await writeFile(join(fixtureContent, 'blog', 'malformed.json'), '{');

    const result = spawnSync(process.execPath, ['scripts/validate-content.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, CONTENT_DIR: fixtureContent },
      encoding: 'utf8'
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('Invalid Blog Post content/blog/malformed.json: malformed JSON');
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

test('malformed Page Content identifies the file during validation', async () => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'kmsc-content-'));
  const fixtureContent = join(fixtureRoot, 'content');

  try {
    await cp('content', fixtureContent, { recursive: true });
    await writeFile(join(fixtureContent, 'page-content.json'), '{');

    const result = spawnSync(process.execPath, ['scripts/validate-content.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, CONTENT_DIR: fixtureContent },
      encoding: 'utf8'
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('Invalid Page Content content/page-content.json: malformed JSON');
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
