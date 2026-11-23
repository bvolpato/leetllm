import { guardCue, guardDone, prevalenceCounts } from '../model.mjs';

const counts = prevalenceCounts();
const { total, harmful, safe, falsePositive, truePositive, falseNegative, falsePerTrue } = counts;
const blocked = falsePositive + truePositive;
const quantity = (value) => value.toLocaleString('en-US');

export function paintPrevalenceShift(ctx, scene, state, api) {
  const { C, text, rect, focus } = api;
  const progress = guardCue(state, 'prevalence-shift-counts', 0, 0.47, 0.74);
  const ratio = guardDone(state, 'prevalence-shift-ratio', 0, 0.81, 0.97);
  focus.target('prevalence-population', () => {
    text(
      ctx,
      'If only ' + quantity(harmful) + ' of ' + quantity(total) + ' requests are harmful',
      145,
      290,
      42,
      C.ink,
    );
    text(
      ctx,
      'Block rates stay fixed: 1% of safe requests and 90% of harmful requests.',
      145,
      358,
      32,
      C.muted,
    );
  });
  focus.target('prevalence-blocked', () => {
    text(ctx, 'Review queue', 145, 477, 36, C.ink);
    const unit = 1490 / blocked;
    const safeWidth = unit * falsePositive * progress;
    const harmfulWidth = unit * truePositive * progress;
    if (progress > 0) {
      rect(ctx, 145, 520, safeWidth, 82, C.yellow, undefined, 0);
      rect(ctx, 145 + safeWidth, 520, harmfulWidth, 82, C.blue, undefined, 0);
    }
    text(
      ctx,
      progress === 1 ? quantity(falsePositive) + ' safe' : 'Safe requests',
      145,
      662,
      36,
      C.yellow,
    );
    text(
      ctx,
      progress === 1 ? quantity(truePositive) + ' harmful' : 'Harmful requests',
      1640,
      662,
      36,
      C.blue,
      'right',
    );
  });
  if ((state.beat ?? 0) === 0)
    focus.target('prevalence-ratio', () => {
      text(
        ctx,
        ratio
          ? falsePositive +
              ' ÷ ' +
              truePositive +
              ' = ' +
              falsePerTrue +
              ' false alarms per harmful block'
          : 'How many false alarms for each harmful block?',
        960,
        837,
        41,
        ratio ? C.yellow : C.ink,
        'center',
      );
    });
  else
    focus.target('prevalence-metrics', () => {
      text(ctx, 'Precision', 145, 809, 32, C.muted);
      text(ctx, truePositive + ' / ' + quantity(blocked) + ' blocked', 145, 880, 38, C.ink);
      if (guardCue(state, 'prevalence-shift-denominators', 1, 0.4, 0.65) > 0) {
        text(ctx, 'False-positive rate', 755, 809, 32, C.muted);
        text(ctx, falsePositive + ' / ' + quantity(safe) + ' safe', 755, 880, 38, C.yellow);
        text(ctx, 'False-negative rate', 1360, 809, 32, C.muted);
        text(ctx, falseNegative + ' / ' + quantity(harmful) + ' harmful', 1360, 880, 38, C.blue);
      }
    });
}

export { paintPrevalenceShift as drawPrevalenceShift };
export default {
  id: 'prevalence-shift',
  draw: paintPrevalenceShift,
  cues: [
    'prevalence-shift-population',
    'prevalence-shift-counts',
    'prevalence-shift-ratio',
    'prevalence-shift-denominators',
  ],
};
