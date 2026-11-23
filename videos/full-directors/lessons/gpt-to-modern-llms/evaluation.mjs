import { at, clamp, lerp } from './ink.mjs';
import {
  cases,
  checkReply,
  chooseRun,
  compareClocks,
  effortDeadline,
  effortTrials,
  expertInputs,
  expiryExample,
  fits,
  largerWorker,
  live,
  mixtral,
  overnight,
  referenceLabel,
  routeExperts,
  runs,
  shards,
  sweep,
} from './examples.mjs';

export function experts(p, k) {
  const b = k.beat.beatIndex;
  p.header(
    'Sparse feed-forward layers',
    b < 3 ? 'Which experts work on this token?' : 'Which weights must fit on the card?',
  );
  if (b < 3) {
    const input = expertInputs[Number(b >= 1)];
    const route = routeExperts(input.logits);
    const routed =
      b === 0 ? at(k, 0, 'Follow the two largest', 1.2) : at(k, 2, 'Expert one takes over', 1.2);
    p.label('TOKEN', 68, 254);
    p.serif(input.token, 68, 324, 42);
    p.label('ROUTER SCORES', 372, 185);
    p.label('EXPERT BANK', 661, 185);
    p.label('MIX SHARE', 992, 185);
    input.logits.forEach((score, i) => {
      const y = 247 + i * 91;
      const selected = route.find((r) => r.id === i),
        color = selected && routed ? p.sea : p.sub;
      p.path(
        [
          [252, 339],
          [302, 339],
          [360, y],
        ],
        p.rule,
        1.5,
      );
      p.mono(score.toFixed(1), 389, y + 9, 25, p.ink);
      p.line(465, y, 634, y, p.rule, 1);
      if (selected && routed) p.arrow(465, y, lerp(465, 638, routed), y, p.sea, 4, 12);
      p.box(652, y - 27, 235, 54, selected && routed ? p.faint : p.sheet, color, 1.5);
      for (let j = 0; j < 4; j++) p.line(661 + j * 5, y - 18, 661 + j * 5, y + 18, color, 1.5);
      p.mono('Expert ' + i, 712, y + 9, 23, color);
      if (selected && routed === 1) {
        p.arrow(897, y, 975, y, p.sea, 2, 10);
        p.mono((100 * selected.share).toFixed(1) + '%', 1001, y + 9, 26, p.sea);
      }
    });
    p.type(
      b === 1
        ? 'Pick the two highest scores.'
        : 'Normalize the selected scores to mix the two expert outputs.',
      68,
      600,
      23,
      p.sub,
    );
  } else {
    const active = mixtral.active * mixtral.bytes,
      total = mixtral.total * mixtral.bytes;
    const x = 70,
      scale = 10.4;
    p.label('MIXTRAL 8×7B  /  ROUNDED WEIGHTS', 68, 192);
    p.serif('47B total', 68, 246, 39);
    p.serif('13B active per token', 493, 246, 39, p.sea);
    if (b === 6) {
      const payload = total / shards;
      p.label('IDEAL EVEN WEIGHT SHARDING', 68, 310);
      for (let i = 0; i < shards; i++) {
        const px = 69 + i * 273,
          unit = 7.3;
        p.box(px, 346, mixtral.capacity * unit, 67, p.sheet, p.rule, 2);
        p.box(px, 346, payload * unit, 67, p.sea);
        p.mono(payload + ' GB', px + 14, 389, 24, p.white);
        p.mono('Card ' + (i + 1) + ' / 32 GB', px, 451, 18);
      }
      p.type('Check remaining space for cache and work buffers on each card.', 69, 518, 23, p.sub);
      if (at(k, 6, 'Downloadable weights', 0.5) > 0)
        p.type('Verify the checkpoint license, code license and runtime revision.', 69, 577, 23);
      return;
    }
    const y = 347;
    const full = at(k, 5, 'The other experts', 1.3);
    const length = lerp(active, total, full) * scale;
    p.box(x, y, Math.max(length, mixtral.capacity * scale), 91, p.sheet, p.rule, 2);
    p.box(x, y, length, 91, p.faint);
    for (let j = 2; j < length / scale; j += 2)
      p.line(x + j * scale, y + 1, x + j * scale, y + 90, p.rule, 0.65);
    p.box(x, y, active * scale, 91, p.sea);
    const edge = x + mixtral.capacity * scale;
    p.line(edge, 296, edge, 465, p.red, 3);
    p.mono('32 GB card', edge + 9, 311, 19, p.red);
    if (b >= 4) p.mono(active + ' GB active', x + 15, y + 54, 24, p.white);
    if (full === 1) p.mono(total + ' GB resident', x + total * scale, y + 133, 27, p.ink, 'right');
    p.type('2 bytes per weight · fully resident checkpoint', 70, 548, 22, p.sub);
  }
}

