import { prefillChunkSnapshot } from '../model.mjs';
import { cueProgress, drawEstablishedBatchingText } from '../defaults.mjs';
export function drawPrefill(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {});
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.92),
    whole = (currentBeat + phaseForBeat(currentBeat)) / 3;
  {
    const chunks = [
      cueProgress(state, 'chunk-prompt', 0.22, 0.38),
      cueProgress(state, 'prefill-second', 0.51, 0.64),
      cueProgress(state, 'later-chunks', 0.64, 0.76),
    ];
    const pass = chunks[2] > 0 ? 2 : chunks[1] > 0 ? 1 : 0;
    const chunk = prefillChunkSnapshot(currentBeat, progress,
      currentBeat === 1 ? { index: pass, fraction: chunks[pass] } : undefined);
    const source = (id) => ({
      x: 170 + (id - 1) * 80,
      y: 380,
    });
    api.focus.target('prefill-readout', () =>
      drawEstablishedBatchingText(
        ctx,
        api,
        currentBeat === 0
          ? 'One waiting prompt · 20 identified input positions'
          : 'Per-step work budget: 12 input positions',
        960,
        275,
        38,
        themeColors.ink,
        'center',
      ),
    );
    for (let id = 1; id <= 20; id++) {
      const start = source(id),
        moving = chunk.positions.find((position) => position.id === id),
        consumed = id <= chunk.prior;
      api.focus.target('prefill-prompt-chunk', () =>
        components.card({
          label: consumed ? '✓' : moving && moving.progress > 0 ? '' : 'P' + id,
          x: start.x,
          y: start.y,
          width: 72,
          height: 70,
          fontSize: 24,
          padding: 4,
          fill: themeColors.panel,
          stroke: consumed ? themeColors.green : themeColors.muted,
          textColor: consumed ? themeColors.green : themeColors.yellow,
        }),
      );
    }
    api.focus.target('prefill-active-work', () =>
      drawEstablishedBatchingText(ctx, api, 'Active work', 140, 630, 28, themeColors.muted),
    );
    for (let i = 0; i < 12; i++)
      api.focus.target(i < 3 ? 'prefill-live-decodes' : 'prefill-work-slots', () =>
        components.card({
          label: i < 3 ? ['A', 'B', 'C'][i] : '',
          x: 210 + i * 130,
          y: 640,
          width: 104,
          height: 90,
          fontSize: 31,
          fill: themeColors.panel,
          stroke: i < 3 ? themeColors.cyan : themeColors.muted,
          textColor: themeColors.cyan,
        }),
      );
    chunk.positions.forEach((position) => {
      if (position.progress <= 0) return;
      const start = source(position.id),
        u = position.progress,
        targetX = 210 + position.slot * 130;
      const x =
        u < 0.25
          ? start.x
          : u < 0.75
            ? api.lerp(start.x, targetX, api.ease((u - 0.25) / 0.5))
            : targetX;
      const y =
        u < 0.25
          ? api.lerp(start.y, 510, api.ease(u / 0.25))
          : u < 0.75
            ? 510
            : api.lerp(510, 640, api.ease((u - 0.75) / 0.25));
      api.focus.target('prefill-prompt-chunk', () =>
        components.card({
          label: 'P' + position.id,
          x,
          y,
          width: api.lerp(72, 104, u),
          height: api.lerp(70, 90, u),
          fontSize: 24,
          padding: 4,
          fill: themeColors.panel,
          stroke: position.progress === 1 ? themeColors.green : themeColors.yellow,
          textColor: position.progress === 1 ? themeColors.green : themeColors.yellow,
        }),
      );
    });
    api.focus.target('prefill-live-decodes', () =>
      drawEstablishedBatchingText(
        ctx,
        api,
        '3 live decode positions',
        440,
        790,
        29,
        themeColors.cyan,
        'center',
      ),
    );
    api.focus.target('prefill-readout-5', () =>
      drawEstablishedBatchingText(
        ctx,
        api,
        currentBeat === 0
          ? 'Prompt waits for bounded admission'
          : `Chunk ${chunk.chunk} target: ${chunk.size} prompt positions · ${12 - 3 - chunk.size} unused slots`,
        1230,
        790,
        29,
        themeColors.yellow,
        'center',
      ),
    );
    teaching.changeCue(
      {
        x: 550,
        y: 830,
        width: 830,
        height: 75,
        from: chunk.prior,
        to: chunk.prior + chunk.size,
        progress: chunk.size ? (chunk.consumed - chunk.prior) / chunk.size : 0,
        color: themeColors.green,
        restColor: themeColors.blue,
        emphasis: currentBeat === 1 && progress > 0.08 && progress < 0.88 ? 0.7 : 0,
      },
      (cue) =>
        api.focus.target('prefill-readout-6', () =>
          drawEstablishedBatchingText(
            ctx,
            api,
            'Prompt scheduled: ' + chunk.consumed + ' / 20',
            960,
            879,
            33,
            cue.color,
            'center',
          ),
        ),
    );
    api.focus.target('prefill-input-work-positions-and-emitted-output-tokens-are-diffe', () =>
      drawEstablishedBatchingText(
        ctx,
        api,
        'Input work positions and emitted output tokens are different counts',
        960,
        940,
        30,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'prefill',
  draw: drawPrefill,
  cues: [
    'long-prompt',
    'one-per-stream',
    'input-budget',
    'chunk-prompt',
    'prefill-second',
    'later-chunks',
    'input-work',
    'per-user-gaps',
  ],
};
