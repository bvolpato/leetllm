import { TAU } from '../fixtures.mjs';
import { directedCue } from '../construction.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';

function drawRetrievalTrial(ctx, state, api) {
  const { C, text, line, rect, circle, focus } = api;
  const cue = (id, beat) => directedCue(state, id, beat);
  const label = (v, x, y, size, color) => text(ctx, v, x, y, size, color, 'center');
  const limit = 32768,
    prompt = 30720,
    question = prompt - 1;
  const expected = 'LIME7';
  const x = (p) => 184 + (1490 * p) / limit;
  const slide = api.ease(cue('move-fact', 3));
  const checked = cue('check-answers', 4) > 0;
  label(
    'Illustrative passkey trial    ·    30,720 prompt + 2,048 generation = 32,768 tokens',
    960,
    260,
    36,
    C.ink,
  );
  for (const [row, answer] of ['LIME7', 'LIME4'].entries()) {
    if (row === 1 && state.beat < 3) continue;
    const pos = row === 0 ? 28672 : Math.round(api.lerp(28672, 512, slide));
    const y = 450 + 290 * row;
    const answered = row === 0 || cue('distant-answer', 3) > 0;
    focus.target(row === 0 ? 'near-trial' : 'far-trial', () => {
      line(ctx, x(0), y, x(question), y, C.muted, 5);
      rect(ctx, x(prompt), y - 7, x(limit) - x(prompt), 14, C.blue);
      circle(ctx, x(pos), y, 12, C.yellow);
      label('LIME7 @ ' + pos, x(pos), y - 47, 34, C.yellow);
      circle(ctx, x(question), y, 10, C.cyan);
      label('Question @ ' + question, x(question), y + 70, 32, C.cyan);
      const matches = answer === expected;
      const result = checked ? (matches ? 'match' : 'miss') : '';
      label(
        'Example answer   ' + (answered ? answer : '?') + (result ? '    ' + result : ''),
        690,
        y + 89,
        38,
        checked ? (matches ? C.green : C.red) : C.ink,
      );
    });
  }
  label(
    checked
      ? 'Compare answers across distances, distractors and missing facts.'
      : 'Expected answer   ' + expected,
    960,
    985,
    38,
    C.ink,
  );
}
export function drawCheckpointContract(ctx, scene, state, api) {
  return api.focus.target('checkpoint-contract-construction', () =>
    paintCheckpointContract(ctx, scene, state, api),
  );
}
function paintCheckpointContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    labels = [],
    segments = [];
  const drawText = (value, x, y, size = 30, color = themeColors.ink, align = 'center') => {
    const text = String(value);
    ctx.save();
    ctx.font = lessonFont(size);
    const width = ctx.measureText(text).width;
    ctx.restore();
    labels.push({
      x: x - (align === 'center' ? width / 2 : align === 'right' ? width : 0) - 4,
      y: y - size - 4,
      width: width + 8,
      height: size + 8,
    });
    return api.text(ctx, text, x, y, size, color, align);
  };
  const cueProgress = (beat, sentence) =>
      directedCue(state, 'rp-checkpoint-contract-' + beat + '-' + sentence, beat),
    resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
  const colors = [themeColors.cyan, themeColors.blue, themeColors.yellow, themeColors.pink],
    drawNote = (text) => drawText(text, 960, 1020, 27, themeColors.muted);
  const drawRectangle = (x, y, w, h, color = themeColors.panel, stroke = themeColors.muted) =>
    api.rect(ctx, x, y, w, h, color, stroke, 5);
  {
    const { C, teaching: g } = api,
      b = state.beat ?? 0;
    {
      if (b === 0) {
        drawText(
          'Separate reported Llama3.1 worksheet · d = 128 · base 500000',
          960,
          265,
          32,
          C.ink,
        );
        ['pair i', 'wavelength λ', 'frequency ratio'].forEach((v, i) =>
          drawText(v, 350 + i * 620, 365, 30, C.muted),
        );
        [0, 16, 28, 32, 36, 48, 63].forEach((i, j) => {
          const wavelength = TAU * 500000 ** ((2 * i) / 128),
            smooth = (8192 / wavelength - 1) / 3,
            ratio = wavelength < 2048 ? 1 : wavelength > 8192 ? 1 / 8 : 1 / 8 + (7 / 8) * smooth,
            color = ratio === 1 ? C.cyan : ratio === 1 / 8 ? C.pink : C.yellow;
          drawText(i, 350, 455 + j * 65, 29, color);
          drawText(wavelength.toFixed(1), 970, 455 + j * 65, 29, color);
          drawText(resultComplete(0, 2) ? ratio.toFixed(5) : '?', 1590, 455 + j * 65, 29, color);
        });
        if (resultComplete(0, 3))
          drawText('Slow pairs turn at one eighth of their original rate', 960, 975, 31, C.yellow);
      } else if (b === 1) {
        drawText(
          'Reported Gemma3 pattern · five local layers per global layer',
          960,
          270,
          33,
          C.ink,
        );
        for (let i = 0; i < 6; i++) {
          const x = 135 + i * 280,
            color = i === 5 ? C.yellow : C.cyan;
          drawRectangle(x, 420, 235, 260, C.panel, color);
          drawText(i === 5 ? 'GLOBAL' : 'LOCAL', x + 117, 495, 32, color);
          drawText('layer ' + (i + 1), x + 117, 575, 29, color);
          drawText(i === 5 ? 'base 1e6' : 'base 1e4', x + 117, 645, 27, color);
        }
        if (cueProgress(1, 2) > 0) {
          drawText(
            'LongRoPE2: per-dimension search + mixed short/long training',
            960,
            825,
            31,
            C.yellow,
          );
          drawText('Needle-answer token loss is its search target', 960, 915, 29, C.muted);
        }
      } else if (b >= 3 || directedCue(state, 'set-window', 2) > 0) {
        drawRetrievalTrial(ctx, state, api);
        return;
      } else {
        const fields = [
          'rotary width',
          'pairing',
          'base + ramp',
          'amplitude',
          'position IDs',
          'cache policy',
        ];
        fields.forEach((v, i) => {
          const x = 150 + (i % 3) * 590,
            y = 355 + Math.floor(i / 3) * 170;
          drawRectangle(x, y, 530, 115, C.panel, colors[i % 4]);
          drawText(v, x + 265, y + 70, 32, colors[i % 4]);
        });
      }
      drawNote(
        'Checkpoint training evidence and exact installed per-layer numerical settings belong in the same contract.',
      );
    }
  }
  for (const segment of segments)
    for (const points of clearSegments(segment.a, segment.z, labels))
      api.path(ctx, points, {
        color: segment.color,
        width: segment.width,
      });
}
export default {
  id: 'checkpoint-contract',
  draw: drawCheckpointContract,
  cues: [
    'rp-checkpoint-contract-0-0',
    'rp-checkpoint-contract-0-1',
    'rp-checkpoint-contract-0-2',
    'rp-checkpoint-contract-0-3',
    'rp-checkpoint-contract-1-0',
    'rp-checkpoint-contract-1-1',
    'rp-checkpoint-contract-1-2',
    'rp-checkpoint-contract-1-3',
    'check-schema',
    'set-window',
    'move-fact',
    'distant-answer',
    'check-answers',
  ],
};