function clockComparison(p, k) {
  const { host, expiry, trusted } = expiryExample;
  const showHost = at(k, 0, 'If the trusted clock', 0) === 1;
  const firstReference = at(k, 0, 'the clocks agree', 0) === 1;
  const replay = at(k, 0, 'Now suppose', 0) === 1;
  const newReference = at(k, 0, 'at that same instant', 0) === 1;
  const showReference = replay ? newReference : firstReference;
  const reference = replay ? trusted : host;
  const result = compareClocks(host, reference, expiry);
  const x = (minute) => 726 + (minute - expiry) * 63;
  const time = (minute) => Math.floor(minute / 60) + ':' + String(minute % 60).padStart(2, '0');
  p.label('HYPOTHETICAL READINGS AT FAILURE  /  SAME INSTANT, UTC', 64, 184);
  p.line(x(expiry), 240, x(expiry), 481, p.red, 2);
  p.mono('Fixture expires', x(expiry), 225, 20, p.red, 'center');
  for (const [y, title, minute, visible, color] of [
    [313, 'Host clock', host, showHost, p.gold],
    [420, 'Trusted clock', reference, showReference, p.sea],
  ]) {
    p.serif(title, 64, y + 8, 32);
    p.line(x(trusted - 1), y, x(host + 1), y, p.rule, 1.5);
    if (visible) {
      p.dot(x(minute), y, 9, color, p.sheet, 2);
      p.mono(time(minute), x(minute), y - 18, 22, color, 'center');
    }
  }
  for (const minute of [trusted, expiry, host]) {
    p.line(x(minute), 469, x(minute), 481, p.ink);
    p.mono(time(minute), x(minute), 508, 20, p.sub, 'center');
  }
  if (showReference && !replay && at(k, 0, 'The fixture expired five', 0) === 1)
    p.mono('Host offset   ' + result.offset + ' min', 65, 571, 26, p.gold);
  if (showReference && replay && at(k, 0, 'The fixture still had', 0) === 1)
    p.mono('Host offset  +' + result.offset + ' min', 65, 571, 26, p.gold);
  if (result.early && at(k, 0, 'That offset would explain', 0) === 1)
    p.type(result.remaining + ' minutes remained before expiry at the trusted time.', 550, 571, 23, p.sea);
}

