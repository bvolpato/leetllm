import { lanes, policy } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { execute } from '../model.mjs';
import { after, progress } from '../timing.mjs';
import { cents, text } from '../defaults.mjs';

const local = lanes.find((lane) => lane.id === 'D');
const early = execute();
const late = execute(1800);
const tightCap = 8000;
const tight = execute(940, tightCap);
const ms = (n) => Math.round(n).toLocaleString('en-US');
const xTime = (n) => 310 + n * 0.49;

function timeRow(ctx, api, y, run, primaryProgress, fallbackProgress, proposed, verdict, focusId) {
  const { C, focus } = api;
  const primaryEnd = run.spans[0].end;
  focus.target(focusId, () => {
    text(ctx, api, primaryEnd === early.spans[0].end ? 'Early' : 'Late', 155, y + 33, 36, C.ink);
    api.line(ctx, xTime(0), y + 72, xTime(3000), y + 72, C.muted, 2);
    if (primaryProgress > 0)
      api.rect(ctx, xTime(0), y, xTime(primaryEnd * primaryProgress) - xTime(0), 46, C.blue);
    if (primaryProgress === 1)
      text(ctx, api, `C timed out at ${ms(primaryEnd)} ms`, xTime(0), y - 26, 32, C.blue);
    if (fallbackProgress > 0) {
      const width = xTime(local.latency * fallbackProgress) - xTime(0);
      api.rect(
        ctx,
        xTime(primaryEnd),
        y,
        width,
        46,
        proposed ? C.bg : C.green,
        proposed ? C.yellow : undefined,
        3,
      );
    }
    if (verdict) {
      const caption = proposed
        ? `D would finish at ${ms(primaryEnd + local.latency)} ms`
        : `D finished at ${ms(run.elapsed)} ms`;
      text(ctx, api, caption, xTime(primaryEnd), y + 128, 32, proposed ? C.yellow : C.green);
    }
  });
}

function spend(ctx, api, state, snapshot) {
  const { C, focus } = api;
  const { denied } = snapshot;
  const lowering = progress(state, 'lower-cap', 3, 0.32, 0.55);
  const cap = Math.round(api.lerp(policy.requestCap, tightCap, lowering));
  const primaryCharge = tight.spans[0].charge;
  const quoted = progress(state, 'reserve-d', 3, 0.48, 0.75);
  const x = (n) => 240 + n * 0.143;
  text(ctx, api, 'C timed out at 940 ms   ·   D still has time', 150, 300, 38, C.cyan);
  focus.target('funds', () => {
    text(ctx, api, 'Request cap   ' + cents(cap), x(cap), 435, 36, C.yellow, 'right');
    api.line(ctx, x(cap), 470, x(cap), 790, C.yellow, 4);
    text(ctx, api, 'C’s settled charge', x(0), 555, 33, C.ink);
    api.rect(ctx, x(0), 595, x(primaryCharge) - x(0), 70, C.blue);
    text(ctx, api, cents(primaryCharge), x(0), 735, 40, C.blue);
    text(ctx, api, 'D’s reservation', x(primaryCharge) + 25, 555, 33, C.ink);
    if (quoted > 0)
      api.rect(
        ctx,
        x(primaryCharge),
        595,
        x(policy.reservation * quoted) - x(0),
        70,
        C.bg,
        denied ? C.pink : C.cyan,
        3,
      );
    if (quoted === 1)
      text(
        ctx,
        api,
        cents(policy.reservation) + ' required',
        x(primaryCharge) + 25,
        735,
        36,
        C.cyan,
      );
    // Keep the budget boundary visible over the proposed reservation.
    api.line(ctx, x(cap), 583, x(cap), 680, C.yellow, 5);
  });
  const remaining = cap - primaryCharge;
  const showRemaining = after(state, 'show-remainder', 4, 0.14);
  focus.target('funds', () =>
    text(
      ctx,
      api,
      showRemaining
        ? `${cents(cap)} − ${cents(primaryCharge)} = ${cents(remaining)} left`
        : lowering === 1
          ? 'Can the gateway reserve enough to send D?'
          : '',
      960,
      881,
      42,
      denied ? C.pink : C.yellow,
      'center',
    ),
  );
  if (denied)
    text(
      ctx,
      api,
      `Stop at ${ms(tight.elapsed)} ms   ·   ${tight.spans.length} attempt charged`,
      960,
      970,
      34,
      C.ink,
      'center',
    );
}

export function drawDeadline(ctx, scene, state, api) {
  const snapshot = sampleModel('deadline', state);
  if (state.beat >= 3) return spend(ctx, api, state, snapshot);
  const { C, focus } = api;
  const { earlyC, earlyD, earlyDone, slowC, skip } = snapshot;
  const quote = progress(state, 'project-d', 2, 0.22, 0.48);
  text(ctx, api, 'R900   ·   2 attempts allowed   ·   D needs 1,100 ms', 150, 259, 34, C.ink);
  text(ctx, api, 'Deadline   2,500 ms', xTime(policy.deadline), 342, 35, C.yellow, 'center');
  timeRow(ctx, api, 455, early, earlyC, earlyD, false, earlyDone, 'early-run');
  if (state.beat >= 1) timeRow(ctx, api, 737, late, slowC, quote, true, quote === 1, 'late-run');
  api.line(ctx, xTime(policy.deadline), 365, xTime(policy.deadline), 835, C.yellow, 4);
  focus.target(state.beat === 0 ? 'early-run' : 'late-run', () => {
    let note = 'One clock starts when R900 arrives';
    if (state.beat === 0 && earlyDone)
      note = `${ms(policy.deadline - early.elapsed)} ms left   ·   2 generation attempts`;
    if (state.beat === 1)
      note =
        slowC === 1
          ? `${ms(policy.deadline)} − ${ms(late.elapsed)} = ${ms(late.remaining)} ms left.   Start D?`
          : 'Replay the same request with a later timeout';
    if (state.beat === 2)
      note = skip
        ? `Stop at ${ms(late.elapsed)} ms   ·   ${late.spans.length} attempt   ·   D never started`
        : `${ms(late.remaining)} ms left.   Start D?`;
    text(ctx, api, note, 960, 993, 37, skip ? C.pink : C.cyan, 'center');
  });
}
export default {
  id: 'deadline',
  draw: drawDeadline,
  cues: [
    'early-timeout',
    'local-runs',
    'early-finish',
    'late-timeout',
    'skip-local',
    'project-d',
    'lower-cap',
    'reserve-d',
    'show-remainder',
    'decline-spend',
  ],
};
