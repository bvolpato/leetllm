import { chapterBox, chapterText, footer, line, subtitle } from '../defaults.mjs';
import { facts, good } from '../fixtures.mjs';
import { responseChecks } from '../model.mjs';
export function drawStrictValidator(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    u = api.focus.progress('pf-strict-validator-b' + currentBeat);
  api.focus.target('pf-strict-validator-mechanism', () => {
    if (currentBeat === 0) {
      subtitle(
        ctx,
        api,
        'Actual Python decoding policy · preserve pairs before dictionary construction',
      );
      const rows = [
        ['action', 'page_on_call'],
        ['deadline_minutes', '30'],
        ['deadline_minutes', '30'],
      ];
      rows.forEach(([key, v], i) =>
        chapterBox(
          ctx,
          api,
          key + ' : ' + v,
          250,
          360 + i * 145,
          930,
          105,
          i === 2 ? themeColors.pink : themeColors.blue,
          30,
        ),
      );
      chapterBox(
        ctx,
        api,
        u > 0.6 ? 'Duplicate key → reject' : 'Inspect pairs in order',
        1240,
        560,
        500,
        150,
        u > 0.6 ? themeColors.pink : themeColors.muted,
        30,
      );
      footer(ctx, api, 'Identical duplicate values still leave an ambiguous object');
    } else if (currentBeat === 1) {
      subtitle(ctx, api, 'Strict type checks precede numeric equality');
      chapterBox(ctx, api, 'Python: True == 1', 230, 370, 650, 110, themeColors.yellow, 32);
      chapterBox(
        ctx,
        api,
        'deadline: true\nactual type: bool',
        230,
        620,
        650,
        140,
        themeColors.pink,
        30,
      );
      chapterBox(
        ctx,
        api,
        'Required type: int\nBoolean rejected',
        1080,
        620,
        650,
        140,
        themeColors.green,
        30,
      );
      line(ctx, api, 930, 350, 930, 870, themeColors.yellow, 4);
      footer(ctx, api, 'NaN is rejected at decoding; a real Boolean is required for page status');
    } else if (currentBeat === 2) {
      const missing = api.focus.progress('pf-validator-missing'),
        failed = missing > 0,
        settled = missing >= 0.999;
      subtitle(ctx, api, 'Same I-12 · required input state and every output field are compared');
      chapterBox(
        ctx,
        api,
        failed ? 'Applicable IR-7: missing' : 'Applicable IR-7: present',
        230,
        350,
        650,
        100,
        failed ? themeColors.pink : themeColors.green,
        30,
      );
      chapterBox(
        ctx,
        api,
        'P1 · elapsed 12 · no prior page',
        1030,
        350,
        700,
        100,
        themeColors.blue,
        30,
      );
      chapterBox(
        ctx,
        api,
        failed
          ? settled
            ? 'needs_review\ndeadline null · overdue null\nsource IDs []'
            : 'Recompute fields: ?'
          : 'page_on_call\ndeadline 30 · overdue false\nsource IDs [IR-7]',
        410,
        630,
        1110,
        220,
        failed ? themeColors.yellow : themeColors.green,
        32,
      );
      footer(ctx, api, 'A fully known unpaged P1 also rejects an invented review fallback');
    } else {
      subtitle(
        ctx,
        api,
        'Same JSON in both calls · page_on_call, deadline 30, overdue false, source IR-7',
      );
      const second = api.focus.progress('strict-second-call') > 0;
      const result = api.focus.progress('strict-second-result') > 0;
      for (const [i, elapsed] of [30, 31].entries()) {
        if (i === 1 && !second) continue;
        const y = 403 + i * 242;
        const verdict = responseChecks(JSON.stringify(good), { ...facts, elapsed }).accepted;
        chapterText(
          ctx,
          api,
          'validate_reply(raw, elapsed=' + elapsed + ', page_sent=False)',
          200,
          y,
          39,
          themeColors.ink,
        );
        if (i === 0 || result) {
          chapterText(
            ctx,
            api,
            verdict ? 'accepted' : 'contradicts_fixture',
            260,
            y + 80,
            39,
            verdict ? themeColors.green : themeColors.pink,
          );
          chapterText(
            ctx,
            api,
            elapsed + ' > 30  →  ' + (elapsed > facts.deadline),
            1110,
            y + 80,
            37,
            themeColors.cyan,
          );
        }
      }
      footer(
        ctx,
        api,
        result
          ? 'Repair the stale overdue flag and check the full decision again.'
          : 'The reply still says overdue is false. Will it pass both calls?',
        themeColors.yellow,
      );
    }
  });
  return;
}
export default {
  id: 'strict-validator',
  draw: drawStrictValidator,
  cues: [
    'pf-strict-validator-b0',
    'pf-strict-validator-b1',
    'pf-strict-validator-b2',
    'pf-validator-missing',
    'pf-strict-validator-b3',
    'pf-strict-validator-b4',
    'strict-second-call',
    'strict-second-result',
  ],
};
