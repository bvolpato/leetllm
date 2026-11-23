import { rank, rankLexical } from '../arithmetic.mjs';
import { DOCS } from '../fixtures.mjs';
import { lerp, q } from '../construction.mjs';
import { shortlistSnapshot } from '../model.mjs';
import { arrow, box, focus, text } from '../defaults.mjs';
export function drawShortlistPayoff(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    const s = shortlistSnapshot(state),
      rows = rankLexical(DOCS),
      completed = s.expand === 1 ? 3 : Math.floor(s.first * 2 + 1e-9);
    focus(ctx, api, themeColors, 'shortlist-work', () => {
      const causeView = beat > 0;
      if (!causeView) {
        text(
          ctx,
          api,
          themeColors,
          'Literal-word overlap · same four notes',
          960,
          265,
          35,
          themeColors.muted,
        );
        text(ctx, api, themeColors, 'Exact-word score', 420, 350, 34, themeColors.blue);
        text(ctx, api, themeColors, 'Full-read reference', 1060, 350, 34, themeColors.cyan);
        rows.forEach((d, i) => {
          box(
            ctx,
            api,
            themeColors,
            d.name + ' · ' + d.cheap.toFixed(2),
            150,
            410 + i * 130,
            570,
            95,
            i < completed ? themeColors.blue : themeColors.muted,
            32,
          );
          if (i < completed) {
            arrow(ctx, api, 745, 458 + i * 130, 845, 458 + i * 130, themeColors.cyan);
            box(
              ctx,
              api,
              themeColors,
              d.refine.toFixed(2),
              870,
              410 + i * 130,
              330,
              95,
              themeColors.cyan,
              39,
            );
          }
        });
        if (s.expand > 0 && s.expand < 1) {
          arrow(ctx, api, 745, 718, lerp(745, 845, s.expand), 718, themeColors.yellow);
          box(ctx, api, themeColors, 'read pending', 870, 670, 330, 95, themeColors.yellow, 29);
        }
        text(
          ctx,
          api,
          themeColors,
          'Refinement reads: ' + completed + ' / 4',
          640,
          1010,
          34,
          themeColors.yellow,
        );
      } else {
        text(
          ctx,
          api,
          themeColors,
          'Exact-word shortlist · k = ' + (s.expand === 1 ? 3 : 2),
          1310,
          270,
          27,
          themeColors.blue,
        );
        const cutoff = 485 + 90 * s.expand;
        rows.forEach((d, i) => {
          const included = i < 2 || (i === 2 && s.expand === 1);
          const causeFocus = i === 2 && q(state, 'shortlist-cause', 1) > 0;
          const color = included
            ? i < 2
              ? themeColors.blue
              : themeColors.cyan
            : causeFocus || (i === 2 && s.expand > 0)
              ? themeColors.yellow
              : themeColors.muted;
          box(
            ctx,
            api,
            themeColors,
            '#' + (i + 1) + '  ' + d.name + ' · ' + d.cheap.toFixed(2),
            1110,
            315 + i * 90,
            390,
            76,
            color,
            22,
          );
        });
        arrow(ctx, api, 1078, cutoff, 1102, cutoff, themeColors.yellow, 5);
        text(
          ctx,
          api,
          themeColors,
          'Passes ' + (2 + Math.floor(s.expand)) + ' / 4 notes',
          1305,
          735,
          27,
          themeColors.yellow,
        );
      }
    });
    focus(ctx, api, themeColors, 'shortlist-cause', () => {
      if (beat > 0 && q(state, 'shortlist-cause', 1) > 0) {
        const progress = q(state, 'shortlist-cause', 1);
        text(
          ctx,
          api,
          themeColors,
          'Old issuer config · illustrative value mismatch',
          598,
          305,
          23,
          themeColors.muted,
        );
        box(
          ctx,
          api,
          themeColors,
          'Identity provider\nsends NEW issuer',
          140,
          330,
          405,
          112,
          progress > 0.35 ? themeColors.yellow : themeColors.muted,
          28,
        );
      }
    });
    focus(ctx, api, themeColors, 'shortlist-expected', () => {
      if (beat > 0 && q(state, 'shortlist-expected', 1) > 0) {
        box(
          ctx,
          api,
          themeColors,
          'Verifier config\nexpects OLD issuer',
          650,
          330,
          405,
          112,
          themeColors.pink,
          29,
        );
        arrow(ctx, api, 555, 385, 640, 385, themeColors.yellow, 6);
        text(ctx, api, themeColors, '≠', 597, 458, 40, themeColors.pink);
        box(ctx, api, themeColors, 'Login test fails', 380, 490, 430, 76, themeColors.pink, 29);
      }
    });
    focus(ctx, api, themeColors, 'shortlist-match', () => {
      if (beat > 0 && q(state, 'shortlist-match', 1) > 0) {
        text(ctx, api, themeColors, 'Question words', 210, 630, 27, themeColors.muted, 'left');
        ['login', 'test', 'fail'].forEach((word, i) =>
          box(ctx, api, themeColors, word, 455 + i * 170, 585, 148, 62, themeColors.yellow, 27),
        );
        text(ctx, api, themeColors, 'Issuer note words', 210, 730, 25, themeColors.muted, 'left');
        ['verifier', 'expects', 'old', 'issuer'].forEach((word, i) =>
          box(ctx, api, themeColors, word, 480 + i * 145, 685, 130, 62, themeColors.cyan, 25),
        );
      }
    });
    focus(ctx, api, themeColors, 'shortlist-zero', () => {
      if (beat > 0 && q(state, 'shortlist-zero', 1) > 0) {
        text(ctx, api, themeColors, 'No exact words shared', 520, 820, 28, themeColors.muted);
        box(ctx, api, themeColors, '0 / 3 · score 0.00', 750, 775, 300, 78, themeColors.pink, 26);
      }
    });
    focus(ctx, api, themeColors, 'shortlist-reference', () => {
      if (beat === 0) {
        text(ctx, api, themeColors, 'Context relevance', 1510, 350, 29, themeColors.muted);
        if (s.referenceReady) {
          const reference = rank(DOCS, 'refine');
          reference.forEach((d, i) =>
            box(
              ctx,
              api,
              themeColors,
              d.name + ' · ' + d.refine.toFixed(2),
              1280,
              410 + i * 100,
              510,
              75,
              themeColors.yellow,
              29,
            ),
          );
        } else
          box(
            ctx,
            api,
            themeColors,
            'Reference withheld',
            1280,
            410,
            510,
            225,
            themeColors.muted,
            31,
          );
      } else {
        text(ctx, api, themeColors, 'Full-read reference', 1665, 270, 29, themeColors.cyan);
        if (s.referenceReady) {
          rank(DOCS, 'refine')
            .slice(0, 2)
            .forEach((d, i) =>
              box(
                ctx,
                api,
                themeColors,
                '#' + (i + 1) + '  ' + d.name + ' · ' + d.refine.toFixed(2),
                1515,
                325 + i * 100,
                330,
                84,
                themeColors.yellow,
                19,
              ),
            );
        } else
          box(
            ctx,
            api,
            themeColors,
            'Context ranks\nappear on full read',
            1515,
            325,
            330,
            155,
            themeColors.muted,
            27,
          );
      }
    });
    focus(ctx, api, themeColors, 'shortlist-result', () => {
      const ready = completed >= 2 && s.referenceReady;
      if (beat === 0) {
        box(
          ctx,
          api,
          themeColors,
          s.resultReady
            ? 'Recovered 2 / 2 reference winners'
            : s.expand > 0
              ? 'Checking expanded shortlist'
              : ready
                ? 'Recovered 1 / 2 reference winners'
                : 'Compare after refinement',
          1230,
          825,
          600,
          80,
          s.resultReady ? themeColors.green : ready ? themeColors.pink : themeColors.muted,
          29,
        );
        if (s.chosen)
          box(
            ctx,
            api,
            themeColors,
            'Login-test retrieval · k = 3\n2 / 2 full-read reference winners',
            1230,
            910,
            600,
            110,
            themeColors.green,
            28,
          );
      } else {
        const recovery = s.resultReady
          ? 'Recovered 2 / 2\nreference winners'
          : s.expand > 0 && s.expand < 1
            ? 'Checking expanded\nshortlist'
            : ready
              ? 'Recovered 1 / 2\nreference winners'
              : 'Reference recovery\npending';
        box(
          ctx,
          api,
          themeColors,
          recovery,
          1515,
          585,
          330,
          82,
          s.resultReady ? themeColors.green : ready ? themeColors.pink : themeColors.muted,
          23,
        );
        if (s.chosen)
          box(
            ctx,
            api,
            themeColors,
            'Login-test retrieval · k = 3\n2 / 2 full-read reference winners',
            1515,
            685,
            330,
            108,
            themeColors.green,
            18,
          );
      }
    });
  }
}
export default {
  id: 'shortlist-payoff',
  draw: drawShortlistPayoff,
  cues: [
    'shortlist-two',
    'shortlist-cause',
    'shortlist-expected',
    'shortlist-match',
    'shortlist-zero',
    'shortlist-reference',
    'shortlist-three',
    'shortlist-payoff',
    'shortlist-choice',
  ],
};
