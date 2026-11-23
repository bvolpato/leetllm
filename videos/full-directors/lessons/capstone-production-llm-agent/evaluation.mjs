import {
  C,
  badge,
  foot,
  header,
  lerp,
  line,
  mono,
  paint,
  paper,
  plate,
  serif,
  smooth,
  type,
} from './workshop.mjs';
import { audit, baseReport, budget, recordedPath } from './mechanism.mjs';

const names = [
  'Urgent intake',
  'Stale bundle',
  'Grounded draft',
  'Unsupported note',
  'Forbidden restore',
  'Approval replay',
];
const labels = new Map(baseReport.rows.map((r, i) => [r.episode, names[i]]));

export function evaluation(c, at) {
  const urgent = at(0, 'The urgent and stale'),
    draft = at(0, 'The grounded draft'),
    note = at(0, 'The unsupported question');
  const forbidden = at(0, 'For the forbidden restore'),
    replay = at(1, 'The replay fixture');
  const extra = at(2, 'Add a passed field'),
    failed = at(2, 'The grader rejects');
  const flipped = at(2, 'a flipped execution flag'),
    bool = at(2, 'a Boolean used');
  const dup = at(2, 'replace the replay episode'),
    hold = at(3, 'Hold for coverage'),
    reset = at(3, 'Restore the original report');
  const change = reset
    ? 'original'
    : dup
      ? 'duplicate'
      : bool
        ? 'boolean'
        : flipped
          ? 'executed'
          : extra
            ? 'extra'
            : 'original';
  const data = audit(change);
  header(c, 'Would you accept this run report?', 'Fixture grader');
  paper(c, 37, 105, 884, 295);
  const xs = [59, 272, 609, 831];
  ['Episode', 'Recorded path', 'Executed', 'Effects'].forEach((s, i) =>
    type(c, s, xs[i], 139, 17, { color: C.muted, weight: 700 }),
  );
  data.rows.forEach((r, i) => {
    const y = 173 + i * 40;
    const show = [urgent, urgent, draft, note, forbidden, replay][i];
    const edited =
      (['extra', 'executed'].includes(change) && i === 4) ||
      (['duplicate', 'boolean'].includes(change) && i === 5);
    if (edited) paint(c, 47, y - 26, 862, 36, '#f3d5bc', 1);
    line(c, 56, y + 9, 903, y + 9, '#cecdbb');
    type(c, labels.get(r.episode), xs[0], y, 19);
    if (!show) {
      mono(c, 'Awaiting row', xs[1], y, 15, { color: C.muted });
      return;
    }
    type(c, recordedPath(r), xs[1], y, 17, { max: 315 });
    const flags = r.executed.length ? r.executed.map((x) => (x ? 'T' : 'F')).join('   ') : '—';
    mono(c, flags, xs[2], y, 18, { color: r.executed.includes(false) ? C.red : C.ink });
    mono(c, typeof r.restore_count === 'boolean' ? 'True' : r.restore_count, xs[3] + 6, y, 19);
  });
  if (change === 'extra') badge(c, 'Extra field   passed = True', 42, 410, 303, 'pending', 16);
  else if (change === 'executed')
    badge(c, 'Edited flag   executed = True', 42, 410, 313, 'pending', 16);
  else if (change === 'boolean') badge(c, 'Edited count   1 → True', 42, 410, 303, 'pending', 16);
  else if (dup && !reset) mono(c, 'Submitted  ' + data.rows.length + ' rows', 43, 434, 17);
  else
    mono(c, 'T = executed     F = blocked     — = no planner actions', 43, 432, 15, {
      color: C.muted,
    });
  const reveal = reset || (dup ? hold : extra ? failed : false);
  if (reveal) badge(c, data.verdict, 611, 410, 302, change === 'original' ? 'good' : 'bad', 17);
  if (reset) foot(c, 'Fixture result only. Bind the run to the evaluated build before release.');
  else if (dup) foot(c, 'Do these six rows cover every required episode once?');
  else if (extra) foot(c, 'Each edit is checked against the original episode contract.');
  else foot(c, 'Actions and flags come from the trace. The count comes from SQLite.');
}

const baseRun = budget('base');
const extendedRun = budget('extra');
const exactRun = budget('equal');
const nextIndex = extendedRun.events.length;
const nextCall = extendedRun.events.at(-1);

