import { admissionReceipt, fleetReady } from '../arithmetic.mjs';
import { phraseEnded, phraseProgress } from '../construction.mjs';
import { drawDispatch, drawFleet } from '../sampler.mjs';

const initial = { B: 2, S: 1, step: 7, accepted: 13, running: 2, workers: 4 };
const waiting = { group: 'query-73', scheduled: 3, token: 31, logp: -0.7 };

export function drawEarnedHandoff(ctx, scene, state, api) {
  const { C } = api;
  const end = (id, beat, at) => phraseEnded(state, api, id, beat, at);
  const repaired = end('sky-fresh-replica', 2, 0.24);
  const lastProbe = end('sky-fresh-resume', 2, 0.8);
  const finished = end('fresh-complete', 2, 0.48) || lastProbe;
  const twoProbes = end('fresh-two-probes', 2, 0.58) || lastProbe;
  const versions = [repaired ? 19 : 18, 19, 19];
  const probes = [twoProbes, twoProbes, lastProbe];
  const ready = fleetReady(versions, 19, finished, probes);
  const permission = ready && admissionReceipt(initial).available > 0;
  const admitted = permission && end('fresh-admit', 2, 0.93);
  const r = admissionReceipt({ ...initial, running: initial.running + Number(admitted) });
  const counted = end('sky-fresh-outstanding', 1, 0.38);
  const started = end('fresh-parameters', 0, 0.23);
  const inputs = end('fresh-premises', 0, 0.42);
  const scheduledKnown = end('fresh-scheduled', 0, 0.59);
  const meter = phraseProgress(state, api, 'fresh-receipts', 0, 0.62, 0.8);
  const margin = end('fresh-one-slot', 1, 0.6);
  const lagKnown = end('sky-fresh-lag', 1, 0.75);

  api.focus.target('fresh-budget', () => {
    api.text(ctx, 'Before update 7', 125, 280, 42, C.ink, 'left', 'serif');
    if (started) api.text(ctx, '2 groups per update     S = 1', 125, 354, 32, C.ink);
    if (inputs)
      api.text(
        ctx,
        `Accepted  ${r.accepted}     Running  ${r.running}     Workers  ${r.workers}`,
        125,
        423,
        30,
        C.ink,
      );
    if (scheduledKnown) {
      const history = `${waiting.group}  ·  scheduled ${waiting.scheduled}`;
      api.text(
        ctx,
        history + (lagKnown ? `  ·  lag ${r.step - waiting.scheduled}` : ''),
        125,
        481,
        31,
        C.yellow,
      );
      api.focus.target('fresh-history', () =>
        api.text(
          ctx,
          `Token ${waiting.token}   /   sampled log p = ${waiting.logp.toFixed(2)}`,
          125,
          535,
          29,
          C.blue,
        ),
      );
    }
    for (let i = 0; i < r.budget; i++) {
      const used = counted && i < r.outstanding;
      api.rect(
        ctx,
        125 + i * 141,
        569,
        120,
        64,
        used ? C.blue : C.panel,
        counted ? C.blue : C.muted,
        9,
      );
      const label = !counted
        ? '?'
        : !used
          ? 'free'
          : i < r.accepted - r.consumed
            ? 'ready'
            : 'running';
      api.text(ctx, label, 185 + i * 141, 611, 26, used ? C.bg : C.muted, 'center');
    }
    api.text(
      ctx,
      counted
        ? `${r.accepted} + ${r.running} − ${r.consumed} = ${r.outstanding} outstanding`
        : 'How many slots are free?',
      125,
      688,
      32,
      counted ? C.cyan : C.ink,
    );
    if (margin) {
      const slots = r.capacityMargin === 1 ? 'slot' : 'slots';
      const workers = r.workerMargin === 1 ? 'worker' : 'workers';
      api.text(
        ctx,
        `${r.budget} − ${r.outstanding} = ${r.capacityMargin} free ${slots}    /    ${r.workerMargin} free ${workers}`,
        125,
        741,
        29,
        C.cyan,
      );
    }
  });

  api.focus.target('fresh-fleet', () =>
    drawFleet(ctx, api, {
      x: 915,
      y: 280,
      width: 880,
      versions,
      target: 19,
      finished,
      probes,
      readings: Math.ceil(3 * meter),
    }),
  );
  api.focus.target('fresh-route', () => {
    const held = end('sky-fresh-paused', 1, 0.86);
    let status = 'Is there room for one more group? May it start sampling?';
    if (held) status = 'KEEP PAUSED    /    replica 0 still serves v18';
    if (repaired)
      status = finished
        ? 'KEEP PAUSED    /    waiting for probes'
        : 'KEEP PAUSED    /    finish-update pending';
    if (permission) status = 'NEW GENERATION MAY RESUME';
    if (admitted) status = 'query-74 is running    /    the fourth slot is occupied';
    drawDispatch(ctx, api, {
      ready: permission,
      progress: phraseProgress(state, api, 'fresh-admit', 2, 0.82, 0.93),
      label: 'query-74  /  new group',
      status,
    });
  });
}
export default {
  id: 'earned-handoff',
  draw: drawEarnedHandoff,
  cues: [
    'fresh-parameters',
    'fresh-premises',
    'fresh-scheduled',
    'fresh-receipts',
    'fresh-question',
    'sky-fresh-outstanding',
    'fresh-one-slot',
    'sky-fresh-lag',
    'sky-fresh-paused',
    'sky-fresh-replica',
    'fresh-complete',
    'fresh-two-probes',
    'sky-fresh-resume',
    'fresh-admit',
    'fresh-history-score',
  ],
};
