import { SEARCH_TEXT } from '../fixtures.mjs';
import { clamp, motion, sourceDigest } from '../arithmetic.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterLine,
  chapterRect,
  chapterText,
} from '../defaults.mjs';
export function drawIngestIdentity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-ingest-identity-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-ingest-identity-' + name);
    return q
      ? {
          progress: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          progress: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
          done: currentBeat > index || (currentBeat === index && progress > 0.76),
        };
  };
  const prog = (name, index) => cue(name, index).progress,
    done = (name, index) => cue(name, index).done;
  api.focus.target('se-ingest-identity-mechanism', () => {
    const advanced = currentBeat > 1 || (currentBeat === 1 && done('registry', 1)),
      digest = sourceDigest(SEARCH_TEXT.policy),
      values = [
        ['Document / revision', 'policy@2 · indexed / current@' + (advanced ? 3 : 2)],
        ['Tenant / reader', 'workspace-a · engineering'],
        ['Original text snapshot', SEARCH_TEXT.policy.slice(0, 38) + '…'],
        ['Character offsets', '[0,' + SEARCH_TEXT.policy.length + ') · end exclusive'],
        ['Content digest', 'sha256 ' + digest.slice(0, 12) + '…'],
        ['Published / effective', 'separate source clocks'],
        ['Access metadata', 'published; engineering grant'],
        ['Normalization version', 'normalized-text-v1'],
      ],
      n = currentBeat === 0 ? Math.max(1, Math.ceil(prog('0', 0) * 8)) : 8;
    chapterText(
      ctx,
      api,
      'One populated source receipt · policy@2',
      150,
      285,
      33,
      themeColors.blue,
    );
    values.slice(0, n).forEach(([name, value], i) => {
      const col = i % 2,
        row = Math.floor(i / 2),
        x = 155 + col * 830,
        y = 335 + row * 125;
      chapterRect(
        ctx,
        api,
        x,
        y,
        775,
        105,
        themeColors.panel,
        i === 0 && advanced ? themeColors.pink : i === 3 ? themeColors.yellow : themeColors.blue,
      );
      chapterText(ctx, api, name, x + 20, y + 35, 26, themeColors.muted);
      chapterText(
        ctx,
        api,
        value,
        x + 20,
        y + 79,
        25,
        i === 0 && advanced ? themeColors.pink : themeColors.ink,
      );
    });
    if (currentBeat === 0 && done('offset', 0)) {
      const original = '<p>' + SEARCH_TEXT.policy + '</p>',
        offset = Buffer.byteLength(original.slice(0, 3 + 12));
      chapterText(
        ctx,
        api,
        'Supplied <p> wrapper: normalized character 12 → raw byte ' + offset,
        190,
        940,
        29,
        themeColors.yellow,
      );
    }
    if (currentBeat === 1)
      chapterText(
        ctx,
        api,
        advanced
          ? 'Current@3 ≠ indexed@2 → old candidate unavailable'
          : 'Retain current@2 until authoritative revision changes',
        190,
        940,
        30,
        advanced ? themeColors.pink : themeColors.yellow,
      );
    if (currentBeat === 2) {
      const names = ['published', 'effective', 'ingested', 'indexed'],
        q = prog('clocks', 2);
      names.forEach((name, i) => {
        const x = 270 + i * 425;
        if (i / 4 <= q) {
          chapterLine(ctx, api, [x, 860], [x, 890], themeColors.cyan);
          chapterText(ctx, api, name, x, 935, 27, themeColors.cyan, 'center');
          if (i) chapterArrow(ctx, api, x - 340, 875, x - 30, 875, themeColors.cyan);
        }
      });
    }
    chapterFooter(
      ctx,
      api,
      'Hash prefix abbreviated. Original bytes, normalized offsets and governing source revision stay distinct.',
    );
  });
}
export default {
  id: 'ingest-identity',
  draw: drawIngestIdentity,
  cues: [
    'se-ingest-identity-0',
    'se-ingest-identity-offset',
    'se-ingest-identity-1',
    'se-ingest-identity-registry',
    'se-ingest-identity-2',
    'se-ingest-identity-clocks',
  ],
};
