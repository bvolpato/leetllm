import { clamp, mix, motion, sandboxReconcile } from '../arithmetic.mjs';
import { drawFooter, drawRectangle, drawText } from '../defaults.mjs';
export function drawReconciliationTable(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-reconciliation-table-' + name];
      if (state.cues && !q)
        throw Error('Missing current scene cue sp-reconciliation-table-' + name);
      return q
        ? {
            q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
            done: q.phase === 'after',
          }
        : {
            q: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
            done: currentBeat > index || (currentBeat === index && progress > 0.8),
          };
    },
    cueProgress = (n, i) => cue(n, i).q;
  api.focus.target('sp-reconciliation-table-mechanism', () => {
    drawText(
      ctx,
      api,
      'Supplied diagnostic receipts / same tenant A · S8 · g4',
      180,
      285,
      30,
      themeColors.yellow,
    );
    const q =
        currentBeat === 0
          ? cueProgress('inventory', 0)
          : currentBeat === 1
            ? cueProgress('memory', 1)
            : cueProgress('quarantine', 2),
      owner = {
        tenant: 'A',
        id: 'S8',
        generation: 4,
      },
      rows =
        currentBeat === 0
          ? [
              ['process', 'S8 / g4', 'running'],
              ['cgroup', 'S8 / g4', 'quota enforced'],
              ['command socket', 'S8 / g4', 'open'],
              ['scratch', 'S8 / g4', 'attached'],
              ['network', 'S8 / g4', 'rule installed'],
            ]
          : currentBeat === 1
            ? [
                ['CPU / output', 'S8 / g4', 'budget at limit'],
                ['private memory', 'S8 / g4', Math.round(mix(50, 200, q)) + ' MiB'],
                ['memory event', 'S8 / g4', q === 1 ? 'high' : 'pending'],
                ['fault handler', 'S8 / g4', 'page request stalled'],
                ['admission', 'S8 / g4', q === 1 ? 'HELD' : 'inspecting'],
              ]
            : [
                ['process', 'S8 / g4', 'stopped'],
                ['descriptor', 'S8 / g4', '1 reference open'],
                ['scratch', 'S8 / g4', 'still mounted'],
                ['network', 'S8 / g4', 'revoked'],
                ['capability request', 'S8 / g5', 'DENY / 0 effects'],
              ];
    const xs = [180, 760, 1190],
      widths = [530, 390, 530];
    ['Resource / observation', 'Authoritative owner', 'Observed state'].forEach((n, i) =>
      drawText(ctx, api, n, xs[i] + 20, 365, 28, themeColors.muted),
    );
    rows.forEach(([name, identity, value], i) => {
      const y = 410 + i * 95,
        seen = currentBeat > 0 || i < Math.ceil(q * 5),
        col =
          currentBeat === 2 && i === 4
            ? themeColors.pink
            : currentBeat === 1 && i > 0
              ? themeColors.yellow
              : themeColors.blue;
      if (!seen) return;
      drawRectangle(ctx, api, 180, y, 1540, 80, col);
      drawText(ctx, api, name, 200, y + 52, 28, col);
      drawText(
        ctx,
        api,
        identity,
        780,
        y + 52,
        28,
        identity.includes('g5') ? themeColors.pink : themeColors.blue,
      );
      drawText(
        ctx,
        api,
        value,
        1210,
        y + 52,
        28,
        currentBeat === 2 && i === 0 ? themeColors.green : col,
      );
    });
    const verdict =
      currentBeat === 0
        ? 'Missing heartbeat ≠ exited VMM; adopt or stop the same owner'
        : currentBeat === 1
          ? 'Private growth / fault stall → stop admission and retire execution'
          : sandboxReconcile(owner, {
                tenant: 'A',
                id: 'S8',
                generation: 4,
                running: false,
                refs: 1,
                mounted: true,
                network: false,
              }).free
            ? 'reclaimed'
            : 'QUARANTINE · outstanding descriptor and mount';
    drawText(
      ctx,
      api,
      verdict,
      180,
      950,
      30,
      currentBeat === 2 ? themeColors.pink : themeColors.yellow,
    );
    drawFooter(
      ctx,
      api,
      'Controller observations are supplied fixtures. Deployment fault injection and independent cleanup proof remain required.',
    );
  });
}
export default {
  id: 'reconciliation-table',
  draw: drawReconciliationTable,
  cues: [
    'sp-reconciliation-table-0',
    'sp-reconciliation-table-inventory',
    'sp-reconciliation-table-1',
    'sp-reconciliation-table-memory',
    'sp-reconciliation-table-2',
    'sp-reconciliation-table-quarantine',
  ],
};
