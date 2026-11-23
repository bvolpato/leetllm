import { strictReleaseArguments } from '../model.mjs';
import { box, chapterCode, chapterLine, chapterText, footer, heading } from '../defaults.mjs';
export function drawStrictContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-strict-contract-mechanism', () => {
    heading(ctx, api, 'Release selector, nullable option and duplicate-key policy');
    if (currentBeat === 0) {
      chapterCode(
        ctx,
        api,
        'release_id: /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/',
        150,
        395,
        29,
        themeColors.cyan,
      );
      const cases = [
        ['reranker-v16', true],
        ['_reranker', false],
        ['v'.repeat(129), false],
      ];
      cases.forEach(([v, ok], i) => {
        const shown = i < 2 ? v : '129 ASCII characters';
        box(
          ctx,
          api,
          shown,
          ok ? 'valid identifier' : 'invalid identifier',
          150,
          500 + i * 135,
          980,
          ok ? themeColors.green : themeColors.pink,
          105,
        );
      });
      if (resultComplete('strict-extra', 0))
        box(
          ctx,
          api,
          'approved: true',
          'extra field → reject',
          1230,
          500,
          500,
          themeColors.pink,
          160,
        );
    } else if (currentBeat === 1) {
      const cases = [
        [
          'omitted',
          {
            release_id: 'R16',
          },
        ],
        [
          'null',
          {
            release_id: 'R16',
            include_gates: null,
          },
        ],
        [
          'true',
          {
            release_id: 'R16',
            include_gates: true,
          },
        ],
        [
          '1',
          {
            release_id: 'R16',
            include_gates: 1,
          },
        ],
      ];
      cases.forEach(([label, args], i) => {
        let ok = true;
        try {
          strictReleaseArguments(args);
        } catch {
          ok = false;
        }
        const visible = i < 2 ? resultComplete('strict-null', 1) : resultComplete('strict-bool', 1),
          y = 390 + i * 120;
        chapterText(
          ctx,
          api,
          'include_gates: ' + label,
          150,
          y + 40,
          29,
          themeColors.blue,
          'left',
          'mono',
        );
        if (visible)
          chapterText(
            ctx,
            api,
            ok
              ? label === 'true'
                ? 'gate details requested'
                : 'valid; details not requested'
              : 'reject numeric Boolean',
            800,
            y + 40,
            29,
            ok ? themeColors.green : themeColors.pink,
          );
        chapterLine(ctx, api, 150, y + 75, 1670, y + 75, themeColors.muted, 1);
      });
      if (resultComplete('strict-required-null', 1))
        chapterText(
          ctx,
          api,
          'Strict generation schema: required field accepts Boolean | null',
          150,
          980,
          28,
          themeColors.yellow,
        );
    } else {
      chapterCode(ctx, api, '{"version":"c17", "version":"c16"}', 150, 420, 32, themeColors.blue);
      const d = JSON.parse('{"version":"c17","version":"c16"}');
      box(
        ctx,
        api,
        'Reader object-pairs policy',
        resultComplete('duplicate-reader', 2)
          ? 'duplicate version → reject'
          : 'inspect keys before building the object',
        150,
        590,
        720,
        themeColors.pink,
        150,
      );
      box(
        ctx,
        api,
        'Default Python JSON',
        resultComplete('duplicate-default', 2) ? 'last value: ' + d.version : 'last duplicate wins',
        1050,
        590,
        680,
        themeColors.yellow,
        150,
      );
      chapterText(
        ctx,
        api,
        'Strict type checking is a different contract',
        150,
        920,
        33,
        themeColors.cyan,
      );
    }
    footer(
      ctx,
      api,
      'Application model optionality differs from required-nullable provider schema.',
    );
  });
}
export default {
  id: 'strict-contract',
  draw: drawStrictContract,
  cues: [
    'tu-strict-contract-1',
    'tu-strict-identifier',
    'tu-strict-extra',
    'tu-strict-contract-2',
    'tu-strict-null',
    'tu-strict-bool',
    'tu-strict-required-null',
    'tu-strict-contract-3',
    'tu-duplicate-reader',
    'tu-duplicate-default',
  ],
};
