import { evaluate, sampleModel } from '../model.mjs';
import { cueProgress, governancePermission } from '../construction.mjs';
import {
  drawGovernanceConstructionBox,
  drawGovernanceConstructionFooter,
  drawGovernanceConstructionText,
} from '../defaults.mjs';
function paintGovernanceMechanism(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress2 = (id) => cueProgress(state, id),
    resultComplete = (id) => governancePermission(state, id);
  return api.focus.target('results-mechanism', () => {
    {
      const independent = currentBeat === 3 && resultComplete('independent-trials');
      if (currentBeat === 3 && independent) {
        drawGovernanceConstructionBox(
          ctx,
          api,
          'Separate hypothetical experiment / fixed distribution + independence',
          180,
          285,
          1560,
          themeColors.blue,
        );
        for (let i = 0; i < 3; i++)
          drawGovernanceConstructionBox(
            ctx,
            api,
            'Trial ' + (i + 1) + ' / no failure',
            240 + i * 510,
            460,
            430,
            themeColors.green,
          );
        const u = 1 - 0.05 ** (1 / 3),
          earned = resultComplete('complete-bound');
        drawGovernanceConstructionText(
          ctx,
          api,
          'P(0 failures | p) = (1 − p)³ / solve at tail probability 0.05',
          960,
          615,
          34,
          themeColors.ink,
          'center',
        );
        const left = 300,
          right = 1630,
          top = 660,
          bottom = 840,
          x = (p) => left + (right - left) * p,
          y = (probability) => bottom - (bottom - top) * probability;
        api.line(ctx, left, top, left, bottom, themeColors.muted, 2);
        api.line(ctx, left, bottom, right, bottom, themeColors.muted, 2);
        api.path(
          ctx,
          Array.from(
            {
              length: 101,
            },
            (_, i) => ({
              x: x(i / 100),
              y: y((1 - i / 100) ** 3),
            }),
          ),
          {
            color: themeColors.cyan,
            width: 4,
          },
        );
        api.line(ctx, left, y(0.05), right, y(0.05), themeColors.yellow, 2);
        drawGovernanceConstructionText(ctx, api, '0', left, 885, 28, themeColors.muted, 'center');
        drawGovernanceConstructionText(ctx, api, '1', right, 885, 28, themeColors.muted, 'center');
        drawGovernanceConstructionText(
          ctx,
          api,
          '0.05 tail',
          1740,
          y(0.05) + 10,
          26,
          themeColors.yellow,
          'center',
        );
        const candidate = u * cueProgress2('bound-construction'),
          probability = (1 - candidate) ** 3;
        api.line(ctx, x(candidate), y(probability), x(candidate), bottom, themeColors.blue, 2);
        api.circle(ctx, x(candidate), y(probability), 12, themeColors.yellow);
        if (earned)
          drawGovernanceConstructionText(
            ctx,
            api,
            '95% upper bound / 1 − 0.05^(1/3) = 63.2%',
            960,
            950,
            37,
            themeColors.yellow,
            'center',
          );
        else
          drawGovernanceConstructionText(
            ctx,
            api,
            'Candidate p = ' +
              (candidate * 100).toFixed(1) +
              '% / P(0 | p) = ' +
              probability.toFixed(3),
            960,
            950,
            33,
            themeColors.yellow,
            'center',
          );
      } else {
        const first = sampleModel('results', { beat: 0, beatP: 0 });
        const rerun = sampleModel('results', { beat: 1, beatP: 0 });
        const empty =
          currentBeat === 2 || (currentBeat === 1 && resultComplete('missing-coverage'));
        const unknown = currentBeat === 2 && resultComplete('results-b3');
        const attacks =
          currentBeat === 2 || (currentBeat === 1 && resultComplete('retest-attack'))
            ? rerun.attacks
            : first.attacks;
        const benign = empty
          ? []
          : currentBeat === 2 || (currentBeat === 1 && resultComplete('retest-eligible'))
            ? rerun.benign
            : first.benign;
        const both = evaluate(attacks, benign);
        const title =
          currentBeat === 3
            ? 'First suite   /   original evidence'
            : empty
              ? 'Coverage check'
              : currentBeat === 1
                ? 'Same five cases   /   comparing runs'
                : 'Five completed traces';
        drawGovernanceConstructionText(ctx, api, title, 960, 278, 39, themeColors.ink, 'center');
        const lanes = [
          {
            id: 'attack-traces',
            name: 'Attack traces',
            values: attacks,
            initial: 'results-attack',
            x: 140,
            color: themeColors.cyan,
            prefix: 'A',
            fail: 'Forbidden effect',
            pass: 'No effect',
            rate: both.asr,
          },
          {
            id: 'eligible-traces',
            name: 'Eligible requests',
            values: benign,
            initial: 'results-eligible',
            x: 1020,
            color: themeColors.blue,
            prefix: 'R',
            fail: 'Wrongly blocked',
            pass: 'Accepted',
            rate: both.frr,
          },
        ];
        for (const lane of lanes)
          api.focus.target(lane.id, () => {
            drawGovernanceConstructionText(ctx, api, lane.name, lane.x, 400, 42, lane.color);
            if (currentBeat === 1 && !empty) {
              const updated = resultComplete(
                lane.prefix === 'A' ? 'retest-attack' : 'retest-eligible',
              );
              drawGovernanceConstructionText(
                ctx,
                api,
                updated ? 'Retest' : 'First run',
                lane.x + 735,
                398,
                28,
                themeColors.muted,
                'right',
              );
            }
            api.line(ctx, lane.x, 432, lane.x + 735, 432, themeColors.muted, 2);
            const known = currentBeat > 0 || resultComplete(lane.initial);
            lane.values.forEach((failed, i) => {
              const y = 512 + i * 81;
              drawGovernanceConstructionText(
                ctx,
                api,
                lane.prefix + (i + 1),
                lane.x,
                y,
                32,
                themeColors.muted,
              );
              drawGovernanceConstructionText(
                ctx,
                api,
                known ? (failed ? lane.fail : lane.pass) : 'Read effect record',
                lane.x + 130,
                y,
                36,
                known && failed ? themeColors.pink : themeColors.ink,
              );
            });
            if (!lane.values.length)
              drawGovernanceConstructionText(
                ctx,
                api,
                'No eligible requests in this report',
                lane.x,
                535,
                34,
                themeColors.muted,
              );
            const rateVisible = currentBeat === 3 ? resultComplete('first-suite') : known;
            if (rateVisible) {
              const metric = lane.prefix === 'A' ? 'Attack success' : 'False rejection';
              const value = lane.values.length
                ? lane.values.filter(Boolean).length +
                  '/' +
                  lane.values.length +
                  ' = ' +
                  (100 * lane.rate).toFixed(1) +
                  '%'
                : unknown
                  ? 'unknown'
                  : '?';
              drawGovernanceConstructionText(
                ctx,
                api,
                metric + '   ' + value,
                lane.x,
                780,
                38,
                lane.color,
              );
            }
          });
        const conclusion = empty
          ? unknown
            ? 'Hold for missing eligible-request coverage'
            : 'What false rejection rate can we report?'
          : currentBeat === 0
            ? 'Any forbidden effect holds release   ·   False rejection ceiling 10%'
            : currentBeat === 1 && resultComplete('retest-pass')
              ? 'Both checks pass on these five cases'
              : '';
        if (conclusion)
          drawGovernanceConstructionText(
            ctx,
            api,
            conclusion,
            960,
            907,
            34,
            currentBeat === 1 && !empty ? themeColors.green : themeColors.yellow,
            'center',
          );
      }
      if (currentBeat === 3)
        drawGovernanceConstructionFooter(
          ctx,
          api,
          'Curated attacks are targeted probes / the independent-trial confidence calculation is a separate assumption',
        );
    }
    return true;
  });
}

export function drawResults(ctx, scene, state, api) {
  return api.focus.target('gov-' + scene.id + '-mechanism', () => {
    paintGovernanceMechanism(ctx, scene, state, api);
  });
}
export default {
  id: 'results',
  draw: drawResults,
  cues: [
    'gov-results-b1',
    'gov-results-attack',
    'gov-results-eligible',
    'gov-results-b2',
    'gov-retest-pass',
    'gov-retest-attack',
    'gov-retest-eligible',
    'gov-results-b3',
    'gov-missing-coverage',
    'gov-results-b4',
    'gov-complete-bound',
    'gov-first-suite',
    'gov-independent-trials',
    'gov-bound-construction',
  ],
};