export function accounting(c, at, after) {
  const appended = after(1, 'Append five hundred tokens and nine hundred fifty milliseconds');
  const added = after(
    1,
    'The totals jump to five events, one thousand seventy tokens and one thousand four hundred eighty milliseconds',
    0.55,
  );
  const exceeded = after(1, 'All three exceed their limits');
  const rewind = at(1, 'Enforce allowances before dispatch', 0.65);
  const second = at(2, 'Try the four events');
  const equality = after(3, 'Equality passes');
  const readTotals = second
    ? after(3, 'Four events consumed nine hundred tokens in twelve hundred milliseconds')
    : after(0, 'Four events used five hundred seventy tokens and five hundred thirty milliseconds');
  const data = second ? exactRun : baseRun;
  const rewinding = !second && rewind > 0 && rewind < 1;
  const projecting = !second && rewind === 1;
  const addedShare = second ? 0 : smooth(rewind > 0 ? 1 - rewind : added);
  const settled = !second && added === 1 && rewind === 0;
  const pending = !second && appended && !settled;
  header(
    c,
    'When does the request exhaust its budget?',
    second ? 'Boundary case' : projecting ? 'Before dispatch' : 'Run accounting',
  );
  paper(c, 39, 109, 390, 305);
  mono(c, 'SEQUENTIAL CALLS', 61, 141, 15, { color: C.muted });
  ['Call', 'Tokens', 'Time (ms)'].forEach((s, i) =>
    type(c, s, [62, 169, 286][i], 177, 17, { weight: 700 }),
  );
  data.events.forEach((r, i) => {
    const y = 213 + i * 39;
    mono(c, i + 1, 62, y, 20);
    mono(c, r.tokens, 172, y, 20);
    mono(c, r.ms, 293, y, 20);
    line(c, 59, y + 9, 409, y + 9, '#d4d0bb');
  });
  if (appended && !second) {
    const y = 213 + baseRun.events.length * 39;
    paint(c, 50, y - 23, 368, 31, '#f1d4a7');
    mono(c, nextIndex, 62, y, 20);
    mono(c, nextCall.tokens, 172, y, 20);
    mono(c, nextCall.ms, 293, y, 20);
    if (projecting) type(c, 'Proposed call estimate', 62, y + 30, 18, { color: C.copper, weight: 700 });
  }
  plate(c, 451, 109, 468, 305, { dark: true });
  mono(
    c,
    projecting ? 'PRE-CALL CHECK' : rewinding ? 'REWINDING TO DISPATCH' : 'POST-RUN AUDIT',
    474,
    141,
    15,
    { color: C.sea },
  );
  const x = 477;
  const w = 410;
  const limitWidth = 272;
  const limitX = x + limitWidth;
  type(c, 'Limit', limitX, 144, 16, { align: 'center', color: C.cream });
  ['Events', 'Tokens', 'Milliseconds'].forEach((name, i) => {
    const y = 182 + 82 * i;
    const limit = data.limits[i];
    const prior = data.totals[i];
    const projected = extendedRun.totals[i];
    const priorWidth = (limitWidth * prior) / limit;
    const projectedWidth = (limitWidth * projected) / limit;
    const value = settled ? projected : !readTotals ? '?' : pending ? `${prior} + …` : prior;
    const comparison = projecting
      ? `${prior} + ${projected - prior} ${projected > limit ? '>' : '≤'} ${limit}`
      : `${value} / ${limit}`;
    type(c, name, x, y, 17, { color: C.paper, weight: 700 });
    mono(c, comparison, x + w, y, 19, {
      align: 'right',
      color: C.paper,
    });
    const barY = y + 15;
    paint(c, x, barY, w, 18, '#244244', 2);
    if (readTotals) paint(c, x, barY, priorWidth, 18, '#83c1aa', 2);
    if (addedShare > 0) {
      const edge = lerp(priorWidth, projectedWidth, addedShare);
      paint(c, x + priorWidth, barY, edge - priorWidth, 18, C.brass);
      if (exceeded && !rewinding && edge > limitWidth)
        paint(c, limitX, barY, edge - limitWidth, 18, '#e99a79');
    }
    if (projecting) {
      c.save();
      c.setLineDash([6, 4]);
      paint(c, x + priorWidth, barY, projectedWidth - priorWidth, 18, '#ffffff00', 0, C.brass);
      c.restore();
    }
    line(c, limitX, barY - 5, limitX, barY + 23, C.cream, 2);
  });
  if (appended && !second) {
    type(
      c,
      projecting
        ? 'Solid = used    Outline = estimate'
        : exceeded && !rewinding
          ? `Amber = call ${nextIndex}    Coral = over limit`
          : `Amber = call ${nextIndex}`,
      477,
      400,
      15,
      { color: C.cream },
    );
  }
  if (second) {
    foot(c, equality ? 'Equality passes.' : 'Does landing exactly on all three limits pass?');
  } else if (projecting && !extendedRun.ok) {
    foot(c, `Block call ${nextIndex}. Recorded usage stays at ${baseRun.events.length} calls.`, C.red);
  } else if (rewinding) {
    foot(c, 'Back up to the dispatch decision.');
  } else if (exceeded) {
    foot(c, `Call ${nextIndex} already ran. The audit detects the overrun.`, C.red);
  } else if (appended) {
    foot(c, 'The shaded row adds to the earlier calls.');
  } else {
    foot(c, readTotals ? 'What if another call finishes?' : 'Add each column and count the calls.');
  }
}
