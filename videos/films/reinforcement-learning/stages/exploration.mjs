import { explorationActions, explorationEpsilon, explorationQ } from '../fixtures.mjs';
import { explorationEpisodes, explorationLedger } from '../model.mjs';
import { flow, optionalFocusTarget, retainedText } from '../defaults.mjs';
export function drawExploration(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  {
    const colors = [themeColors.pink, themeColors.green, themeColors.cyan],
      greedy = 1;
    retainedText(
      ctx,
      api,
      'Fixed Q snapshot · synthetic teaching episodes · ε = 0.20',
      960,
      270,
      30,
      themeColors.muted,
      'center',
    );
    optionalFocusTarget(ctx, api, 'exploration-simulation-51', () =>
      explorationActions.forEach((name, i) => {
        const x = 160 + i * 570;
        api.components.card({
          label: name,
          x,
          y: 310,
          width: 460,
          height: 100,
          fill: themeColors.panel,
          stroke: i === greedy ? themeColors.green : themeColors.muted,
          textColor: colors[i],
          fontSize: 28,
          padding: 15,
        });
        retainedText(
          ctx,
          api,
          'Q = ' + explorationQ[i] + (i === greedy ? ' · greedy' : ''),
          x + 230,
          454,
          27,
          colors[i],
          'center',
        );
      }),
    );
    if (currentBeat === 0) {
      const selected = explorationEpisodes[1],
        testReady = progress >= 0.6,
        actionReady = progress >= 0.8;
      retainedText(
        ctx,
        api,
        'Episode E02 · first draw chooses the branch',
        160,
        490,
        31,
        themeColors.yellow,
      );
      const left = 230,
        right = 1690,
        y = 610,
        x = (value) => api.lerp(left, right, value);
      optionalFocusTarget(ctx, api, 'exploration-epsilon-test', () => {
        api.line(ctx, left, y, right, y, themeColors.muted, 3);
        api.line(ctx, left, y, x(explorationEpsilon), y, themeColors.cyan, 12);
        api.line(
          ctx,
          x(explorationEpsilon),
          y - 35,
          x(explorationEpsilon),
          y + 35,
          themeColors.yellow,
          3,
        );
        retainedText(ctx, api, 'explore', x(0.1), y + 55, 27, themeColors.cyan, 'center');
        retainedText(ctx, api, 'greedy action', x(0.6), y + 55, 27, themeColors.green, 'center');
        retainedText(ctx, api, '0', left, y + 105, 24, themeColors.muted, 'center');
        retainedText(ctx, api, 'ε = 0.20', x(0.2), y + 105, 24, themeColors.yellow, 'center');
        retainedText(ctx, api, '1', right, y + 105, 24, themeColors.muted, 'center');
        if (progress >= 0.5) {
          const amount = api.phase(progress, 0.5, 0.58),
            point = x(selected.u * amount);
          api.circle(ctx, point, y, 12, themeColors.yellow);
          api.teaching.changeCue(
            {
              x: point - 130,
              y: y - 100,
              width: 260,
              height: 55,
              from: 0,
              to: selected.u,
              progress: amount,
              emphasis: amount < 1 ? 1 : 0,
              color: themeColors.yellow,
              restColor: themeColors.yellow,
            },
            (cue) =>
              retainedText(
                ctx,
                api,
                'u = ' + cue.value.toFixed(2),
                point,
                y - 60,
                28,
                cue.color,
                'center',
              ),
          );
        }
        if (testReady)
          retainedText(
            ctx,
            api,
            '0.09 < 0.20 → explore uniformly among all three actions',
            960,
            765,
            31,
            themeColors.cyan,
            'center',
          );
      });
      const secondCue = state.cues?.['exploration-second-draw'];
      if (progress >= 0.66 || (secondCue && secondCue.phase !== 'before'))
        optionalFocusTarget(ctx, api, 'exploration-uniform-draw', () => {
          const uniformY = 895,
            width = (right - left) / 3;
          explorationActions.forEach((name, i) => {
            api.components.panel({
              x: left + i * width,
              y: uniformY - 40,
              width,
              height: 80,
              fill: themeColors.panel,
              stroke: colors[i],
            });
            retainedText(
              ctx,
              api,
              name,
              left + (i + 0.5) * width,
              uniformY + 10,
              25,
              colors[i],
              'center',
            );
          });
          const secondProgress =
              api.focus?.progress('exploration-second-draw', api.phase(progress, 0.66, 0.8)) ??
              api.phase(progress, 0.66, 0.8),
            secondValue = selected.v * secondProgress,
            second = x(secondValue);
          api.circle(ctx, second, uniformY - 60, 11, themeColors.yellow);
          retainedText(
            ctx,
            api,
            'v = ' + secondValue.toFixed(2),
            second,
            uniformY - 90,
            25,
            themeColors.yellow,
            'center',
          );
        });
      const gateSpoken =
        state.cues?.['exploration-beat-1-focus-1']?.phase &&
        state.cues['exploration-beat-1-focus-1'].phase !== 'before';
      if (actionReady || gateSpoken)
        flow(
          ctx,
          api,
          [
            {
              focusTarget: 'exploration-policy-result',
              id: 'proposal',
              label: 'E02: human review',
              x: 230,
              y: 970,
              width: 400,
              height: 65,
              color: themeColors.cyan,
            },
            {
              focusTarget: 'exploration-policy-result',
              id: 'policy',
              label: 'runtime policy gate',
              x: 755,
              y: 970,
              width: 410,
              height: 65,
              color: themeColors.yellow,
            },
            {
              focusTarget: 'exploration-policy-result',
              id: 'pending',
              label: 'outcome pending',
              x: 1290,
              y: 970,
              width: 400,
              height: 65,
              color: themeColors.muted,
            },
          ],
          [
            {
              from: 'proposal',
              to: 'policy',
              progress: 1,
              color: themeColors.cyan,
            },
            {
              from: 'policy',
              to: 'pending',
              progress: 1,
              color: themeColors.yellow,
            },
          ],
        );
    } else {
      const completed =
        currentBeat > 1 ? 8 : Math.min(8, Math.floor(api.phase(progress, 0.17, 0.43) * 8 + 1e-9));
      const ledger = explorationLedger(completed),
        previous = explorationLedger(Math.max(0, completed - 1));
      const columns = [190, 390, 700, 1040, 1450],
        head = ['Episode', 'u', 'ε test', 'v', 'Proposed action'];
      head.forEach((name, i) =>
        retainedText(ctx, api, name, columns[i], 525, 27, themeColors.muted, 'center'),
      );
      optionalFocusTarget(ctx, api, 'exploration-episode-ledger', () =>
        explorationEpisodes.forEach((row, i) => {
          const y = 575 + i * 43,
            done = i < completed,
            color = done ? colors[row.action] : themeColors.muted;
          if (i === completed - 1)
            api.components.panel({
              x: 140,
              y: y - 31,
              width: 1640,
              height: 42,
              fill: themeColors.panel,
              stroke: color,
            });
          const cells = [
            row.id,
            done ? row.u.toFixed(2) : 'pending',
            done ? (row.explore ? '< 0.20 · explore' : '≥ 0.20 · greedy') : '—',
            done ? (row.v === null ? 'unused' : row.v.toFixed(2)) : '—',
            done ? row.name : 'pending',
          ];
          cells.forEach((value, col) =>
            retainedText(
              ctx,
              api,
              value,
              columns[col],
              y,
              25,
              col === 0 ? themeColors.ink : color,
              'center',
            ),
          );
        }),
      );
      optionalFocusTarget(ctx, api, 'exploration-action-counts', () =>
        explorationActions.forEach((name, i) => {
          const x = 160 + i * 570;
          api.components.panel({
            x,
            y: 910,
            width: 460,
            height: 95,
            fill: themeColors.panel,
            stroke: colors[i],
          });
          retainedText(ctx, api, name, x + 230, 942, 25, colors[i], 'center');
          api.teaching.changeCue(
            {
              x: x + 10,
              y: 950,
              width: 440,
              height: 50,
              from: previous.counts[i],
              to: ledger.counts[i],
              progress: 1,
              emphasis:
                currentBeat === 1 && completed > 0 && previous.counts[i] !== ledger.counts[i]
                  ? 0.7
                  : 0,
              color: themeColors.yellow,
              restColor: colors[i],
            },
            (cue) =>
              retainedText(
                ctx,
                api,
                cue.value + ' / ' + completed + ' proposals',
                x + 230,
                988,
                28,
                cue.color,
                'center',
              ),
          );
        }),
      );
      retainedText(
        ctx,
        api,
        currentBeat === 1
          ? 'E05 proposes approval; live gate rejects it and executes allowed review'
          : 'Tabular convergence also needs stationary finite dynamics, bounded rewards, γ < 1 and suitable step sizes',
        960,
        1045,
        25,
        themeColors.yellow,
        'center',
      );
    }
  }
}
export default {
  id: 'exploration',
  draw: drawExploration,
  cues: [
    'exploration-beat-1-focus-1',
    'exploration-beat-1-focus-2',
    'exploration-epsilon-threshold',
    'exploration-second-draw',
    'exploration-beat-2-focus-1',
    'exploration-beat-3-focus-1',
  ],
};
