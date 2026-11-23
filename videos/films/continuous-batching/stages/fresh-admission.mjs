import { freshBatchingBoundary } from '../model.mjs';
import { cueProgress, drawBatchingUpgradeColor as requestColor } from '../defaults.mjs';

const prompt = [501, 502];
const delivered = [701, 702];

function drawResume(ctx, state, api) {
  const { C } = api;
  const replay = cueProgress(state, 'fresh-history-replay', 0.32, 0.49);
  const consume = cueProgress(state, 'fresh-b-input', 0.63, 0.71) >= 1;
  const emitted = cueProgress(state, 'fresh-only-new', 0.76, 0.81) >= 1;
  const cost = cueProgress(state, 'fresh-replay-cost', 0.82, 0.90) > 0;
  const history = [...prompt, ...delivered];
  const used = consume ? 4 : Math.floor(3 * replay);
  const x = i => 638 + i * 229;

  api.text(ctx, 'B resumes on one returned page', 960, 275, 44, C.ink, 'center');
  api.text(ctx, 'Saved IDs', 203, 433, 39, C.muted);
  history.forEach((id, i) => {
    api.text(ctx, i < 2 ? 'prompt' : 'output', x(i), 366, 26, C.muted, 'center');
    api.text(ctx, String(id), x(i), 435, 48, C.ink, 'center');
  });
  api.text(ctx, 'KV page', 203, 628, 39, C.cyan);
  history.forEach((id, i) => {
    api.rect(ctx, x(i) - 88, 554, 176, 102, C.panel, i < used ? C.cyan : C.muted, 5);
    if (i < used) api.text(ctx, String(id), x(i), 622, 45, C.cyan, 'center');
  });
  api.focus.target('fresh-b-history-emitted', () => {
    api.text(ctx, 'Client has', 203, 858, 39, C.green);
    (emitted ? [...delivered, 703] : delivered).forEach((id, i) => {
      api.rect(ctx, x(i) - 88, 783, 176, 102, C.panel, C.green, 5);
      api.text(ctx, String(id), x(i), 851, 45, C.green, 'center');
    });
  });
  if (replay > 0)
    api.text(ctx, cost ? 'B waited for D and replayed 3 positions for 1 new token'
      : emitted ? 'One new delivery' : consume ? 'Decode consumed 702' : 'Rebuilding three cached positions',
      960, 980, 36, C.ink, 'center');
}

