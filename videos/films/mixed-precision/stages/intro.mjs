import { completed, operation } from '../construction.mjs';
import { fp16 } from '../arithmetic.mjs';
import { below, decrement, one, weightAfter } from '../weight-ruler.mjs';

const wanted = one - decrement;
const left = 430;
const right = 1600;
const xAt = (weight) => left + ((weight - below) / (one - below)) * (right - left);

function drawCloseUp(ctx, api, zoom, landing, stored) {
  const { C } = api;
  const spacing = 2 ** -24;
  const lower = Math.floor(wanted / spacing) * spacing;
  const upper = lower + spacing;
  const span = 580 * zoom;
  const center = 1240;
  const x = (weight) => center + ((weight - wanted) / spacing) * span;
  const y = 902;
  const sourceX = xAt(wanted);
  for (const value of [lower, upper]) {
    api.line(ctx, sourceX, 739, sourceX + (x(value) - sourceX) * zoom, 739 + 82 * zoom, C.muted, 2);
  }
  api.text(ctx, 'FP32 close-up', 120, y + 8, 40, C.cyan);
  api.line(ctx, x(lower), y, x(upper), y, C.muted, 4);
  for (const value of [lower, upper]) {
    api.line(ctx, x(value), y - 14, x(value), y + 16, C.cyan, 6);
    if (zoom > 0.65) api.text(ctx, value.toFixed(8), x(value), y + 64, 31, C.ink, 'center');
  }
  api.circle(ctx, center, y - 45, 11, C.yellow);
  if (landing > 0) {
    const storedX = x(weightAfter(one, -decrement, Math.fround));
    api.line(
      ctx,
      center,
      y - 45,
      center + (storedX - center) * landing,
      y - 45 + 45 * landing,
      C.cyan,
      3,
    );
    api.circle(ctx, center + (storedX - center) * landing, y - 45 + 45 * landing, 12, C.cyan);
    if (stored) api.text(ctx, 'Stored', storedX, y - 45, 29, C.cyan, 'center');
  }
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  // The requested change starts at the cut. The two stores wait for their spoken answers.
  const travel =
    beat > 0 ? 1 : Math.min(1, (state.t ?? 0) / (state.cues?.['request-step']?.end ?? 2));
  const requested = one - decrement * travel;
  const targetX = xAt(requested);
  const zoom = beat > 0 ? 1 : operation(state, 'inspect-ticks');
  const landing = (id) => (beat === 0 ? 0 : beat === 1 ? operation(state, id) : 1);
  const stored = (id) => beat > 1 || (beat === 1 && completed(state, id));

  api.focus.target('weight-request', () => {
    api.text(ctx, 'Optimizer step', 120, 254, 35, C.muted);
    api.text(ctx, '1 − 0.0001', 120, 367, 100, C.ink);
    api.text(ctx, 'Requested weight', targetX, 254, 35, C.yellow, 'center');
    api.text(ctx, requested.toFixed(travel === 1 ? 4 : 5), targetX, 367, 121, C.yellow, 'center');
    api.line(ctx, targetX, 387, targetX, 445, C.yellow, 4);
  });

  for (const [i, name] of ['FP16', 'FP32'].entries()) {
    const half = i === 0;
    const color = half ? C.blue : C.cyan;
    const cue = half ? 'half-landing' : 'single-landing';
    const progress = landing(cue);
    const destination = weightAfter(one, -decrement, half ? fp16 : Math.fround);
    const y = 500 + i * 208;
    api.focus.target(half ? 'half-store' : 'single-store', () => {
      api.text(ctx, name, 120, y + 17, 52, color);
      if (!half) api.text(ctx, '8,192 intervals', left, y + 67, 33, color);
      api.line(ctx, left, y, right, y, half ? C.muted : color, half ? 4 : 9);
      for (const value of [below, one]) {
        api.line(ctx, xAt(value), y - 20, xAt(value), y + 20, color, 8);
        if (half)
          api.text(
            ctx,
            value === one ? '1' : below.toFixed(8),
            xAt(value),
            y + 72,
            38,
            C.ink,
            'center',
          );
      }
      if (travel > 0) api.line(ctx, targetX, y - 34, right, y - 34, C.yellow, 4);
      api.circle(ctx, targetX, y - 34, 15, C.yellow);
      if (progress > 0) {
        const x = targetX + (xAt(destination) - targetX) * progress;
        api.circle(ctx, x, y - 34 + 34 * progress, 15, color);
      }
      if (stored(cue))
        api.text(ctx, 'Stored  ' + (half ? '1' : destination.toFixed(8)), left, y - 55, 38, color);
    });
  }
  if (zoom > 0)
    api.focus.target('fine-grid', () =>
      drawCloseUp(ctx, api, zoom, landing('single-landing'), stored('single-landing')),
    );
  if (beat === 2)
    api.text(
      ctx,
      'FP32 for the optimizer step   ·   FP16 operands for the matrix multiply',
      960,
      1040,
      34,
      C.ink,
      'center',
    );
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['request-step', 'inspect-ticks', 'half-landing', 'single-landing'],
};
