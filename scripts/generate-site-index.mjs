import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogPath = path.resolve(__dirname, '../src/data/blog.json');
const outPath = path.resolve(__dirname, '../public/site-index.json');

function stripTags(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchExcerpt(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('jamin.sh')) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    let m =
      html.match(
        /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
      );
    if (m) return m[1].trim();
    m =
      html.match(/<main[\s\S]*?>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i) ||
      html.match(/<body[\s\S]*?>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
    if (m) return stripTags(m[1]).slice(0, 300);
    const text = stripTags(html);
    return text.slice(0, 300);
  } catch (err) {
    return null;
  }
}

async function main() {
  const raw = await fs.readFile(blogPath, 'utf-8');
  const { posts } = JSON.parse(raw);

  const postsWithExcerpts = await Promise.all(
    posts.map(async (p) => {
      const excerpt = await fetchExcerpt(p.link).catch(() => null);
      return {
        title: p.title,
        url: p.link,
        date: p.date,
        source: p.company,
        excerpt,
      };
    }),
  );

  const siteIndex = {
    generated: new Date().toISOString(),
    site: {
      url: 'https://jamin.sh',
      title: 'Trust Jamin – Technical Writer & Developer Advocate',
      description:
        'Trust Jamin is a senior software engineer, technical writer, and developer advocate focused on building developer-first content, tools, and communities.',
    },
    pages: [
      { url: 'https://jamin.sh/', title: 'Home' },
      { url: 'https://jamin.sh/about', title: 'About' },
      { url: 'https://jamin.sh/blog', title: 'Blog' },
      { url: 'https://jamin.sh/projects', title: 'Projects' },
      { url: 'https://jamin.sh/talks', title: 'Talks' },
      { url: 'https://jamin.sh/videos', title: 'Videos' },
    ],
    posts: postsWithExcerpts,
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(siteIndex, null, 2));
  console.log('Written', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
