import { auditCounts } from '../arithmetic.mjs';
import { AUDIT_CASES } from '../fixtures.mjs';
import { completed, logicalState, voice } from '../construction.mjs';
import { drawAuditCard, drawAuditText, drawBlock, drawFooter, withFocus } from '../defaults.mjs';
export function drawAuditAccounting(ctx, scene, state, api) {
  state = logicalState('audit-accounting', state);
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (id, beat = currentBeat) => voice(state, id, beat),
    resultComplete = (id, beat = currentBeat) => completed(state, id, beat);
  {
    const added = currentBeat > 0 && cueProgress('audit-add', 1) > 0,
      rows = added ? AUDIT_CASES : AUDIT_CASES.slice(0, 11),
      counts = auditCounts(rows),
      colors = {
        clear: themeColors.cyan,
        violation: themeColors.pink,
        helpful: themeColors.green,
        refusal: themeColors.pink,
        unhelpful: themeColors.yellow,
        review: themeColors.muted,
        error: themeColors.muted,
      };
    if (currentBeat < 2) {
      drawAuditText(
        ctx,
        api,
        'Example audit · one card per attempted case',
        960,
        285,
        31,
        themeColors.muted,
        'center',
      );
      withFocus(ctx, api, currentBeat ? 'missing-bounds' : 'outcome-bands', () =>
        [
          ['Attack', counts.attack],
          ['Benign', counts.benign],
        ].forEach(([label, group], i) => {
          const y = 390 + i * 245,
            arrival = currentBeat ? 1 : cueProgress(i ? 'audit-benign' : 'audit-attacks');
          drawAuditText(ctx, api, label, 160, y + 45, 34, themeColors.ink);
          group.forEach((v, j) => {
            if (j >= Math.ceil(arrival * group.length)) return;
            const xx = 420 + j * 190;
            if (v.cohort === 'attack')
              drawAuditText(ctx, api, v.family, xx + 82, y - 17, 25, themeColors.muted, 'center');
            drawAuditCard(ctx, api, v.id, xx, y, 165, colors[v.outcome], 85, 30);
            drawAuditText(ctx, api, v.outcome, xx + 82, y + 135, 24, colors[v.outcome], 'center');
          });
        }),
      );
      if (currentBeat === 0) {
        if (resultComplete('audit-asr')) {
          const roleplay = counts.attack.filter((v) => v.family === 'roleplay');
          drawAuditText(
            ctx,
            api,
            `ASR ${counts.violations}/${counts.knownAttack} · roleplay ${roleplay.filter((v) => v.outcome === 'violation').length}/${roleplay.length}`,
            960,
            865,
            36,
            themeColors.pink,
            'center',
          );
        }
        if (resultComplete('audit-frr'))
          drawAuditText(
            ctx,
            api,
            `False refusal ${counts.refusals}/${counts.knownBenign}`,
            540,
            945,
            34,
            themeColors.pink,
            'center',
          );
        if (resultComplete('audit-accounting-1'))
          drawAuditText(
            ctx,
            api,
            `Helpfulness ${counts.helpful}/${counts.knownBenign}`,
            1370,
            945,
            34,
            themeColors.green,
            'center',
          );
      } else {
        if (resultComplete('audit-accounting-2'))
          drawAuditText(
            ctx,
            api,
            `Known ASR ${counts.violations}/${counts.knownAttack} · coverage ${counts.knownAttack}/${counts.attack.length} · sample bounds 2/7 to 3/7`,
            960,
            870,
            33,
            themeColors.yellow,
            'center',
          );
        if (cueProgress('audit-benign-bounds') > 0)
          withFocus(ctx, api, 'benign-range', () => {
            drawAuditText(
              ctx,
              api,
              'If B6 has an unjudged reply',
              510,
              942,
              29,
              themeColors.muted,
              'center',
            );
            if (resultComplete('audit-benign-bounds')) {
              const n = counts.benign.length;
              const pending = n - counts.knownBenign;
              drawAuditText(
                ctx,
                api,
                `Benign helpfulness bounds ${counts.helpful}/${n} to ${counts.helpful + pending}/${n}`,
                510,
                999,
                33,
                themeColors.green,
                'center',
              );
            }
          });
        if (cueProgress('audit-no-reply') > 0)
          withFocus(ctx, api, 'delivered-help', () => {
            drawAuditText(
              ctx,
              api,
              'If B6 delivered no reply',
              1390,
              942,
              29,
              themeColors.muted,
              'center',
            );
            if (resultComplete('audit-no-reply'))
              drawAuditText(
                ctx,
                api,
                'Useful answers ' + counts.helpful + '/' + counts.benign.length,
                1390,
                999,
                33,
                themeColors.green,
                'center',
              );
          });
      }
    } else {
      const improve = cueProgress('audit-comparison') > 0,
        changed = AUDIT_CASES.slice(0, 11).map((v) => ({
          ...v,
          outcome:
            v.id === 'A3'
              ? 'clear'
              : v.id === (improve ? 'B4' : 'B3')
                ? improve
                  ? 'helpful'
                  : 'refusal'
                : v.outcome,
        })),
        after = auditCounts(changed),
        before = auditCounts(AUDIT_CASES.slice(0, 11));
      withFocus(ctx, api, 'utility-baseline', () => {
        drawAuditText(
          ctx,
          api,
          'Illustrative changes to the same eleven cases',
          960,
          305,
          37,
          themeColors.ink,
          'center',
        );
        const samples = [
          ['Original fixture', before],
          [improve ? 'Improved behavior fixture' : 'Stricter classifier fixture', after],
        ];
        samples.forEach(([label, v], i) => {
          const y = 450 + i * 235;
          drawAuditText(ctx, api, label, 170, y + 45, 29, themeColors.blue);
          drawBlock(ctx, api, 720, y, v.helpfulness * 750, 60, themeColors.green);
          drawBlock(ctx, api, 720, y + 85, v.frr * 750, 45, themeColors.pink);
          drawAuditText(
            ctx,
            api,
            `helpful ${v.helpful}/${v.knownBenign}`,
            1580,
            y + 45,
            31,
            themeColors.green,
            'center',
          );
          drawAuditText(
            ctx,
            api,
            `false refusal ${v.refusals}/${v.knownBenign}`,
            1580,
            y + 125,
            29,
            themeColors.pink,
            'center',
          );
          drawAuditText(
            ctx,
            api,
            `violations ${v.violations}/${v.knownAttack}`,
            1580,
            y + 185,
            29,
            themeColors.yellow,
            'center',
          );
        });
      });
      drawFooter(ctx, api, 'Compare helpful replies and violations on the same requests.');
    }
  }
}
export default {
  id: 'audit-accounting',
  draw: drawAuditAccounting,
  cues: [
    'audit-accounting-1',
    'audit-attacks',
    'audit-asr',
    'audit-benign',
    'audit-frr',
    'audit-accounting-2',
    'audit-add',
    'audit-benign-bounds',
    'audit-no-reply',
    'audit-accounting-3',
    'audit-comparison',
  ],
};
