import { checkedRevisionLedger } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { sceneClock } from '../scene-clock.mjs';

export function drawRevision(ctx, scene, state, api) {
  const { C } = api,
    cue = sceneClock(scene, state);
  const events = ['draft-check', 'repair-candidate', 'damaged-revision', 'plateau-score'].map(cue);
  const count =
    cue('fourth-paid').started || events[3].started
      ? 4
      : events[2].started
        ? 3
        : events[1].started
          ? 2
          : 1;
  const ledger = checkedRevisionLedger(count);
  const best = ledger.rows.find((row, i) => events[i].done && row.passed);
  const label = (s, x, y, size, color = C.ink) => text(ctx, api, s, x, y, size, color);
  label('Draft and independent room check', 122, 240, 36);
  label('4 × 8 + 12 = 44', 1165, 240, 49, C.ink);
  for (const [i, row] of ledger.rows.entries()) {
    const checked = events[i].done;
    const color = checked ? (row.passed ? C.green : C.pink) : C.muted;
    const y = 286 + i * 133;
    api.focus.target(`revision-candidate-${i + 1}`, () =>
      api.components.card({
        x: 130,
        y,
        width: 675,
        height: 109,
        label: checked
          ? `${row.id} · answer ${row.answer}     External ${row.passed ? 'PASS' : 'FAIL'}`
          : `${row.id} · answer pending`,
        fontSize: 36,
        padding: 14,
        fill: C.panel,
        stroke: color,
        textColor: color,
      }),
    );
    label(checked ? row.score.toFixed(3) : '…', 858, y + 70, 45, checked ? C.cyan : C.muted);
  }
  label('Score', 855, 242, 32, C.muted);
  api.focus.target('retained-checked-answer', () => {
    const checked = events[count - 1].done;
    const latest = checked ? (ledger.latest.passed ? 'PASS' : 'FAIL') : 'pending';
    api.components.card({
      x: 1150,
      y: 310,
      width: 650,
      height: 146,
      label: best
        ? `Retained ${best.id} · ${best.answer} chairs\nLatest ${ledger.latest.id}: ${latest}`
        : 'Awaiting a checked draft',
      fontSize: 37,
      baselineOffset: best ? -17 : 12,
      padding: 15,
      fill: C.panel,
      stroke: best ? C.green : C.muted,
      textColor: best ? C.green : C.muted,
    });
  });
  api.focus.target('threshold', () => label('Continue if gain ≥ 0.010', 1150, 560, 42, C.yellow));
  api.focus.target('delta', () => {
    if (cue('stop-revision').started) {
      label(`Gain ${ledger.gain.toFixed(3)}   ·   Stop`, 1150, 678, 53, C.yellow);
    } else if (events[3].done) {
      label('0.781 − 0.780 = ?', 1150, 678, 53);
      if (cue('fifth-draft').started) label('Pay for draft five?', 1150, 766, 40, C.yellow);
    } else if (events[2].done) {
      label('0.780 − 0.760 = 0.020', 1150, 678, 42);
    }
  });
  api.focus.target('paid-calls', () => {
    label(`rounds charged: ${count}`, 130, 879, 37, C.muted);
    label(`generation calls: ${ledger.calls}`, 710, 879, 42, C.blue);
    for (let i = 0; i < ledger.calls; i++) {
      const x = 130 + i * 230,
        color = i % 2 === 1 ? C.yellow : C.blue;
      api.rect(ctx, x, 918, 202, 67, C.panel, color, 7);
      text(
        ctx,
        api,
        i === 0 ? 'draft' : i % 2 === 1 ? 'critique' : 'rewrite',
        x + 101,
        964,
        32,
        color,
        'center',
      );
    }
  });
}

export default { id: 'revision', draw: drawRevision };
