import { estimatorExpectation, passAtK } from '../arithmetic.mjs';
import { cueProgress, resultOrOperation } from '../model.mjs';
import {
  constructionArrow,
  constructionBox,
  constructionCaption,
  constructionHeading,
  constructionText,
  mark,
} from '../defaults.mjs';
export function drawProtocolRepair(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    checked = (id) => {
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared hypothesis cue ' + id);
    },
    on = (id, beat) => {
      checked(id);
      return resultOrOperation(state, id, beat);
    };
  mark(api, 'protocol-repair-construction', () => {
    if (currentBeat === 0) {
      const labels = ['X', 'X', 'Y', 'Z'];
      const q = cueProgress(state, 'protocol-remove', 0);
      constructionHeading(ctx, api, 'One declared pool   ·   Four draws, two attempts');
      for (const [row, name] of ['As drawn', 'After deduplication'].entries()) {
        const y = 433 + row * 278;
        constructionText(ctx, api, name, 190, y + 10, 32, themeColors.ink);
        for (const [i, label] of labels.entries()) {
          if (row === 1 && i === 1 && q >= 0.55) continue;
          const x = 660 + i * 218 - (row === 1 && i > 1 ? 218 * Math.max(0, (q - 0.55) / 0.45) : 0);
          const shift = row === 1 && i === 1 ? 125 * Math.min(1, q / 0.55) : 0;
          constructionBox(
            ctx,
            api,
            label + (label === 'Y' ? '   pass' : '   fail'),
            x,
            y + shift,
            180,
            78,
            label === 'Y' ? themeColors.green : themeColors.muted,
            31,
          );
        }
        if (on('hyp-protocol-dedup', 0)) {
          const n = row === 0 ? labels.length : new Set(labels).size;
          constructionText(
            ctx,
            api,
            (100 * passAtK(1, n, 2)).toFixed(1) + '%',
            1590,
            y + 13,
            43,
            row === 0 ? themeColors.cyan : themeColors.pink,
            'center',
          );
        }
      }
      if (on('hyp-protocol-dedup', 0))
        constructionText(
          ctx,
          api,
          'Same passing answer   ·   Different weight',
          960,
          955,
          42,
          themeColors.ink,
          'center',
        );
    } else if (currentBeat === 1) {
      constructionHeading(ctx, api, 'Two pool sizes, one three-attempt target');
      const deterministic = on('hyp-protocol-deterministic', 1);
      for (const [n, i] of [
        [50, 0],
        [100, 1],
      ]) {
        const e = deterministic
            ? {
                target: 1,
                mass: Array.from(
                  {
                    length: n + 1,
                  },
                  (_, c) => Number(c === n),
                ),
              }
            : estimatorExpectation(0.2, n, 3),
          variance = e.mass.reduce((s, q, c) => s + q * (passAtK(c, n, 3) - e.target) ** 2, 0);
        constructionBox(
          ctx,
          api,
          'n = ' + n + ' · k = 3',
          520 + i * 900,
          410,
          700,
          100,
          themeColors.blue,
          37,
        );
        constructionText(
          ctx,
          api,
          'target ' + e.target.toFixed(3),
          520 + i * 900,
          600,
          35,
          themeColors.cyan,
          'center',
        );
        constructionText(
          ctx,
          api,
          (deterministic ? 'deterministic p = 1' : 'supplied p = 0.2') +
            ' · SD ' +
            Math.sqrt(variance).toFixed(5),
          520 + i * 900,
          750,
          29,
          themeColors.cyan,
          'center',
        );
      }
      if (on('hyp-protocol-deterministic', 1))
        constructionText(
          ctx,
          api,
          'Genuinely deterministic pipeline: all repeated outputs identical → pass@k = pass@1',
          960,
          960,
          29,
          themeColors.yellow,
          'center',
        );
      constructionCaption(
        ctx,
        api,
        'Both declared n values must be reported; boundary deterministic cases need not differ in precision. Missing hard tasks stay accountable.',
      );
    } else if (currentBeat === 2) {
      constructionHeading(
        ctx,
        api,
        'An oracle finds existence; a product selector chooses an answer',
      );
      const values = [0, 0, 1, 0];
      values.forEach((v, i) =>
        constructionBox(
          ctx,
          api,
          'C' + (i + 1) + ' · ' + (v ? 'pass' : 'fail'),
          350 + i * 410,
          410,
          350,
          100,
          v ? themeColors.green : themeColors.blue,
          31,
        ),
      );
      constructionArrow(ctx, api, 1170, 480, 1170, 620, themeColors.green);
      constructionBox(
        ctx,
        api,
        'Hidden tests found a pass in C3',
        1170,
        690,
        950,
        105,
        themeColors.green,
        33,
      );
      if (on('hyp-protocol-selector', 2)) {
        constructionArrow(ctx, api, 350, 480, 398, 811, themeColors.pink);
        constructionBox(
          ctx,
          api,
          'product picked C1: fail',
          400,
          875,
          650,
          100,
          themeColors.pink,
          32,
        );
      }
      constructionCaption(
        ctx,
        api,
        'Supplied four-candidate toy; test-suite success does not establish edge-case correctness or safe side effects.',
      );
    } else {
      constructionHeading(ctx, api, 'Paper isolation and released harness are different artifacts');
      api.rect(ctx, 230, 350, 730, 550, 'transparent', themeColors.cyan, 3);
      constructionText(
        ctx,
        api,
        'paper-described host boundary',
        595,
        420,
        31,
        themeColors.cyan,
        'center',
      );
      constructionBox(
        ctx,
        api,
        'gVisor and network restrictions',
        595,
        630,
        650,
        130,
        themeColors.cyan,
        30,
      );
      api.rect(ctx, 1080, 350, 620, 550, 'transparent', themeColors.yellow, 3);
      constructionText(
        ctx,
        api,
        'released evaluation harness',
        1390,
        420,
        29,
        themeColors.yellow,
        'center',
      );
      constructionBox(ctx, api, 'execution code', 1390, 610, 490, 100, themeColors.blue, 31);
      constructionText(
        ctx,
        api,
        'provider must supply robust sandbox',
        1390,
        790,
        27,
        themeColors.pink,
        'center',
      );
      constructionCaption(ctx, api, 'Check execution isolation separately from the hidden tests.');
    }
  });
}
export default {
  id: 'protocol-repair',
  draw: drawProtocolRepair,
  cues: [
    'protocol-repair-0',
    'protocol-remove',
    'hyp-protocol-dedup',
    'protocol-repair-1',
    'hyp-protocol-deterministic',
    'protocol-repair-2',
    'hyp-protocol-selector',
    'protocol-repair-3',
  ],
};
