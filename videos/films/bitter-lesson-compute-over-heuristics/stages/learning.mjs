import { sampleModel } from '../construction.mjs';
import { learningConstruction, scoreWords } from '../model.mjs';
import { card, mechanismFocus, mechanismText, text, visualFocus } from '../defaults.mjs';
function drawTieBoundary(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    extra = currentBeat === 3;
  if (!extra) return false;
  const { C: themeColors } = api;
  mechanismFocus(ctx, api, extra ? 'learning-completion' : 'learning-mechanism', () => {
    const tie = scoreWords('timeout password');
    mechanismText(
      ctx,
      api,
      '“timeout password” · both words were observed',
      960,
      275,
      37,
      themeColors.yellow,
      'center',
    );
    [
      ['latency', tie.scores.latency, themeColors.blue],
      ['quality', tie.scores.quality, themeColors.green],
      ['access', tie.scores.access, themeColors.pink],
    ].forEach(([name, value, col], i) => {
      const y = 405 + i * 155;
      mechanismText(ctx, api, name, 300, y + 45, 33, col);
      if (value) api.rect(ctx, 700, y, 500 * value, 70, col);
      mechanismText(ctx, api, value, 1320, y + 45, 39, col, 'center');
    });
    mechanismText(
      ctx,
      api,
      'Positive tie → manual review',
      960,
      920,
      40,
      themeColors.yellow,
      'center',
    );
    mechanismText(
      ctx,
      api,
      'Synonyms can still score zero · corrected training cases are not untouched tests',
      960,
      1030,
      29,
      themeColors.muted,
      'center',
    );
  });
  return true;
}
export function drawLearning(ctx, scene, state, api) {
  if (drawTieBoundary(ctx, scene, state, api)) return;
  const { C: themeColors, teaching: teaching } = api;
  const modelState = sampleModel('learning', state);
  {
    const frame = learningConstruction(state);
    const training = frame.mode === 'train',
      correction = frame.mode === 'correct';
    text(
      ctx,
      api,
      training
        ? 'Labeled text supplies the word counts'
        : correction
          ? 'The same reviewed phrase is scored again after retraining'
          : 'Observed word counts become route evidence',
      960,
      295,
      28,
      themeColors.muted,
      'center',
    );
    text(ctx, api, 'Selected learned counts', 1460, 360, 26, themeColors.ink, 'center');
    text(ctx, api, 'word', 1260, 410, 22, themeColors.muted, 'center');
    text(ctx, api, 'quality', 1500, 410, 22, themeColors.green, 'center');
    text(ctx, api, 'latency', 1680, 410, 22, themeColors.blue, 'center');
    const countTargets = [];
    visualFocus(ctx, api, 'learning-simulation-26', () =>
      frame.qualityCounts.forEach((row, i) => {
        const y = 450 + i * 100;
        countTargets.push(card(ctx, api, row.word, 1140, y, 250, 68, themeColors.green, 24));
        teaching.changeCue(
          {
            x: 1430,
            y,
            width: 140,
            height: 68,
            from: 0,
            to: row.count,
            progress: row.count,
            color: themeColors.green,
            emphasis: training && row.count && frame.trained < i + 1.4 ? 1 : 0,
          },
          (cue) => text(ctx, api, cue.value, 1500, y + 45, 31, cue.color, 'center'),
        );
        text(ctx, api, '0', 1680, y + 45, 31, themeColors.muted, 'center');
      }),
    );
    visualFocus(ctx, api, 'learning-slowly-count', () =>
      card(ctx, api, 'slowly', 1140, 750, 250, 68, themeColors.yellow, 24),
    );
    text(ctx, api, '0', 1500, 795, 31, themeColors.muted, 'center');
    visualFocus(ctx, api, 'learning-slowly-count', () =>
      teaching.changeCue(
        {
          x: 1610,
          y: 750,
          width: 140,
          height: 68,
          from: 0,
          to: 1,
          progress: frame.correction,
          color: themeColors.yellow,
          emphasis: correction && frame.correction > 0 ? 1 : 0,
        },
        (cue) => text(ctx, api, frame.slowlyCount, 1680, 795, 31, cue.color, 'center'),
      ),
    );
    const phrase = training
      ? 'wrong citation unsupported answer'
      : frame.mode === 'unknown'
        ? 'responses take ages'
        : correction
          ? modelState.correction.text
          : 'unsupported citation answer';
    card(ctx, api, '“' + phrase + '”', 180, 350, 850, 82, themeColors.blue, 26);
    if (training) {
      text(ctx, api, 'training label · quality', 600, 900, 28, themeColors.green, 'center');
      visualFocus(ctx, api, 'learning-simulation-33', () =>
        frame.qualityCounts.forEach((row, i) => {
          const source = card(
            ctx,
            api,
            row.word,
            220,
            450 + i * 100,
            300,
            68,
            themeColors.green,
            24,
          );
          const target = countTargets[i];
          teaching.transfer({
            source: {
              shape: source,
              opacity: 1,
            },
            target: {
              shape: target,
              opacity: 1,
            },
            progress: row.progress,
            color: themeColors.green,
            gap: 20,
            particle: {
              radius: 9,
              fill: themeColors.yellow,
            },
          });
        }),
      );
      {
      }
    } else {
      const width = frame.words.length === 4 ? 180 : 240,
        gap = 22;
      const tokenShapes = frame.words.map((word, i) =>
        card(
          ctx,
          api,
          word + (i < frame.completed ? ' +1' : ''),
          180 + i * (width + gap),
          485,
          width,
          68,
          i < frame.completed
            ? correction
              ? themeColors.blue
              : themeColors.green
            : themeColors.muted,
          24,
        ),
      );
      const accumulating = frame.scoreProgress > 0 && frame.completed < frame.words.length;
      const accumulator = visualFocus(
        ctx,
        api,
        'learning-object-correction-latency-quality-evidence-correction-fra-36',
        () =>
          card(
            ctx,
            api,
            (correction ? 'latency' : 'quality') +
              ' evidence · ' +
              (correction ? frame.scores.latency : frame.scores.quality),
            350,
            670,
            500,
            90,
            accumulating ? themeColors.yellow : correction ? themeColors.blue : themeColors.green,
            30,
          ),
      );
      tokenShapes.forEach((shape, i) => {
        const contribution = Math.max(0, Math.min(1, frame.scoreProgress - i));
        if (frame.mode !== 'unknown' && contribution > 0)
          teaching.transfer({
            source: {
              shape,
              opacity: 1,
            },
            target: {
              shape: accumulator,
              opacity: 1,
            },
            progress: contribution,
            color: correction ? themeColors.blue : themeColors.green,
            gap: 20,
            particle: {
              radius: 8,
              fill: themeColors.yellow,
            },
          });
      });
      card(
        ctx,
        api,
        'route · ' + frame.route,
        250,
        825,
        700,
        82,
        frame.route === 'manual review'
          ? themeColors.yellow
          : frame.completed === frame.words.length
            ? themeColors.green
            : themeColors.muted,
        27,
      );
      if (correction)
        text(
          ctx,
          api,
          frame.correction < 1
            ? 'Reviewed label: latency · before retraining: manual review'
            : 'New latency counts: the · site · loads · slowly',
          960,
          970,
          26,
          themeColors.yellow,
          'center',
        );
      if (correction)
        text(
          ctx,
          api,
          'Fresh held-out reports still test generalization',
          960,
          1030,
          23,
          themeColors.muted,
          'center',
        );
    }
  }
}
export default {
  id: 'learning',
  draw: drawLearning,
  cues: [
    'learning-beat-1-focus-1',
    'learning-beat-2-focus-1',
    'learning-beat-3-focus-1',
    'learning-beat-3-focus-2',
    'learning-core-completion',
  ],
};
