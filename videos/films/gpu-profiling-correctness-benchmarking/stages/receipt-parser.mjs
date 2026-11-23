import { spoken } from '../arithmetic.mjs';
import { receiptFixture, sampleDigest } from '../model.mjs';

const fixture = receiptFixture();
export function drawReceiptParser(ctx, scene, state, api) {
  const { C, text, rect, line } = api;
  const p = (cue, beat) => spoken(state, cue, beat);
  api.focus.target('receipt-parser-mechanism', () => {
    if (state.beat === 1) {
      text(ctx, 'Both records declare the same conditions', 145, 272, 40, C.ink);
      const declarations = [
        ['n = True', 'positive integer element count required'],
        ['dtype = float16', 'this lab requires float32'],
        ['rotating pool = 1 slot', 'cache policy and slot count disagree'],
        ['timer = ""', 'device and timer labels required'],
      ];
      declarations.forEach(([input, error], i) => {
        const y = 415 + i * 140;
        text(ctx, input, 175, y, 36, C.blue, 'left', 'mono');
        if (p('runtime-types', 1) > 0) text(ctx, error, 820, y, 36, C.pink);
        line(ctx, 165, y + 32, 1755, y + 32, C.muted, 1);
      });
      return;
    }
    const changed = p('changed-artifact', 2) > 0;
    text(ctx, 'Synthetic matched round   /   float32 · two rotating slots', 145, 248, 36, C.ink);
    const formatHash = (hash) => hash.slice(0, 12) + '…';
    for (const [arm, left, color] of [['A', 155, C.blue], ['B', 1000, C.cyan]]) {
      const bad = arm === 'B' && changed;
      text(ctx, arm === 'A' ? 'Baseline file A' : 'Candidate file B', left, 366, 42, color);
      text(ctx, 'Recorded SHA-256   ' + formatHash(fixture.digests[arm]), left, 440, 28, C.muted);
      text(ctx, 'Current SHA-256       ' + formatHash(bad ? sampleDigest('truncated') : fixture.digests[arm]),
        left, 499, 28, bad ? C.pink : color);
      rect(ctx, left, 551, 748, 172, C.panel, bad ? C.pink : color, 3);
      if (bad) {
        text(ctx, 'truncated', left + 38, 647, 42, C.pink, 'left', 'mono');
      } else {
        text(ctx, 'slot ID', left + 28, 619, 29, C.muted);
        fixture.values[arm].forEach((_, i) => text(ctx, String(i % fixture.conditions.slots), left + 245 + i * 113, 619, 31, C.muted, 'right'));
        if (state.beat === 2 || p('hash-before-parse', 0) > 0) {
          text(ctx, 'time (µs)', left + 28, 684, 29, color);
          fixture.values[arm].forEach((v, i) => text(ctx, String(v), left + 245 + i * 113, 684, 35, color, 'right'));
        }
      }
    }
    text(ctx, 'compare_pair(*records)', 155, 882, 36, C.ink, 'left', 'mono');
    const status = changed ? 'sample artifact changed' : p('parser-ratio', 2) > 0 ?
      '102 / 82 ≈ ' + fixture.ratio.toFixed(2) + '×' : 'Check both records and both files';
    text(ctx, status, 1750, 882, 42, changed ? C.pink : C.yellow, 'right');
  });
}
export default { id: 'receipt-parser', draw: drawReceiptParser, cues: ['hash-before-parse', 'runtime-types', 'parser-ratio', 'changed-artifact'] };
