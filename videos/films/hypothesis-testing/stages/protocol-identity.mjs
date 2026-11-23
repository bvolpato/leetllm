import { mix } from '../arithmetic.mjs';
import { cueProgress, joinTaskResults, resultOrOperation } from '../model.mjs';
import {
  constructionBox,
  constructionCaption,
  constructionHeading,
  constructionText,
  mark,
} from '../defaults.mjs';
export function drawProtocolIdentity(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    checked = (id) => {
      if (state.cues && !Object.hasOwn(state.cues, id))
        throw Error('Undeclared hypothesis cue ' + id);
    },
    cp = (id, beat) => {
      checked(id);
      return cueProgress(state, id, beat);
    },
    on = (id, beat) => {
      checked(id);
      return resultOrOperation(state, id, beat);
    };
  mark(api, 'protocol-identity-construction', () => {
    if (currentBeat === 0) {
      const q = cp('hyp-identity-join', 0);
      const missing = on('hyp-identity-missing', 0);
      const arrival = on('identity-order', 0);
      const a = [
        { id: 'timestamp', pass: 1 },
        { id: 'cache expiry', pass: 0 },
      ];
      const arrivals = [a[1], a[0]];
      const joined = joinTaskResults(a, missing ? arrivals.slice(0, 1) : arrivals);
      constructionHeading(
        ctx,
        api,
        missing ? 'Replay with one late result' : 'Two tasks from the same six',
      );
      constructionText(ctx, api, 'Current  A', 446, 355, 35, themeColors.blue, 'center');
      constructionText(ctx, api, 'Challenger  B', 1320, 355, 35, themeColors.green, 'center');
      for (const [i, row] of a.entries()) {
        const y = 486 + i * 210;
        constructionBox(
          ctx,
          api,
          row.id + '   ' + (row.pass ? 'pass' : 'fail'),
          446,
          y,
          425,
          95,
          themeColors.blue,
          34,
        );
        const pair = joined.rows[i];
        const difference = q === 1 ? pair.difference : arrivals[i].pass - row.pass;
        if (arrival && (q === 0 || q === 1)) {
          const label =
            difference === null ? '?' : difference === 0 ? 'tie' : difference > 0 ? '+1' : '−1';
          constructionText(
            ctx,
            api,
            label,
            873,
            y + 13,
            39,
            difference === 0 ? themeColors.ink : themeColors.yellow,
            'center',
          );
        }
      }
      arrivals.forEach((row, i) => {
        const targetIndex = a.findIndex((item) => item.id === row.id);
        const y = 486 + 210 * mix(i, targetIndex, q);
        const x = 1320 + (i === 0 ? 290 : -290) * Math.sin(Math.PI * q);
        const timeout = missing && row.id === 'timestamp';
        constructionBox(
          ctx,
          api,
          row.id + '   ' + (timeout ? 'timeout' : row.pass ? 'pass' : 'fail'),
          x,
          y,
          414,
          95,
          timeout ? themeColors.yellow : themeColors.green,
          34,
        );
      });
      if (arrival)
        constructionText(
          ctx,
          api,
          missing
            ? 'Apply the declared timeout policy to the missing result'
            : q === 1
              ? 'Match by task ID'
              : q > 0
                ? 'Match the names'
                : 'Matched by finish time',
          960,
          914,
          42,
          themeColors.ink,
          'center',
        );
    } else if (currentBeat === 1) {
      constructionHeading(ctx, api, 'One result belongs to one frozen experimental configuration');
      const fields = [
        'checkpoint hash',
        'prompt + hidden tests',
        'decoding + seeds',
        'token and execution limits',
        'pool size, budget and selection',
        'test direction and comparisons',
        'stopping plan',
        'untouched comparison set',
      ];
      fields.forEach((s, i) => {
        const x = 550 + (i % 2) * 850,
          y = 360 + Math.floor(i / 2) * 155;
        constructionBox(
          ctx,
          api,
          s,
          x,
          y,
          760,
          90,
          i < 7 ? themeColors.cyan : themeColors.yellow,
          29,
        );
      });
      if (on('identity-cost-rule', 1))
        constructionText(
          ctx,
          api,
          'Switch only if the lower lift bound exceeds +2 percentage points',
          960,
          960,
          37,
          themeColors.yellow,
          'center',
        );
    } else {
      constructionHeading(
        ctx,
        api,
        'Twenty variants from one repository remain one dependent cluster',
      );
      api.rect(ctx, 240, 340, 1440, 440, 'transparent', themeColors.cyan, 3);
      constructionText(
        ctx,
        api,
        'repository R1 · shared failure modes',
        960,
        400,
        34,
        themeColors.cyan,
        'center',
      );
      const count = Math.floor(20 * cp('hyp-identity-cluster', 2));
      for (let i = 0; i < count; i++)
        constructionBox(
          ctx,
          api,
          'V' + (i + 1),
          390 + (i % 10) * 125,
          520 + Math.floor(i / 10) * 150,
          95,
          80,
          themeColors.blue,
          26,
        );
      constructionText(
        ctx,
        api,
        'Resample independent repository clusters with their paired variants',
        960,
        920,
        32,
        themeColors.yellow,
        'center',
      );
      constructionCaption(
        ctx,
        api,
        'Variant count is not an independent-task count; represent the population the claim concerns.',
      );
    }
  });
}
export default {
  id: 'protocol-identity',
  draw: drawProtocolIdentity,
  cues: [
    'protocol-identity-0',
    'identity-order',
    'hyp-identity-join',
    'hyp-identity-missing',
    'protocol-identity-1',
    'identity-cost-rule',
    'protocol-identity-2',
    'hyp-identity-cluster',
  ],
};
