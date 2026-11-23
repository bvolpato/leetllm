import { arrow, card, cueStarted, dot, footer, line, paper, text } from '../defaults.mjs';
export function drawExtractionContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('extraction-contract-mechanism', () => {
    if (currentBeat === 0) {
      paper(
        ctx,
        api,
        'extraction-contract',
        'Host-owned source 1842',
        ['inference-api depends on redis-cache.'],
        130,
        280,
        1660,
        themeColors.blue,
      );
      const data = [
        ['From', 'Service   ·   inference-api'],
        ['Relation', 'depends_on'],
        ['To', 'Datastore   ·   Redis Cache'],
        [
          'Source record',
          cueStarted(ctx, api, 'extraction-contract', 'host-source')
            ? '1842 · attached by host'
            : 'Pending',
        ],
      ];
      const count = Math.ceil(3 * (state.cues?.['extraction-contract-fields']?.progress ?? 0));
      data.forEach(([k, v], i) => {
        const y = 520 + i * 86;
        text(ctx, api, 'extraction-contract', k, 190, y + 42, 29, themeColors.muted);
        card(
          ctx,
          api,
          'extraction-contract',
          i < 3 && i >= count ? 'Pending' : v,
          550,
          y,
          990,
          66,
          i === 3 ? themeColors.yellow : themeColors.cyan,
          31,
        );
      });
      footer(
        ctx,
        api,
        'extraction-contract',
        'Typed parse + endpoint validation + retained negation/uncertainty + reviewed support',
      );
    } else if (currentBeat === 1) {
      text(
        ctx,
        api,
        'extraction-contract',
        'Canonical title + type inside declared scope',
        960,
        280,
        38,
        themeColors.ink,
        'center',
      );
      [
        'Redis Cache · prod / tenantA',
        'redis cache · prod / tenantA',
        'Redis Cache · test / tenantA',
        'Redis Cache · prod / tenantB',
      ].forEach((s, i) => {
        card(
          ctx,
          api,
          'extraction-contract',
          s,
          130,
          370 + i * 115,
          820,
          80,
          i < 2 ? themeColors.blue : themeColors.pink,
          30,
        );
        text(
          ctx,
          api,
          'extraction-contract',
          i < 2 ? 'same reviewed identity' : 'separate identity',
          1370,
          420 + i * 115,
          31,
          i < 2 ? themeColors.green : themeColors.pink,
          'center',
        );
        if (i < 2) arrow(ctx, api, 980, 410 + i * 115, 1110, 468, themeColors.blue);
      });
      footer(
        ctx,
        api,
        'extraction-contract',
        'Reviewed aliases normalize case and whitespace; punctuation, dates and conflicts retain meaning',
      );
    } else {
      text(
        ctx,
        api,
        'extraction-contract',
        'Same text unit: “cache timeout during migration”',
        960,
        280,
        37,
        themeColors.ink,
        'center',
      );
      dot(ctx, api, 'extraction-contract', 'cache', 350, 480, themeColors.blue, 85);
      dot(ctx, api, 'extraction-contract', 'timeout', 960, 480, themeColors.yellow, 85);
      dot(ctx, api, 'extraction-contract', 'migration', 1570, 480, themeColors.green, 90);
      const q = state.cues?.['extraction-contract-cooccur']?.progress ?? 0;
      if (q > 0) {
        line(ctx, api, 440, 480, 440 + 430 * q, 480, themeColors.cyan);
        line(ctx, api, 1050, 480, 1050 + 420 * q, 480, themeColors.cyan);
        api.path(
          ctx,
          [
            { x: 350, y: 573 },
            { x: 350, y: 610 },
            { x: 1570, y: 610 },
            { x: 1570, y: 578 },
          ],
          { color: themeColors.cyan, width: 2 },
        );
      }
      text(
        ctx,
        api,
        'extraction-contract',
        'Noun-phrase co-occurrence',
        960,
        700,
        39,
        themeColors.cyan,
        'center',
      );
      text(
        ctx,
        api,
        'extraction-contract',
        'Shared text does not establish depends_on or causes',
        960,
        805,
        33,
        themeColors.pink,
        'center',
      );
      footer(
        ctx,
        api,
        'extraction-contract',
        'Fast: NLP phrase graph + model-generated reports · fixture extractor accepts only two exact texts',
      );
    }
  });
}
export default {
  id: 'extraction-contract',
  draw: drawExtractionContract,
  cues: ['fields', 'host-source', 'scope', 'cooccur'].map((name) => 'extraction-contract-' + name),
};