export function drawFreshAdmission(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  api.focus.target('fresh-admission-mechanism', () => {
    if (beat >= 3) return drawResume(ctx, state, api);

    const fit = beat === 1 && cueProgress(state, 'fresh-admission-b2', 0.2, 0.28) >= 1;
    const paused = beat === 2 && cueProgress(state, 'fresh-admission-b3', 0.32, 0.36) >= 1;
    const dRestore = beat === 2 ? cueProgress(state, 'fresh-d-restore', 0.50, 0.60) : 0;
    const eRestore = beat === 1 ? cueProgress(state, 'fresh-e-restore', 0.3, 0.43) : 0;
    const ran = (beat === 1 && cueProgress(state, 'fresh-e-run', 0.6, 0.69) >= 1) ||
      (beat === 2 && cueProgress(state, 'fresh-d-run', 0.60, 0.65) >= 1);
    const completeD = beat === 2 && cueProgress(state, 'fresh-d-complete', 0.78, 0.82) >= 1;
    const accessDone = beat === 2 && cueProgress(state, 'fresh-d-return', 0.91, 0.98) >= 1;
    const policy = dRestore > 0 ? 'aged' : fit ? 'fit' : 'fifo';
    const f = freshBatchingBoundary(policy, {
      completeD,
      readersDone: accessDone,
      writesDone: accessDone,
      transfersDone: accessDone,
    });
    const { returned } = f;
    const members = f.active.filter(r => !(paused && r.id === 'B'));
    const occupants = Array(f.capacity).fill(null);
    members.forEach(r => {
      const saved = r.id === 'E' ? Math.floor(r.length * eRestore)
        : r.id === 'D' ? Math.floor(r.length * dRestore) : r.length;
      const processed = saved + Number(ran);
      r.pages.forEach((page, i) => {
        occupants[page] = { id: r.id, used: Math.max(0, Math.min(f.block, processed - i * f.block)) };
      });
    });

    api.text(ctx, 'Starting queue', 168, 264, 32, C.muted);
    const showInput = beat > 0 || cueProgress(state, 'fresh-next-input', 0.49, 0.62) > 0;
    for (const [i, request] of [f.D, f.E].entries()) {
      const left = 488 + i * 736;
      const color = requestColor(ctx, api, request.id);
      api.text(ctx, request.id + '   ' + request.length + ' saved', left, 247, 38, color);
      for (let pos = 0; pos < request.length + Number(showInput); pos++) {
        const x = left + pos * 32 + Math.floor(pos / f.block) * 16;
        api.rect(ctx, x, 266, 26, 32, pos < request.length ? color : C.panel, color, 3);
      }
    }
    api.text(ctx, 'GPU pages', 187, 439, 37, C.ink);
    occupants.forEach((owner, i) => {
      const x = 430 + i * 266;
      const color = owner ? requestColor(ctx, api, owner.id) : C.muted;
      api.text(ctx, 'Page ' + i, x + 107, 367, 28, C.muted, 'center');
      api.rect(ctx, x, 390, 214, 143, C.panel, color, 6);
      api.text(ctx, owner?.id ?? 'free', x + 107, 444, 37, color, 'center');
      for (let j = 0; j < f.block; j++) {
        const filled = j < (owner?.used ?? 0);
        api.rect(ctx, x + 20 + j * 45, 471, 37, 37, filled ? color : C.panel, color, 3);
      }
    });
    api.text(ctx, 'Seat owners', 187, 663, 36, C.ink);
    for (let i = 0; i < f.seats; i++) {
      const id = members[i]?.id;
      const color = id ? requestColor(ctx, api, id) : C.muted;
      api.rect(ctx, 480 + i * 254, 593, 208, 102, C.panel, color, 5);
      api.text(ctx, id ?? 'open', 584 + i * 254, 659, 38, color, 'center');
    }
    api.text(ctx, 'Decode inputs', 187, 820, 36, C.ink);
    for (let i = 0; i < f.work; i++) {
      const id = ran && !returned ? members[i]?.id : null;
      const color = id ? requestColor(ctx, api, id) : C.muted;
      api.rect(ctx, 480 + i * 149, 759, 124, 81, C.panel, color, 5);
      if (id) api.text(ctx, id, 542 + i * 149, 813, 35, color, 'center');
    }

    let status = 'Each small square holds one processed position';
    if (paused) status = 'B keeps its accepted output. Its page is free.';
    if (fit || dRestore > 0) status = 'Restored positions   ' +
      (fit ? Math.floor(f.E.length * eRestore) + ' of ' + f.E.length + ' for E'
        : Math.floor(f.D.length * dRestore) + ' of ' + f.D.length + ' for D');
    if (ran) status = members.length + ' decode inputs used out of ' + f.work + (fit ? '   ·   D still waits' : '   ·   B is paused');
    if (completeD && !returned) status = 'D finished. Its three pages are still reserved.';
    if (returned) status = 'All access to D’s pages has finished. Three pages are free.';
    api.text(ctx, status, 960, 967, 38, C.ink, 'center');
  });
}
export default {
  id: 'fresh-admission',
  draw: drawFreshAdmission,
  cues: ['fresh-admission-b1', 'fresh-next-input', 'fresh-admission-b2', 'fresh-e-restore', 'fresh-e-run',
    'fresh-admission-b3', 'fresh-d-restore', 'fresh-d-run', 'fresh-d-complete', 'fresh-d-return', 'fresh-admission-b4',
    'fresh-history-replay', 'fresh-b-input', 'fresh-only-new', 'fresh-replay-cost'],
};
