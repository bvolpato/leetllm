import {
  drawConstructionArrow,
  drawConstructionCode,
  drawConstructionLine,
  drawConstructionNote,
  drawConstructionP,
  drawConstructionText,
} from '../defaults.mjs';
export function drawContractSemantics(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawConstructionP(ctx, api, id) === 1,
    v = drawConstructionP(ctx, api, `${'contract-semantics'}-voice-${currentBeat + 1}`);
  api.focus.target('contract-semantics-construction', () => {
    if (currentBeat === 0) {
      const rows = [
        {
          id: '9',
          type: 'int',
          extra: '—',
          verdict: 'pass',
        },
        {
          id: '"9"',
          type: 'str',
          extra: '—',
          verdict: 'reject',
        },
        {
          id: 'True',
          type: 'bool',
          extra: '—',
          verdict: 'reject',
        },
        {
          id: '10',
          type: 'int',
          extra: 'locale=en',
          verdict: 'pass',
        },
      ];
      drawConstructionText(
        ctx,
        api,
        'Same required fields · exact positive integer IDs',
        160,
        300,
        34,
        themeColors.cyan,
      );
      [
        ['ID', 220],
        ['actual type', 620],
        ['extra field', 1030],
        ['local decision', 1580],
      ].forEach(([label, x]) =>
        drawConstructionText(
          ctx,
          api,
          label,
          x,
          390,
          27,
          themeColors.muted,
          x === 1580 ? 'center' : 'left',
        ),
      );
      drawConstructionLine(ctx, api, 190, 410, 1680, 410, themeColors.grid, 2);
      rows.forEach((r, i) => {
        const y = 455 + i * 106;
        drawConstructionText(ctx, api, r.id, 220, y, 38, themeColors.cyan, 'left', true);
        drawConstructionText(ctx, api, r.type, 620, y, 34, themeColors.blue, 'left', true);
        drawConstructionText(ctx, api, r.extra, 1030, y, 30, themeColors.muted, 'left', true);
        const show =
          i === 0
            ? v > 0.25
            : i === 1
              ? done('contract-string')
              : i === 2
                ? done('contract-types')
                : done('contract-extra');
        if (show)
          drawConstructionText(
            ctx,
            api,
            r.verdict,
            1580,
            y,
            34,
            r.verdict === 'pass' ? themeColors.green : themeColors.pink,
            'center',
          );
        else drawConstructionText(ctx, api, '?', 1580, y, 34, themeColors.muted, 'center');
      });
      drawConstructionNote(
        ctx,
        api,
        'Passing this row schema does not establish annotation review.',
      );
    } else if (currentBeat === 1) {
      const p = drawConstructionP(ctx, api, 'contract-class-change'),
        moved = [0, api.phase(p, 0.1, 0.45), api.phase(p, 0.5, 0.85), 1];
      drawConstructionText(
        ctx,
        api,
        'Same four rows · only the reviewed label changes',
        160,
        300,
        34,
        themeColors.cyan,
      );
      drawConstructionText(ctx, api, 'standard', 1070, 410, 32, themeColors.cyan, 'center');
      drawConstructionText(ctx, api, 'escalate', 1510, 410, 32, themeColors.yellow, 'center');
      drawConstructionLine(ctx, api, 870, 890, 1250, 890, themeColors.cyan, 3);
      drawConstructionLine(ctx, api, 1320, 890, 1700, 890, themeColors.yellow, 3);
      ['A', 'B', 'C', 'D'].forEach((id, i) => {
        const q = moved[i],
          from = {
            x: 1070,
            y: 800 - i * 95,
          },
          to = {
            x: 1510,
            y: 800 - i * 95,
          };
        const x = api.lerp(from.x, to.x, q),
          y = from.y - Math.sin(q * Math.PI) * 55;
        if (i === 1 || i === 2) {
          drawConstructionText(
            ctx,
            api,
            'row ' + id,
            200,
            520 + (i - 1) * 180,
            31,
            themeColors.ink,
          );
          drawConstructionText(
            ctx,
            api,
            'standard → escalate',
            350,
            520 + (i - 1) * 180,
            28,
            themeColors.muted,
          );
          drawConstructionArrow(
            ctx,
            api,
            660,
            505 + (i - 1) * 180,
            800,
            505 + (i - 1) * 180,
            q > 0 ? themeColors.yellow : themeColors.muted,
          );
        }
        api.rect(
          ctx,
          x - 130,
          y - 48,
          260,
          70,
          themeColors.panel,
          q > 0.5 ? themeColors.yellow : themeColors.cyan,
          3,
        );
        drawConstructionText(
          ctx,
          api,
          'row ' + id,
          x,
          y,
          31,
          q > 0.5 ? themeColors.yellow : themeColors.cyan,
          'center',
        );
      });
      const standard = 3 - Number(p >= 0.45) - Number(p >= 0.85);
      drawConstructionText(
        ctx,
        api,
        standard + ' / 4 standard',
        1070,
        950,
        38,
        themeColors.cyan,
        'center',
      );
      drawConstructionText(
        ctx,
        api,
        4 - standard + ' / 4 escalate',
        1510,
        950,
        38,
        themeColors.yellow,
        'center',
      );
    } else {
      drawConstructionText(
        ctx,
        api,
        'Strict type and extra-field rules are independent',
        160,
        300,
        34,
        themeColors.cyan,
      );
      drawConstructionCode(
        ctx,
        api,
        [
          'row = {ticket_id: 10, ..., locale: "en"}',
          'strict positive integer: pass',
          'extra fields: allow  → pass',
        ],
        190,
        430,
        32,
        1,
      );
      if (drawConstructionP(ctx, api, 'contract-policy') > 0.3) {
        drawConstructionCode(ctx, api, ['extra fields: forbid → reject locale'], 190, 700, 32, 0);
        drawConstructionArrow(ctx, api, 1300, 620, 1300, 750, themeColors.yellow);
        drawConstructionText(
          ctx,
          api,
          'Different configuration',
          1530,
          790,
          28,
          themeColors.yellow,
          'center',
        );
      }
      drawConstructionNote(ctx, api, 'Configure the failed-result action: stop or quarantine.');
    }
  });
}
export default {
  id: 'contract-semantics',
  draw: drawContractSemantics,
  cues: [
    'contract-semantics-b1',
    'contract-semantics-voice-1',
    'contract-types',
    'contract-string',
    'contract-extra',
    'contract-semantics-b2',
    'contract-semantics-voice-2',
    'contract-class-change',
    'contract-semantics-b3',
    'contract-semantics-voice-3',
    'contract-policy',
  ],
};
