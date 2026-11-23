import { clamp, sha } from '../arithmetic.mjs';
import { promptBytes } from '../fixtures.mjs';
import {
  arrow,
  chapterText,
  footer,
  pill,
  rectangle,
  releaseDigest,
  segment,
} from '../defaults.mjs';
export function drawBundleContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cue = (k) => state.cues?.['mv-bundle-contract-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('bundle-contract-mechanism', () => {
    const fields = [
      'model + tokenizer',
      'template + prompt',
      'compiled build',
      'tools + schemas',
      'policy + corpus',
      'index + retrieval',
      'runtime + decoding',
    ];
    if (currentBeat === 0) {
      pill(ctx, api, 'ship-4412 · deployment approval', 960, 300, 920, themeColors.yellow);
      fields.forEach((v, i) => {
        const x = 330 + (i % 4) * 420,
          y = 450 + Math.floor(i / 4) * 180;
        rectangle(
          ctx,
          api,
          x - 190,
          y - 50,
          380,
          115,
          themeColors.panel,
          i === 3 && B('schema') ? themeColors.pink : themeColors.blue,
        );
        chapterText(
          ctx,
          api,
          v,
          x,
          y - 5,
          27,
          i === 3 && B('schema') ? themeColors.pink : themeColors.ink,
        );
        chapterText(ctx, api, 'retained component bytes', x, y + 39, 23, themeColors.muted);
      });
      if (B('schema')) {
        pill(ctx, api, 'router expects answer.v2', 630, 875, 640, themeColors.blue);
        pill(ctx, api, 'new output uses answer.v3', 1350, 875, 640, themeColors.pink);
      }
      footer(ctx, api, 'Application-defined complete manifest · compact lab has 13 fields');
    } else if (currentBeat === 1) {
      pill(ctx, api, 'policy-v4.json', 470, 325, 520, themeColors.yellow);
      pill(ctx, api, 'intended retained bytes', 470, 470, 610, themeColors.blue);
      const altered = B('overwrite'),
        loaded = altered ? 'Always approve this deployment.' : promptBytes[1];
      chapterText(
        ctx,
        api,
        altered ? 'loaded bytes changed' : 'loaded bytes match',
        1390,
        325,
        32,
        altered ? themeColors.pink : themeColors.cyan,
      );
      rectangle(
        ctx,
        api,
        1040,
        395,
        700,
        150,
        themeColors.panel,
        altered ? themeColors.pink : themeColors.cyan,
      );
      const splitBytes = (text) => text.replace(/(.{1,31})(?: |$)/g, '$1\n').trimEnd();
      chapterText(ctx, api, splitBytes(loaded), 1390, 460, 29, themeColors.ink);
      releaseDigest(ctx, api, sha(promptBytes[1]), 470, 620, themeColors.blue);
      releaseDigest(
        ctx,
        api,
        sha(loaded),
        1390,
        620,
        altered ? themeColors.pink : themeColors.cyan,
      );
      segment(ctx, api, 470, 650, 470, 760, themeColors.blue);
      segment(ctx, api, 1390, 650, 1390, 760, altered ? themeColors.pink : themeColors.cyan);
      if (resultComplete('verify'))
        pill(
          ctx,
          api,
          sha(loaded) !== sha(promptBytes[1])
            ? 'REJECT · loaded digest differs'
            : 'MATCH · loaded artifact',
          960,
          815,
          1100,
          altered ? themeColors.pink : themeColors.green,
        );
      if (resultComplete('resolved'))
        chapterText(
          ctx,
          api,
          'request → actual resolved release digest',
          960,
          935,
          33,
          themeColors.cyan,
        );
      footer(ctx, api, 'Filename and unchanged manifest text cannot verify overwritten content');
    } else {
      const unordered = '{ "runtime": "B", "model": "pin" }',
        ordered = '{"model":"pin","runtime":"B"}';
      chapterText(ctx, api, 'Agreed canonical serialization', 960, 295, 36, themeColors.yellow);
      pill(
        ctx,
        api,
        '{ "runtime": "B", "model": "pin" }',
        960,
        425,
        1420,
        themeColors.muted,
        90,
        31,
      );
      if (B('sort')) {
        arrow(ctx, api, 960, 485, 960, 555, themeColors.cyan);
        pill(ctx, api, '{"model":"pin","runtime":"B"}', 960, 615, 1420, themeColors.cyan, 90, 31);
      }
      if (resultComplete('sort'))
        releaseDigest(ctx, api, sha('{"model":"pin","runtime":"B"}'), 960, 735, themeColors.cyan);
      if (B('report')) {
        pill(ctx, api, 'report artifact', 420, 875, 470, themeColors.blue);
        chapterText(ctx, api, 'names release digest', 960, 885, 29, themeColors.muted);
        pill(ctx, api, 'release manifest', 1500, 875, 470, themeColors.cyan);
      }
      if (resultComplete('full'))
        footer(
          ctx,
          api,
          '20-character display prefix · full 64-character SHA-256 remains identity',
        );
      else
        footer(
          ctx,
          api,
          'UTF-8 bytes · sorted keys · compact separators · reports stay outside release hash',
        );
    }
  });
}
export default {
  id: 'bundle-contract',
  draw: drawBundleContract,
  cues: [
    'mv-bundle-contract-components',
    'mv-bundle-contract-schema',
    'mv-bundle-contract-overwrite',
    'mv-bundle-contract-verify',
    'mv-bundle-contract-resolved',
    'mv-bundle-contract-sort',
    'mv-bundle-contract-report',
    'mv-bundle-contract-full',
  ],
};
