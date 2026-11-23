/**
 * Keep tall figures from leaving a hole at the bottom of a page.
 *
 * Browsers will not break inside a figure, so one that does not fit jumps to the
 * next page and leaves white space behind. Book typesetters solve this by letting
 * the following text move up and the numbered figure float to the top of the next
 * page. This pass does the same, and it scores each option on the real page breaks.
 *
 * Chromium fragments multicolumn layout and printed pages with the same engine, so
 * one column the size of the text block shows where every page break will fall,
 * including widow, orphan, and keep-together rules. The pass keeps the arrangement
 * with the smallest holes. It never moves a figure past another figure or past text
 * that refers back to it, and it can scale a figure slightly. It stays in its own
 * section, and it lands on the page right after its text at the latest, because a reader
 * who is sent to another section for a figure loses the thread. A short page is the
 * smaller cost.
 *
 * Chromium treats a right-hand break as a plain page break. The same measurements show
 * how many pages each chapter takes, so this pass also adds the blank left page that
 * lets the next chapter open on the right.
 */
/**
 * Decide which chapters need a blank page before them, from one render's real page numbers.
 * `starts` holds each chapter's 1-based opening page, and `padded` says which render had a pad.
 */
export function planRectoPads(starts: readonly number[], padded: readonly boolean[], totalPages: number): boolean[] {
  const lengths = starts.map((start, index) => {
    const next = index + 1 < starts.length ? starts[index + 1] - (padded[index + 1] ? 1 : 0) : totalPages + 1
    return next - start
  })
  let page = starts[0] - (padded[0] ? 1 : 0)
  return lengths.map((length) => {
    const pad = page % 2 === 0
    page += length + (pad ? 1 : 0)
    return pad
  })
}

export const REFLOW_SOURCE = String.raw`
(({ pageHeight, width, pads }) => {
  const report = { moved: 0, shrunk: 0, chapters: 0, padded: [] };
  let pagesBefore = document.querySelectorAll('.part-divider').length;
  const root = document.documentElement, body = document.body;
  const saved = [root.style.width, body.style.width];
  root.style.width = body.style.width = width + 'px';

  const isFigure = (el) => el.matches('figure.book-figure');
  const isMinorHeading = (el) => /^H[3-6]$/.test(el.tagName);
  const isMovableText = (el) => (el.tagName === 'P' && !el.querySelector('.katex-display')) || /^(UL|OL)$/.test(el.tagName) || el.tagName === 'BLOCKQUOTE';
  const refersBack = (el) => /\b(figure|diagram|chart|plot|image|picture)\s+above\b|\babove\s+(figure|diagram|chart|plot)\b/i.test(el.textContent);
  // A sentence that ends in a colon must stay next to what it introduces.
  const introduces = (el) => /:\s*$/.test(el.textContent);
  // Ignore small differences, so that an arrangement wins only by closing a real hole.
  const slack = 0.04 * pageHeight;

  for (const chapter of document.querySelectorAll('article.chapter')) {
    report.chapters += 1;
    const content = chapter.querySelector('.chapter-content');
    if (!content) continue;
    const before = chapter.getAttribute('style');
    Object.assign(chapter.style, { width: width + 'px', height: pageHeight + 'px', columnWidth: width + 'px', columnGap: '0', columnFill: 'auto', breakBefore: 'auto' });

    const measure = () => {
      const origin = chapter.getBoundingClientRect();
      const blocks = new Map(), bottoms = [];
      for (const top of chapter.children) {
        for (const el of top === content ? content.children : [top]) {
          const rects = Array.from(el.getClientRects()).filter((rect) => rect.height > 0);
          if (!rects.length) continue;
          const place = (rect) => ({ column: Math.round((rect.left - origin.left) / width), top: rect.top - origin.top, bottom: rect.bottom - origin.top });
          const places = rects.map(place);
          for (const { column, bottom } of places) bottoms[column] = Math.max(bottoms[column] || 0, bottom);
          blocks.set(el, { first: places[0], last: places[places.length - 1] });
        }
      }
      let score = 0;
      for (let column = 0; column < bottoms.length - 1; column++) score += Math.max(0, pageHeight - (bottoms[column] || 0) - slack) ** 2;
      return { blocks, score, pages: bottoms.length };
    };

    const settled = new Set();
    for (let round = 0; round < 80; round++) {
      const layout = measure();
      const blocks = Array.from(content.children);
      const index = blocks.findIndex((el, i) => {
        if (i === 0 || !isFigure(el) || settled.has(el)) return false;
        const previous = layout.blocks.get(blocks[i - 1]), own = layout.blocks.get(el);
        return previous && own && own.first.column > previous.last.column && pageHeight - previous.last.bottom >= 0.08 * pageHeight;
      });
      if (index < 0) break;
      const figure = blocks[index];
      const hole = pageHeight - layout.blocks.get(blocks[index - 1]).last.bottom;

      let best = { score: layout.score - 0.002 * pageHeight * pageHeight, apply: null };
      const image = figure.querySelector('img');
      const limit = Number(image && image.dataset.shrink) || 1;
      if (image && limit < 1) {
        const original = image.style.width;
        const previous = layout.blocks.get(blocks[index - 1]);
        const imageRect = image.getBoundingClientRect();
        const needed = layout.blocks.get(figure).first.bottom - layout.blocks.get(figure).first.top - (pageHeight - previous.last.bottom) + 2;
        const ratio = 1 - needed / imageRect.height;
        if (ratio >= limit && ratio < 1) {
          const scaled = (imageRect.width * ratio).toFixed(2) + 'px';
          image.style.width = scaled;
          const score = measure().score;
          if (score < best.score) best = { score, apply: () => { image.style.width = scaled; report.shrunk += 1; } };
          image.style.width = original;
        }
      }
      const home = figure.nextSibling;
      const movable = !introduces(blocks[index - 1]);
      for (let j = index + 1; movable && j < blocks.length && j <= index + 8; j++) {
        const next = blocks[j];
        if (isFigure(next)) break;
        if (next.tagName === 'H2') break;
        if (isMinorHeading(next)) {
          if (hole < 0.2 * pageHeight) break;
          continue;
        }
        if (!isMovableText(next) || refersBack(next)) break;
        if (introduces(next)) continue;
        next.after(figure);
        const placed = measure();
        const anchor = placed.blocks.get(blocks[index - 1]), own = placed.blocks.get(figure);
        if (anchor && own && own.first.column > anchor.last.column + 1) break;
        if (placed.score < best.score) best = { score: placed.score, apply: () => { next.after(figure); report.moved += 1; } };
      }
      content.insertBefore(figure, home);
      // A figure that moved can still leave a hole, so it gets another look. Each move lowers the score.
      if (best.apply) best.apply();
      else settled.add(figure);
    }

    const pages = measure().pages;
    chapter.setAttribute('style', before || '');
    if (before === null) chapter.removeAttribute('style');
    // The caller passes real page counts when it has them. This estimate is only a first guess.
    const padded = pads ? pads[report.padded.length] : pagesBefore % 2 === 1;
    if (padded) {
      const pad = document.createElement('div');
      pad.className = 'recto-pad';
      chapter.before(pad);
      pagesBefore += 1;
    }
    report.padded.push(padded);
    pagesBefore += pages;
  }
  root.style.width = saved[0];
  body.style.width = saved[1];
  return report;
})
`
