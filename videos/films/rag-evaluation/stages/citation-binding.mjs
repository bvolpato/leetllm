import { completed, spoken } from '../construction.mjs';
import { citationSnapshot, metrics } from '../model.mjs';
import { CLAIMS } from '../fixtures.mjs';

export function drawCitationBinding(ctx, scene, state, api) {
  const { C, text, line } = api;
  const claim = CLAIMS.find((c) => c.id === 'closed');
  const citation = citationSnapshot(state);
  const inspected = completed(state, 'wrong-reference', 1);
  const checking = spoken(state, 'inspect-reference', 0) > 0;
  const attached = citation.source;
  const score = metrics([claim.id], [attached]);
  const pages = [
    {
      id: 'A',
      x: 150,
      title: 'Sunday returns',
      quote: ['“The library is closed on Sunday.', 'The return box is available.”'],
    },
    {
      id: 'B',
      x: 1000,
      title: 'Receipts',
      quote: ['“Return-box receipts are', 'emailed the next day.”'],
    },
  ];
  api.focus.target('claim', () => {
    text(ctx, 'Assistant’s answer', 150, 285, 32, C.muted);
    text(ctx, claim.text, 150, 375, 58, C.ink);
    text(ctx, '[' + attached + ']', 1040, 375, 58, C.yellow);
  });
  pages.forEach((page) => {
    api.focus.target('page-' + page.id.toLowerCase(), () => {
      text(ctx, 'Source ' + page.id + '   /   ' + page.title, page.x, 571, 34, C.cyan);
      line(ctx, page.x, 600, page.x + 760, 600, C.cyan, 2);
      page.quote.forEach((s, i) => text(ctx, s, page.x, 674 + i * 59, 43, C.ink));
    });
  });
  api.focus.target('attachment', () => {
    if (checking) {
      const x = 1250 - 850 * citation.progress;
      text(ctx, 'Cited passage', x, 462, 30, C.yellow, 'center');
      api.arrow(ctx, x, 480, x, 518, C.yellow, 4);
    } else {
      text(ctx, 'Which passage does the footnote open?', 150, 465, 34, C.ink);
    }
  });
  api.focus.target('scores', () => {
    text(ctx, 'Closure claim', 150, 871, 30, C.muted);
    text(ctx, 'Citation present', 730, 871, 30, C.muted);
    text(ctx, 'Cited passage supports closure', 1235, 871, 30, C.muted);
    text(
      ctx,
      inspected ? score.faithfulness + ' / 1 supported' : 'Compare with A and B',
      150,
      940,
      38,
      inspected ? C.green : C.ink,
    );
    text(ctx, '1 / 1 attached', 730, 940, 38, C.ink);
    text(
      ctx,
      inspected ? score.citationSupport + ' / 1' : '?',
      1235,
      940,
      45,
      inspected ? (score.citationSupport ? C.green : C.pink) : C.ink,
    );
  });
}

export default {
  id: 'citation-binding',
  draw: drawCitationBinding,
  cues: ['inspect-reference', 'wrong-reference', 'rebind-citation'],
};