export function evidence(p, k) {
  const b = k.beat.beatIndex;
  p.header(
    'RUN-842  /  evidence use',
    b === 0
      ? 'What could establish clock skew?'
      : b === 1
        ? 'Is the extra reasoning time worth it?'
        : 'Does the answer depend on where the log sits?',
  );
  if (b === 0) {
    if (at(k, 0, 'Suppose the fixture expires', 0) === 1) return clockComparison(p, k);
    p.box(61, 194, 715, 288, p.sheet, p.rule, 2);
    p.label('CI LOG', 82, 234);
    p.line(82, 254, 750, 254, p.rule);
    p.mono('40  Running auth_fixture_test', 82, 303, 22, p.sub);
    p.box(75, 328, 685, 59, p.faint);
    p.mono('41  FAIL: expired auth fixture', 82, 366, 24, p.sea);
    p.mono('42  Test run stopped', 82, 435, 22, p.sub);
    p.label('MISSING AT THE FAILURE', 808, 281, p.red);
    p.type('Host clock reading', 808, 338, 24);
    p.type('Trusted clock reading', 808, 388, 24);
    p.type('Both from the same instant', 808, 438, 19, p.sub);
  } else if (b === 1) {
    p.label('ILLUSTRATIVE TRIAL  /  SAME 20 QUESTIONS', 63, 194);
    const cols = [64, 347, 634, 932];
    ['EFFORT', 'SUPPORTED', 'p95 TIME', 'TOTAL COST'].forEach((v, i) => p.label(v, cols[i], 254));
    effortTrials.forEach((trial, i) => {
      const y = 327 + i * 101;
      p.line(64, y + 25, 1136, y + 25, p.rule);
      p.serif(trial.setting, cols[0], y, 34);
      p.mono(trial.supported + ' / ' + cases, cols[1], y, 29, p.sea);
      p.mono(trial.ms.toLocaleString('en-US') + ' ms', cols[2], y, 26, p.ink);
      p.mono('$' + trial.cost.toFixed(2), cols[3], y, 27);
    });
    p.mono('Deadline   ' + effortDeadline.toLocaleString('en-US') + ' ms', 64, 525, 24, p.gold);
    if (at(k, 1, 'Increase effort when', 0) === 1)
      p.serif('Only low effort meets this deadline.', 64, 588, 33, p.sea);
  } else {
    const answer = at(k, 4, 'Fifteen answers', 0.7);
    const reveal = [
      answer,
      at(k, 4, 'Seven have support', 0.7),
      at(k, 4, 'Fourteen have support', 0.7),
    ];
    p.label('LOCATION OF THE SAME EVIDENCE IN 20 DOCUMENTS', 57, 198);
    p.label('SUPPORTED / 20', 946, 198);
    const reached = [
      at(k, 2, 'Put the evidence first', 0.8),
      at(k, 2, 'In a matched copy', 0.8),
      at(k, 2, 'In a third', 0.8),
    ];
    sweep.forEach(({ slot, hits }, i) => {
      const y = 241 + 100 * i,
        x = 192,
        dx = 35;
      p.mono('Slot ' + slot, 58, y + 34, 22);
      for (let j = 0; j < 20; j++) {
        const active = j + 1 === slot && reached[i] > 0;
        p.box(x + j * dx, y, dx - 5, 50, active ? p.gold : p.sheet, active ? p.gold : p.rule);
        if (active) p.mono('41', x + j * dx + 15, y + 32, 14, p.white, 'center');
        else {
          p.line(x + j * dx + 6, y + 14, x + j * dx + 23, y + 14, p.rule, 1);
          p.line(x + j * dx + 6, y + 21, x + j * dx + 19, y + 21, p.rule, 1);
        }
      }
      if (reveal[i] === 1) p.mono(hits + ' / ' + cases, 946, y + 38, 30, i === 1 ? p.red : p.sea);
    });
    const retest = at(k, 5, 'putting the decisive excerpt', 1.2);
    if (retest > 0) {
      p.box(58, 501, 438, 32, p.faint, p.rule);
      p.mono('Evidence   •   line 41', 76, 524, 20);
      p.arrow(515, 517, 585, 517, p.gold, 3);
      p.mono('Question   •   Explain the failure.', 609, 524, 20);
    } else if (reveal[2] === 1) {
      p.mono(
        sweep[0].hits +
          ' − ' +
          sweep[1].hits +
          ' = ' +
          (sweep[0].hits - sweep[1].hits) +
          ' fewer supported answers in the middle',
        59,
        519,
        23,
        p.red,
      );
    } else p.type('Matched prompts · same question, contents and total length', 59, 161, 23, p.sub);
  }
}

function scoreStamp(p, k) {
  const b = k.beat.beatIndex;
  const reply = 'Bug',
    checked = checkReply(reply);
  p.label('REVIEW NOTE', 63, 204);
  p.serif('The guide names an old button.', 62, 273, 41);
  p.line(63, 310, 1127, 310, p.rule);
  p.label('WHOLE REPLY', 64, 363);
  p.label('ALLOWED FOLDER?', 418, 363);
  p.label('REFERENCE LABEL', 825, 363);
  p.mono(reply, 65, 439, 47);
  p.mono(checked.allowed ? 'YES' : 'NO', 418, 439, 46, p.sea);
  p.mono(referenceLabel, 825, 439, 47, p.ink);
  if (b > 0 && at(k, 1, 'Use the whole reply', 0.5) > 0) {
    p.box(63, 497, 1065, 78, p.faint);
    p.mono('Correct labels   +' + Number(checked.correct), 84, 548, 29, p.red);
    p.type('The format fits. The category differs.', 583, 547, 22);
  } else p.serif('How many correct labels does this add?', 64, 553, 31, p.gold);
}

