import {
  C,
  box,
  line,
  circle,
  poly,
  txt,
  para,
  small,
  title,
  paper,
  key,
  browser,
  tab,
  cursor,
  thread,
  seal,
  source,
  mix,
  ease,
  cues,
  row,
} from './art.mjs';
import {
  CORPUS,
  run,
  graph,
  zero,
  zeroQuery,
  zeroCut,
  tieAnswer,
  sharedTerms,
  activeBundle,
  isCurrent,
  halfOpenCurrent,
} from './evidence.mjs';

export function outbox(c, k) {
  const { at, beat } = cues(k),
    opened = ease(at(1, 'Open that link', 0.8)),
    marked = at(1, 'Read the subject', 0.9);
  const held = at(2, 'Hold the draft'),
    search = at(3, 'Search for the current');
  const x = mix(332, 62, opened),
    y = 128;
  const zoom = mix(1.45, 1, opened);
  c.translate(600, 326);
  c.scale(zoom, zoom);
  c.translate(-600, -326);
  paper(c, x, y, 535, 383, C.white);
  small(c, 'OUTBOX   /   UNSENT', x + 32, y + 45, C.teal);
  line(c, x + 32, y + 64, x + 504, y + 64, C.rule);
  txt(c, 'To Luna', x + 32, y + 108, 30, C.ink, 'Serif');
  txt(c, 'You have 30 days', x + 32, y + 177, 48, C.ink, 'Serif');
  txt(c, 'to rotate a stale key.', x + 32, y + 228, 38, C.ink, 'Serif');
  tab(c, 'E1', x + 34, y + 285, C.blue);
  box(c, x + 365, y + 283, 136, 66, held ? C.red : C.teal, 7);
  txt(c, held ? 'Held' : 'Send', x + 433, y + 326, 28, C.white, 'Sans', 600, 'center');
  const sx = x + 574,
    sy = 107;
  if (opened > 0) {
    c.save();
    c.globalAlpha = opened;
    line(c, x + 85, y + 275, x + 510, y + 275, C.blue, 2);
    thread(c, x + 510, y + 275, sx + 8, sy + 145, C.gold);
    paper(c, sx, sy, 502, 426);
    box(c, sx, sy, 502, 10, C.blue);
    browser(c, sx + 47, sy + 61, 1.05);
    small(c, 'E1   /   EU SESSION POLICY', sx + 84, sy + 68, C.blue);
    txt(c, 'Idle timeout', sx + 30, sy + 131, 43, C.ink, 'Serif');
    line(c, sx + 30, sy + 159, sx + 470, sy + 159, C.rule);
    txt(c, 'Idle browser sessions', sx + 30, sy + 225, 40, C.ink, 'Serif');
    c.font = '500 40px "Lesson Serif"';
    const ww = c.measureText('Idle browser sessions').width;
    line(c, sx + 31, sy + 237, sx + 31 + ww * marked, sy + 237, C.blue, 4);
    txt(c, 'expire after 30 days', sx + 30, sy + 281, 36, C.ink, 'Serif');
    txt(c, 'of inactivity.', sx + 30, sy + 326, 36, C.ink, 'Serif');
    c.restore();
  }
  cursor(
    c,
    mix(x + 67, x + 459, at(1, 'Would you press', 0.7)),
    mix(y + 278, y + 320, at(1, 'Would you press', 0.7)),
  );
  if (search) {
    key(c, 118, 591, 1.15, C.gold);
    txt(c, 'Find the current EU key policy', 154, 601, 27, C.cream);
  }
}
export function paths(c, k) {
  const { at } = cues(k);
  source(c, 55, 89, 473, 449, 'key', '', { meta: 'Effective 01 Apr 2026   ·   support:eu' });
  if (!at(2, 'Background ingestion')) {
    const heading = at(1, 'Luna supplies two readings')
      ? 'Which limit does Luna reach?'
      : 'Limits for automatic rotation';
    title(c, heading, 591, 135, 36);

    // Both rulers use the recorded caption starts. Each marker waits for its sentence to finish.
    const readings = [
      {
        label: 'Time since the key went stale',
        unit: 'days',
        limit: 14,
        value: 10,
        showLimit: at(1, 'The page gives a key', 2),
        known: at(1, 'The key went stale', 1.675) === 1,
      },
      {
        label: 'Risk signal age',
        unit: 'hours',
        limit: 48,
        value: 48,
        showLimit: at(1, 'forty-eight hours old', 1.362),
        known: at(1, 'The signal arrived', 2.1) === 1,
      },
    ];
    const left = 600;
    const right = 1111;
    readings.forEach(({ label, unit, limit, value, showLimit, known }, i) => {
      const y = 262 + i * 172;
      txt(c, label, left, y - 52, 28, C.cream, 'Serif');
      if (showLimit > 0) {
        line(c, left, y, mix(left, right, ease(showLimit)), y, C.sky, 3);
        line(c, left, y - 6, left, y + 6, C.sky, 3);
        txt(c, '0', left, y + 37, 22, C.sky);
      }
      if (showLimit === 1) {
        line(c, right, y - 12, right, y + 12, C.sky, 4);
        txt(c, limit + ' ' + unit + ' max', right, y + 37, 25, C.sky, 'Sans', 500, 'right');
      }
      if (known) {
        const x = mix(left, right, value / limit);
        circle(c, x, y, 9, C.gold);
        txt(c, value + ' ' + unit, x, y - 17, 31, C.gold, 'Sans', 600, 'right');
      }
    });
    return;
  }
  const stage = at(3, 'replay a frozen question') ? 2 : at(2, 'When Luna asks') ? 1 : 0;
  small(c, 'LUNA’S READINGS', 66, 582, C.sky);
  txt(c, '10 days stale   /   48-hour signal', 66, 624, 29, C.cream, 'Serif');
  const paths = [
    ['Ingest revision', 'Source page', 'Index A'],
    ['Answer Luna', 'Allowed hits', 'Reply'],
    ['Replay frozen case', 'Same request', 'Expected E1'],
  ];
  paths.forEach(([name, a, b], i) => {
    const y = 108 + i * 158,
      active = stage === i,
      color = active ? C.mint : C.sky;
    txt(c, name, 620, y + 4, 31, color, 'Serif');
    line(c, 630, y + 56, 1100, y + 56, active ? C.teal : '#415761', 7);
    circle(c, 630, y + 56, 10, color);
    circle(c, 1100, y + 56, 10, color);
    small(c, a, 618, y + 100, color);
    txt(c, b, 1115, y + 100, 18, color, 'Mono', 500, 'right');
    if (active) {
      const t = [
        at(2, 'builds a searchable index', 1),
        at(2, 'sends enough evidence', 1),
        at(3, 'Hold the expected source', 1),
      ][i];
      const x = mix(650, 1080, ease(t));
      paper(c, x - 21, y + 31, 42, 43);
      key(c, x, y + 52, 0.65);
    }
  });
}
export function provenance(c, k) {
  const { at } = cues(k),
    dated = at(3, 'May twenty-seventh'),
    metadata = at(1, 'preserve the document');
  const rec = CORPUS[0];
  title(c, 'A searchable span keeps its address');
  paper(c, 64, 123, 490, 429);
  key(c, 109, 172, 1.1);
  txt(c, 'EU Access Policy', 151, 184, 34, C.ink, 'Serif');
  para(c, rec.text, 94, 253, 424, 28);
  line(c, 95, 421, 507, 421, C.rule);
  small(c, rec.locator, 95, 450, C.red, 16);
  small(c, rec.version, 95, 501);
  thread(c, 544, 325, 620, 218, C.gold);
  paper(c, 619, 111, 514, 282);
  small(c, rec.id, 649, 153, C.red);
  if (metadata) {
    row(c, 649, 201, 450, 'Document', rec.documentId);
    row(c, 649, 244, 450, 'Parent', rec.parentId);
    row(c, 649, 287, 450, 'Scope', rec.region + '  /  ' + rec.acl);
    row(c, 649, 330, 450, 'Effective from', rec.from);
  }
  if (at(2, 'older thirty-day rule')) {
    paper(c, 618, 424, 515, 119, '#e0d6bf');
    small(c, 'eu-key-v1   /   ends 31 Mar 2026', 643, 462);
    txt(c, 'Manual rotation within 30 days', 643, 509, 26, C.ink, 'Serif');
  }
  if (dated) {
    seal(c, 'CURRENT', 78, 603, C.mint);
    txt(c, '27 May 2026', 619, 598, 25, C.cream);
    small(c, 'v1 stays in storage', 826, 598, C.sky);
  }
}
export function validity(c, k) {
  const { beat, at } = cues(k);
  if (beat <= 2) {
    title(c, 'Effective dates in the policy register');
    const days = ['30 Mar', '31 Mar', '01 Apr', '02 Apr'];
    days.forEach((d, i) => {
      const x = 65 + i * 268;
      paper(c, x, 166, 248, 232, i < 2 ? C.paper : '#def0d8');
      box(c, x, 166, 248, 43, i < 2 ? C.blue : C.teal);
      small(c, '2026', x + 20, 195, C.white);
      txt(c, d, x + 24, 285, 49, C.ink, 'Serif');
      txt(c, i < 2 ? 'EU revision 1' : 'EU revision 2', x + 22, 359, 23);
    });
    if (at(1, 'inclusive calendar dates')) {
      line(c, 66, 418, 577, 418, C.sky, 4);
      line(c, 601, 418, 1115, 418, C.mint, 4);
    }
    const rule =
      beat === 2
        ? 'Scope separately by document, region and variant.'
        : 'Reject duplicate chunk IDs, reversed ranges and overlapping revisions.';
    if (at(1, 'rejects duplicate')) para(c, rule, 73, 511, 1010, 27, C.cream, 'Sans');
  } else if (beat <= 4) {
    title(c, 'Logical time');
    const start = 150,
      dx = 53,
      axis = (t) => start + (t - 4) * dx;
    for (const [j, [a, b]] of [
      [4, 12],
      [12, 20],
    ].entries()) {
      const y = 246 + j * 119;
      small(c, j === 0 ? 'OLD' : 'NEW', 65, y + 6, C.sky);
      line(c, axis(a), y, axis(b), y, j ? C.mint : C.gold, 8);
      circle(c, axis(a), y, 11, j ? C.mint : C.gold);
      circle(c, axis(b), y, 12, j ? C.mint : C.gold);
      circle(c, axis(b), y, 7, C.night);
    }
    for (const t of [4, 12, 20]) txt(c, t, axis(t), 457, 32, C.cream, 'Mono', 500, 'center');
    if (at(3, 'At exactly twelve')) {
      line(c, axis(12), 156, axis(12), 402, C.cream, 1.5);
      tab(c, 't = 12', axis(12) - 45, 145);
    }
    if (at(4, 'The replacement'))
      seal(
        c,
        halfOpenCurrent({ start: 12, end: 20 }, 12) ? 'REPLACEMENT' : 'OLD',
        470,
        535,
        C.mint,
      );
  } else {
    title(c, 'One revision, two clocks');
    paper(c, 84, 133, 1030, 427);
    row(c, 127, 206, 936, 'Policy takes effect', '01 Apr');
    row(c, 127, 267, 936, 'Update reaches index', '03 Apr');
    if (at(5, 'authorization revision')) {
      row(c, 127, 349, 936, 'Content revision', 'eu-access / 2026-04-01');
      row(c, 127, 410, 936, 'Grant revision', '12 → 13');
    }
    if (at(5, 'Malformed required scope')) seal(c, 'HOLD RECORD WITH MISSING SCOPE', 126, 506);
  }
}
export function filter(c, k) {
  const { at } = cues(k),
    scored = at(2, 'ranks permitted text');
  title(c, 'Luna’s search lane');
  small(c, '27 MAY 2026     /     EU     /     support:eu', 59, 120, C.mint);
  const names = [
    'Key policy v2',
    'Previous key policy',
    'US key policy',
    'Idle sessions',
    'Admin policy',
  ];
  const reasons = ['admitted', 'expired', 'US region', 'admitted', 'admin grant'];
  const allowed = run.candidates.map((h) => h.record.id);
  CORPUS.forEach((r, i) => {
    const y = 173 + 77 * i,
      ok = allowed.includes(r.id),
      pass = at(1, 'form its allowed evidence set', 0.8);
    paper(c, 65, y, 351, 53);
    (i === 3 ? browser : key)(c, 96, y + 26, 0.58, ok ? C.teal : C.dim);
    txt(c, names[i], 125, y + 36, 23);
    line(c, 419, y + 28, 620, y + 28, C.sky, 2);
    if (pass) {
      txt(c, reasons[i], 451, y + 18, 17, ok ? C.mint : C.coral);
      if (ok) {
        line(c, 621, y + 28, 786, y + 28, C.mint, 3);
        tab(c, r.id, 793, y + 31);
      } else {
        line(c, 617, y + 15, 617, y + 40, C.coral, 5);
      }
    }
    if (ok && scored) {
      const hit = run.candidates.find((h) => h.record.id === r.id);
      txt(c, hit.score + ' terms', 1108, y + 35, 21, C.gold, 'Mono', 600, 'right');
    }
  });
}
export function scopedGraph(c, k) {
  const { beat, at } = cues(k);
  if (beat === 1) {
    title(c, 'Inside trusted vector search');
    box(c, 80, 148, 850, 345, '#2e4a53', 24);
    const points = [
        [178, 323],
        [448, 234],
        [743, 333],
      ],
      names = ['query', 'restricted ID', 'permitted ID'];
    points.forEach(([x, y], i) => {
      if (i > 0) line(c, ...points[i - 1], x, y, C.sky, 4);
    });
    points.forEach(([x, y], i) => {
      circle(c, x, y, 46, i === 1 ? C.red : C.teal);
      txt(c, ['Q', 'R1', 'P1'][i], x, y + 10, 27, C.cream, 'Mono', 600, 'center');
      txt(c, names[i], x, y + 86, 21, C.cream, 'Sans', 500, 'center');
    });
    if (at(1, 'permitted neighbor')) {
      thread(c, 789, 333, 967, 333);
      tab(c, 'P1', 980, 339);
    }
    small(c, 'Service checks which payload can leave', 93, 548, C.sky);
    return;
  }
  if (at(3, 'If none qualify')) {
    title(c, 'Outside the search service');
    paper(c, 142, 152, 914, 362);
    small(c, 'EXTERNAL RERANKER    /    INPUT', 185, 207);
    txt(c, '[ ]', 187, 352, 89, C.teal, 'Mono');
    txt(c, '0 permitted passages', 185, 443, 31, C.ink, 'Serif');
    return;
  }
  const global = at(2, 'Take the first three'),
    redact = at(2, 'Remove those two'),
    local = at(2, 'three nearest permitted');
  title(c, beat === 2 ? 'Cut the ranked list' : 'The payload boundary');
  small(c, 'DISTANCE', 75, 141, C.sky);
  small(c, 'GLOBAL TOP 3', 535, 141, C.sky);
  small(c, 'PERMITTED TOP 3', 861, 141, C.sky);
  graph.records.forEach((r, i) => {
    const y = 173 + i * 74;
    paper(c, 70, y, 382, 54, r.allowed ? '#dcebd5' : '#e5cfbc');
    txt(c, r.id, 90, y + 36, 24, C.ink, 'Mono', 600);
    txt(c, r.distance.toFixed(1), 178, y + 36, 23);
    txt(c, r.allowed ? 'permitted' : 'restricted', 263, y + 36, 22);
    if (global && i < 3) {
      if (redact && !r.allowed) {
        line(c, 544, y + 29, 654, y + 29, C.coral, 3);
        small(c, 'removed', 665, y + 34, C.coral);
      } else tab(c, r.id, 552, y + 33, r.allowed ? C.teal : C.red);
    }
    if (local && r.allowed) tab(c, r.id, 902, y + 33);
  });
  if (beat === 3 && at(3, 'If none qualify'))
    small(c, 'No grants  →  [ ]   at the service boundary', 78, 594, C.mint, 20);
}
export function lexical(c, k) {
  const { beat, at } = cues(k),
    newQuery = at(2, 'Now ask'),
    showScore = !newQuery || at(3, 'Zero for both'),
    cut = at(4, 'requires two shared terms');
  title(c, 'Terms shared with the question');
  const query = newQuery ? zeroQuery : run.query;
  paper(c, 61, 105, 1078, 86);
  txt(c, query, 88, 161, 31, C.ink, 'Serif');
  const hits = newQuery ? zero : run.candidates;
  hits.forEach((h, i) => {
    const y = 238 + i * 151;
    (i ? browser : key)(c, 90, y + 1, 0.83, i ? C.sky : C.gold);
    txt(c, i ? 'Session rule' : 'Key rule', 123, y + 10, 29, C.cream, 'Serif');
    if (!newQuery) {
      let x = 315;
      sharedTerms(query, h.record.text).forEach((t) => {
        x += tab(c, t, x, y + 4, i ? C.blue : C.teal) + 8;
      });
    }
    if (showScore) txt(c, h.score, 1110, y + 19, 48, C.gold, 'Mono', 600, 'right');
    para(c, h.record.text, 82, y + 56, 1034, 26, C.cream);
    line(c, 74, y + 113, 1125, y + 113, '#667d7d', 1);
  });
  if (at(3, 'Ties go by chunk ID') && !cut) {
    txt(c, 'ID order    ' + hits.map((hit) => hit.record.id).join('   →   '), 81, 552, 26, C.mint);
    if (at(3, 'Supply ten days')) {
      const answer = at(3, 'answerer says eligible')
        ? '   →   ' + tieAnswer.decision + ' [' + tieAnswer.cited[0] + ']'
        : '';
      txt(c, '10-day key   ·   48-hour signal' + answer, 81, 601, 26, C.cream);
    }
  }
  if (cut)
    txt(c, 'Minimum 2 shared terms    →    ' + zeroCut.length + ' passages', 79, 548, 30, C.mint);
  if (beat === 5)
    small(c, 'Calibrate thresholds separately for each scoring model.', 81, 596, C.sky);
}
export function bundles(c, k) {
  const { at } = cues(k),
    swing = ease(at(4, 'Switch the serving pointer', 0.85)),
    both = at(2, 'build B');
  const selected = swing === 1 ? 'B' : 'A',
    owner = activeBundle('A', selected);
  title(c, 'The bundle Luna opened');
  const xs = [76, 676];
  xs.forEach((x, i) => {
    if (i && !both) return;
    const id = i ? 'B' : 'A',
      color = i ? C.blue : C.teal;
    box(c, x, 169, 443, 342, '#0e1f28', 8);
    box(c, x + 4, 163, 435, 340, color, 8);
    small(c, 'BUNDLE   /   ' + id, x + 20, 204, C.white);
    paper(c, x + 27, 224, 379, 83, C.white);
    small(c, 'CHILD INDEX   /   ' + id, x + 43, 248, color, 14);
    txt(c, '“automated rotation up to 14 days”', x + 43, 284, 22, C.ink, 'Serif');
    paper(c, x + 27, 324, 379, 109);
    key(c, x + 62, 361, 0.82, C.red);
    txt(c, 'Key rotation', x + 98, 372, 28, C.ink, 'Serif');
    small(c, 'PARENT STORE    /    rev ' + id, x + 43, 409, color, 15);
    small(c, 'Manifest ' + id + '    /    Retrieval settings ' + id, x + 24, 479, C.white, 14);
    if (id === owner.child) {
      line(c, x + 15, 269, x + 15, 376, C.gold, 4);
      line(c, x + 15, 269, x + 32, 269, C.gold, 4);
      line(c, x + 15, 376, x + 32, 376, C.gold, 4);
      circle(c, x + 32, 269, 5, C.gold);
      circle(c, x + 32, 376, 5, C.gold);
    }
  });
  small(c, 'Serving pointer', 480, 112, C.sky);
  const px = mix(303, 898, swing);
  line(c, 595, 126, px, 150, C.gold, 4);
  circle(c, 595, 126, 8, C.gold);
  poly(
    c,
    [
      [px - 8, 146],
      [px + 9, 146],
      [px, 160],
    ],
    C.gold,
  );
  thread(c, 95, 548, 90, 375, C.gold);
  tab(c, 'Luna   /   pinned ' + owner.parent, 95, 577);
  if (both && swing === 0) {
    const ready = at(3, 'Validate the parent store');
    txt(
      c,
      ready
        ? 'Shadow replay checked'
        : at(3, 'catch up')
          ? 'Applying source changes'
          : at(3, 'Replay versioned')
            ? 'Replaying source spans'
            : 'Candidate build',
      699,
      578,
      24,
      C.sky,
      'Serif',
    );
  }
  if (swing === 1) tab(c, 'Next request   /   ' + owner.next, 711, 577, C.blue);
  if (at(5, 'Check A against current permissions'))
    small(c, 'Recheck grant and effective date', 95, 632, C.mint);
}
