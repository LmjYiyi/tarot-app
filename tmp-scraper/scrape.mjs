import { JSDOM } from 'jsdom';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const slugs = ["ace-of-cups","ace-of-pentacles","ace-of-swords","ace-of-wands","death","eight-of-cups","eight-of-pentacles","eight-of-swords","eight-of-wands","five-of-cups","five-of-pentacles","five-of-swords","five-of-wands","four-of-cups","four-of-pentacles","four-of-swords","four-of-wands","judgement","justice","king-of-cups","king-of-pentacles","king-of-swords","king-of-wands","knight-of-cups","knight-of-pentacles","knight-of-swords","knight-of-wands","nine-of-cups","nine-of-pentacles","nine-of-swords","nine-of-wands","page-of-cups","page-of-pentacles","page-of-swords","page-of-wands","queen-of-cups","queen-of-pentacles","queen-of-swords","queen-of-wands","seven-of-cups","seven-of-pentacles","seven-of-swords","seven-of-wands","six-of-cups","six-of-pentacles","six-of-swords","six-of-wands","strength","temperance","ten-of-cups","ten-of-pentacles","ten-of-swords","ten-of-wands","the-chariot","the-devil","the-emperor","the-empress","the-fool","the-hanged-man","the-hermit","the-hierophant","the-high-priestess","the-lovers","the-magician","the-moon","the-star","the-sun","the-tower","the-world","three-of-cups","three-of-pentacles","three-of-swords","three-of-wands","two-of-cups","two-of-pentacles","two-of-swords","two-of-wands","wheel-of-fortune"];

const outDir = path.resolve(process.argv[2] || '../tarot-data');

function normalize(s) {
  return (s || '')
    .replace(/\r/g, '')
    .replace(/ /g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function extractFromDoc(doc) {
  const article = doc.querySelector('article');
  if (!article) throw new Error('no article');
  const h1 = article.querySelector('h1');
  const entry = article.querySelector('.entry-content');
  if (!entry) throw new Error('no entry-content');

  const out = [];
  const title = h1 ? normalize(h1.textContent) : '';
  if (title) { out.push('# ' + title); out.push(''); }

  const children = Array.from(entry.children);
  for (const el of children) {
    const cls = (typeof el.className === 'string') ? el.className : '';
    const tag = el.tagName;

    if (cls.includes('wp-block-button')) continue;
    if (cls.includes('mailpoet')) continue;
    if (cls.includes('jasiyu-featured')) continue;
    if (cls.includes('jasiyu-author-card')) continue;
    if (cls.includes('jasiyu-energy')) continue;

    if (cls.includes('lwptoc')) continue;
    if (cls.includes('wp-block-image')) continue;
    if (cls.includes('no-ads-zone')) continue;
    if (tag === 'STYLE' || tag === 'SCRIPT') continue;

    const txt = normalize(el.textContent);

    if (tag === 'H1') { out.push('# ' + txt); out.push(''); }
    else if (tag === 'H2') { out.push('## ' + txt); out.push(''); }
    else if (tag === 'H3') { out.push('### ' + txt); out.push(''); }
    else if (tag === 'H4') { out.push('#### ' + txt); out.push(''); }
    else if (tag === 'P') {
      if (txt) { out.push(txt); out.push(''); }
    } else if (tag === 'UL' || tag === 'OL') {
      const items = Array.from(el.querySelectorAll(':scope > li'));
      items.forEach(li => out.push('- ' + normalize(li.textContent)));
      out.push('');
    }
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

async function scrapeOne(slug) {
  const url = `https://jasiyu.com/${slug}-universal-waite-tarot/`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();
  const dom = new JSDOM(html);
  return extractFromDoc(dom.window.document);
}

async function runBatch(batch) {
  return Promise.all(batch.map(async slug => {
    try {
      const content = await scrapeOne(slug);
      const file = path.join(outDir, `${slug}.txt`);
      await writeFile(file, content, 'utf8');
      return { slug, ok: true, length: content.length };
    } catch (e) {
      return { slug, ok: false, error: String(e) };
    }
  }));
}

const results = [];
const batchSize = 6;
for (let i = 0; i < slugs.length; i += batchSize) {
  const batch = slugs.slice(i, i + batchSize);
  const batchResults = await runBatch(batch);
  for (const r of batchResults) {
    results.push(r);
    if (r.ok) {
      console.log(`OK  ${r.slug} (${r.length} chars)`);
    } else {
      console.log(`ERR ${r.slug}: ${r.error}`);
    }
  }
}

const failed = results.filter(r => !r.ok);
console.log(`\nDone. ${results.length - failed.length}/${results.length} succeeded`);
if (failed.length) {
  console.log('Failed:', failed.map(f => f.slug).join(', '));
  process.exit(1);
}
