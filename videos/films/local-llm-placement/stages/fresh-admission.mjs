import { admission, releaseCases } from '../model.mjs';
import { outputs } from '../fixtures.mjs';
import { cueProgress, memoryRail } from '../worksheet.mjs';

export function drawFreshAdmission(ctx, scene, state, api) {
  const { C, focus } = api,
    p = cueProgress(scene, state, api);
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const eight = admission(8),
    seven = admission(7),
    perLog = admission(1).kv;
  const applied = p('count-eight'),
    wait = p('queue-eight');
  const release = releaseCases();
  const quality = state.beat >= 2;
  const x = 150,
    width = 1610,
    maximum = 18;
  const scale = (v) => x + (width * v) / maximum;
  focus.target('session-inputs', () => {
    text(
      `32,768 tokens per log   ·   capped storage   ·   ${perLog.toFixed(4)} GB of cache per log`,
      x,
      262,
      35,
    );
    for (let i = 0; i < 8; i++) {
      const left = x + 202 * i,
        down = i === 7 ? 56 * wait : 0;
      const col = i === 7 && wait > 0 ? C.yellow : C.cyan;
      api.rect(ctx, left, 317 + down, 177, 71, C.panel, col, 8);
      text('Log ' + (i + 1), left + 88, 364 + down, 31, col, 'center');
      if (i === 7 && wait === 1) text('Queued', left + 88, 482, 27, C.yellow, 'center');
    }
  });
  focus.target('admission-bar', () => {
    const segments = [
      { gb: 7.6, color: C.blue },
      { gb: 2, color: C.pink },
    ];
    for (let i = 0; i < 8; i++) {
      const fraction = Math.min(1, Math.max(0, applied * 8 - i));
      segments.push({ gb: perLog * fraction * (i === 7 ? 1 - wait : 1), color: C.cyan });
    }
    memoryRail(ctx, api, { x, y: 540, width, height: 68, maximum, segments });
    text('7.6 GB weights', x + 28, 588, 32, C.bg);
    text('2 GB work', scale(8.6), 586, 29, C.bg, 'center');
    for (let i = 1; i < applied * 8 && i < 8; i++) {
      if (i === 7 && wait === 1) continue;
      api.line(ctx, scale(9.6 + i * perLog), 546, scale(9.6 + i * perLog), 603, C.bg, 3);
    }
    api.line(ctx, scale(16), 519, scale(16), 630, C.yellow, 5);
    text('16 GB limit', scale(16), 674, 30, C.yellow, 'center');
    const result = wait === 1 ? seven : eight;
    if ((wait === 0 && p('eight-total') === 1) || (wait === 1 && p('seven-fit') === 1)) {
      text(
        `${result.total.toFixed(3)} GB   ·   ${result.sessions} logs ${result.fits ? 'fit' : 'exceed the limit'}`,
        x,
        679,
        39,
        result.fits ? C.green : C.pink,
      );
    }
  });
  focus.target('case-policy', () => {
    if (!quality) {
      const allowance = eight.limit - 7.6 - 2;
      const logs = allowance / perLog;
      let working = 'How many of the eight logs can the worker admit?';
      if (p('eight-total') === 1) working = 'Cache allowance = (16 − 7.6 − 2) GB';
      if (p('cache-allowance') === 1) working += ` = ${allowance.toFixed(1)} GB`;
      if (p('divide-allowance') > 0)
        working = `${allowance.toFixed(1)} GB ÷ ${perLog.toFixed(4)} GB per log`;
      if (p('divide-allowance') === 1)
        working += ` ≈ ${logs.toFixed(2)} logs   →   ${Math.floor(logs)} whole logs`;
      text(working, x, 875, 45);
      return;
    }
    if (p('field-replay') > 0) {
      text('Field laptop   ·   replay the workload on battery', x, 778, 43);
      text('As it warms up', x, 869, 33, C.muted);
      text('Measure power use and response time', x + 340, 869, 38);
      if (p('offline-check') > 0) {
        text('Offline', x, 961, 33, C.yellow);
        text('Open the local fallback runbook', x + 340, 961, 38);
      }
      return;
    }
    const verdict = p('inspect-command') === 1;
    text('Paired checks', x, 780, 35);
    for (const [i, row] of release.rows.entries()) {
      const left = 485 + i * 180;
      const col = row.protected ? C.yellow : C.muted;
      text(row.id + (row.protected ? ' ★' : ''), left, 766, 27, col, 'center');
      text(row.before ? 'pass' : 'fail', left, 824, 29, row.before ? C.green : C.pink, 'center');
      const candidate =
        verdict && row === release.lost ? 'still fails' : row.after ? 'pass' : 'fail';
      text(candidate, left, 881, 29, row.after ? C.green : C.pink, 'center');
    }
    text('Baseline   ' + release.rows.filter((r) => r.before).length + '/5', x, 824, 28, C.muted);
    text('Candidate   ' + release.passes + '/5', x, 882, 28, C.muted);
    text('Need ≥ 4 passes', 1330, 792, 30);
    text('★ Protect rollback', 1330, 851, 30, C.yellow);
    let footer = 'Can this candidate take the admitted logs?';
    if (verdict && release.lost)
      footer = `${release.lost.id}   ·   ${outputs.candidate[0]}   ·   missing --confirm`;
    if (p('local-handoff') > 0 && !release.promote)
      footer = 'Hold candidate   →   approved local runbook or human review';
    text(footer, x, 989, 37, verdict ? C.yellow : C.ink);
  });
}
export default {
  id: 'fresh-admission',
  draw: drawFreshAdmission,
  cues: [
    'new-workload',
    'session-question',
    'count-eight',
    'eight-total',
    'cache-allowance',
    'divide-allowance',
    'queue-eight',
    'seven-fit',
    'case-grid',
    'ask-promote',
    'inspect-command',
    'local-handoff',
    'field-replay',
    'offline-check',
  ],
};