export function deployment(p, k) {
  const b = k.beat.beatIndex;
  p.header(
    'Review queue  /  held-out notes',
    b < 2 ? 'Does a valid folder name earn a point?' : 'Of the runs that fit, which gets the most labels right?',
  );
  if (b < 2) return scoreStamp(p, k);
  const night = at(k, 4, 'nightly queue allows', 1.4);
  const wide = at(k, 6, 'give the worker', 1.4);
  const limits = {
    p95: lerp(live.p95, overnight.p95, night),
    gb: lerp(overnight.gb, largerWorker.gb, wide),
  };
  const left = 114,
    base = 494,
    x = (gb) => left + gb * 30,
    y = (ms) => base - ms * 0.167;
  const edge = x(limits.gb),
    top = y(limits.p95);
  p.label('COMPLETE RESPONSE, p95 (ms)', 58, 182);
  p.label('Total worker memory (GB)', x(20), 182, p.sub, 'right');

  p.box(left, top, edge - left, base - top, '#d5e5cd');
  for (const ms of [0, 600, 750, 1200, 1500]) {
    p.line(left, y(ms), x(20), y(ms), p.rule, 0.8);
    p.mono(ms, left - 12, y(ms) + 6, 15, p.sub, 'right');
  }
  for (const gb of [0, 4, 8, 12, 16, 20]) {
    p.line(x(gb), y(1650), x(gb), base, p.rule, 0.8);
    p.mono(gb, x(gb), base + 25, 16, p.sub, 'center');
  }
  p.line(left, top, edge, top, p.gold, 3.5);
  p.line(edge, top, edge, base, p.gold, 3.5);
  p.line(left, y(1650), left, base, p.ink, 1.5);
  p.line(left, base, x(20), base, p.ink, 1.5);
  p.label('MEASURED ON 100 NOTES', 782, 182);
  runs.forEach((run, i) => {
    const px = x(run.gb),
      py = y(run.p95);
    p.dot(px, py, 8, p.ink, p.bg, 2);
    p.mono(run.id, px + 14, py - 11, 23, p.ink);
    const ry = 222 + 142 * i;
    p.serif('Run ' + run.id, 782, ry, 30);
    p.mono(run.verified + ' correct', 1129, ry, 20, p.ink, 'right');
    p.mono(run.gb + ' GB    ' + run.p95.toLocaleString('en-US') + ' ms', 783, ry + 37, 19, p.sub);
    for (let j = 0; j < 100; j++) {
      const color = j >= run.verified ? p.faint : i && j >= runs[0].verified ? p.gold : p.sea;
      p.box(784 + (j % 50) * 6.8, ry + 57 + Math.floor(j / 50) * 12, 5.4, 10, color);
    }
  });
  const answered =
    (b === 3 && at(k, 3, 'Its six hundred', 0.2) > 0) ||
    (b === 5 && at(k, 5, 'B now meets', 0.2) > 0) ||
    (b === 7 && at(k, 7, 'At sixteen gigabytes', 0.3) > 0);
  const name = night > 0 ? 'Nightly' : 'Live';
  const stable = (night === 0 || night === 1) && (wide === 0 || wide === 1);
  const limitText = stable
    ? name + ' limits   ' + limits.p95.toLocaleString('en-US') + ' ms  /  ' + limits.gb + ' GB'
    : wide > 0
      ? 'Widen the worker  ·  keep the 1,500 ms deadline'
      : 'Raise the deadline  ·  keep the 12 GB worker';
  p.type(limitText, 62, 156, 22, p.gold);
  if (answered) {
    const winner = chooseRun(limits);
    p.serif('Choose ' + winner.id, 782, 482, 39, p.sea);
    const ok = fits(runs[1], limits);
    p.type(
      ok
        ? 'Both fit. B gets 4 more right.'
        : night
          ? 'B exceeds the memory limit.'
          : 'B exceeds both limits.',
      782,
      515,
      20,
      p.ink,
    );
  }
}
