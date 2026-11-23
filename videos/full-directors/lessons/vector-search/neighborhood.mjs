import {
  P,
  text,
  line,
  rect,
  circle,
  polygon,
  title,
  footer,
  chip,
  row,
  pair,
  caption,
  heading,
  clip,
  cue,
  on,
  lerp,
} from './plates.mjs';
import {
  POINTS,
  QUERY,
  CENTROIDS,
  pt,
  ids,
  d2,
  exact,
  partition,
  seam,
  filing,
  eligible,
  recall,
  distance,
} from './examples.mjs';

export function field(
  c,
  {
    q = QUERY,
    x = 32,
    y = 115,
    w = 509,
    h = 306,
    scale = 132,
    center = QUERY,
    division = 0,
    centers = false,
    shown = POINTS,
    segments = [],
    rim = null,
    sweep = 1,
    marked = [],
    qMark = true,
    legs = false,
    compass = false,
    rightCover = 0,
  } = {},
) {
  const X = (p) => x + w * 0.5 + (p.x - center.x) * scale,
    Y = (p) => y + h * 0.5 - (p.y - center.y) * scale;
  const sx = X({ x: seam }),
    qx = X(q),
    qy = Y(q);
  clip(c, x, y, w, h, () => {
    rect(c, x, y, w, h, '#e9ede5');
    if (division) {
      c.save();
      c.globalAlpha = division;
      rect(c, x, y, Math.max(0, Math.min(sx - x, w)), h, P.lagoon);
      rect(c, Math.max(x, sx), y, Math.max(0, x + w - Math.max(x, sx)), h, P.blush);
      c.restore();
    }
    const mesh = scale < 60 ? 1 : 0.25;
    for (let n = Math.floor((center.x - w / scale) / mesh); n * mesh < center.x + w / scale; n++) {
      const px = X({ x: n * mesh });
      line(c, px, y, px, y + h, '#c9d3cd', 0.6);
    }
    for (let n = Math.floor((center.y - h / scale) / mesh); n * mesh < center.y + h / scale; n++) {
      const py = Y({ y: n * mesh });
      line(c, x, py, x + w, py, '#c9d3cd', 0.6);
    }
    if (rightCover > 0)
      clip(c, sx, y, (x + w - sx) * rightCover, h, () => {
        for (let u = sx - h; u < x + w; u += 13) line(c, u, y, u + h, y + h, '#bfa9af', 1.2);
      });
    if (rim && (sweep > 0 || compass)) {
      const r = Math.sqrt(distance(q, pt(rim))) * scale,
        a = Math.atan2(Y(pt(rim)) - qy, X(pt(rim)) - qx);
      c.beginPath();
      c.moveTo(qx, qy);
      c.arc(qx, qy, r, a, a + sweep * Math.PI * 2);
      c.closePath();
      c.fillStyle = '#d7ad422c';
      c.fill();
      c.beginPath();
      c.arc(qx, qy, r, a, a + sweep * Math.PI * 2);
      c.strokeStyle = P.rust;
      c.lineWidth = 2;
      c.stroke();
      const end = [
        qx + r * Math.cos(a + sweep * 2 * Math.PI),
        qy + r * Math.sin(a + sweep * 2 * Math.PI),
      ];
      line(c, qx, qy, ...end, P.rust, 2);
      if (compass && sweep < 1) {
        const hinge = [(qx + end[0]) / 2, (qy + end[1]) / 2 - 38];
        c.save();
        c.globalAlpha = Math.min(1, (1 - sweep) * 9);
        for (const tip of [[qx, qy], end]) {
          line(c, ...hinge, ...tip, P.ink, 7);
          line(c, ...hinge, ...tip, '#b9c5bd', 3);
        }
        circle(c, ...hinge, 7, P.gold, P.ink, 2);
        circle(c, ...hinge, 2, P.ink);
        c.restore();
      }
    }
    if (division) {
      c.save();
      c.globalAlpha = division;
      line(c, sx, y, sx, y + h, P.ink, 1.6, [7, 4]);
      c.restore();
    }
    for (const [a, b, pct, col] of segments) {
      const a0 = a === 'Q' ? q : typeof a === 'string' ? pt(a) : a,
        b0 = b === 'Q' ? q : typeof b === 'string' ? pt(b) : b;
      line(c, X(a0), Y(a0), lerp(X(a0), X(b0), pct), lerp(Y(a0), Y(b0), pct), col || P.sea, 2.7);
    }
    if (legs) {
      const a = pt('A');
      line(c, qx, qy, X(a), qy, P.berry, 2);
      line(c, X(a), qy, X(a), Y(a), P.berry, 2);
    }
    if (centers)
      CENTROIDS.forEach((v, i) => {
        const u = X(v),
          z = Y(v);
        circle(c, u, z, 6, P.paper, P.ink);
        line(c, u - 10, z, u + 10, z, P.ink);
        line(c, u, z - 10, u, z + 10, P.ink);
        text(c, i ? 'R' : 'L', u, z + 19, 14, P.ink, 'center', 'Mono');
      });
    for (const p of shown) {
      const u = X(p),
        v = Y(p),
        color = division ? (partition(p) ? P.berry : P.sea) : P.ink;
      if (scale >= 80) {
        if (marked.includes(p.id)) circle(c, u, v, 15, null, P.rust, 2);
        chip(c, p.id, u, v, color, 11);
      } else {
        const offs = {
          A: [-18, -29],
          B: [15, 23],
          C: [-23, 17],
          D: [18, -20],
          E: [14, -17],
          F: [-11, 21],
        };
        const [dx, dy] = offs[p.id] ?? [18, 18];
        circle(c, u, v, 4, marked.includes(p.id) ? P.rust : color);
        line(c, u, v, u + dx * 0.72, v + dy * 0.72, P.dim, 0.9);
        text(c, p.id, u + dx, v + dy, 15, color, 'center', 'Mono', 600);
      }
    }
    if (qMark)
      polygon(
        c,
        [
          [qx, qy - 6],
          [qx + 6, qy],
          [qx, qy + 6],
          [qx - 6, qy],
        ],
        P.gold,
        P.ink,
      );
  });
  rect(c, x, y, w, h, null, P.dim);
}
function listRows(c, d, top, opening) {
  const colors = [P.sea, P.berry];
  [0, 1].forEach((list, i) => {
    const y = top + i * 115,
      isRead = d.opened.includes(list);
    rect(c, 567, y, 358, 94, isRead ? (i ? P.blush : P.lagoon) : P.white);
    text(
      c,
      (i ? 'Right' : 'Left') + ' posting list',
      581,
      y + 15,
      16,
      colors[i],
      'left',
      'Sans',
      600,
    );
    const status = isRead
      ? 'read'
      : opening === 1
        ? 'awaiting scan'
        : opening > 0
          ? 'opening'
          : 'closed';
    text(c, status, 908, y + 15, 13, P.dim, 'right', 'Mono');
    POINTS.filter((p) => partition(p) === list).forEach((p, j) => {
      const x = 617 + j * 111;
      chip(c, p.id, x, y + 45, colors[i], 11);
      text(c, isRead ? d2(p) : '···', x, y + 75, 17, isRead ? P.ink : P.dim, 'center', 'Mono');
    });
  });
}
export function opening(c, k) {
  const b = k.beat.beatIndex + 1;
  title(c, '“How do I undo the checkout deployment?”', 'Rollback request');
  const sweep = cue(k, 1, 'Follow the compass', 2.8);
  const seamP = cue(k, 3, 'Now lift the cover', 1);
  field(c, {
    x: 32,
    y: 111,
    w: 576,
    h: 318,
    scale: 136,
    division: seamP,
    rim: 'C',
    sweep,
    compass: true,
    rightCover: seamP,
    marked: on(k, 3, 'Now lift the cover') ? ['B'] : [],
  });
  pair(c, filing(1).answer, 651, 220, 'Search returned');
  polygon(
    c,
    [
      [658, 292],
      [665, 299],
      [658, 306],
      [651, 299],
    ],
    P.gold,
    P.ink,
  );
  text(c, 'rollback query', 678, 299, 17);
  if (seamP) {
    row(c, 651, 348, 'B belongs to', 'right list', 266, P.berry);
    row(c, 651, 395, 'B scored?', 'no', 266, P.berry);
  }
  footer(
    c,
    b === 1
      ? 'Each letter locates a stored passage.'
      : seamP
        ? 'Only passages in the left list competed for the two slots.'
        : 'Which passage inside C’s radius is missing from the result?',
  );
}
export function exhaustive(c, k) {
  const b = k.beat.beatIndex + 1,
    showB = on(k, 1, 'C is over'),
    showC = on(k, 1, 'B wins'),
    showA = on(k, 2, 'just ahead');
  title(c, 'Which two passages are closest?', 'Exact search   /   squared Euclidean distance');
  field(c, {
    scale: 140,
    segments: [
      ['Q', 'B', cue(k, 1, 'B is three tenths', 1)],
      ['Q', 'C', cue(k, 1, 'C is over', 1)],
    ],
    legs: b >= 2,
  });
  heading(c, 'Squared distance to the query', 570, 128);
  const all = on(k, 3, 'Sort all six'),
    ordered = all ? exact(POINTS, 6) : [pt('B'), pt('C'), pt('A')];
  ordered.forEach((p, i) => {
    const visible = all || (p.id === 'A' ? showA : p.id === 'C' ? showC : showB);
    const leg = { A: '0.2² + 0.2²', B: '0.3² + 0²', C: '1.1² + 0.2²' };
    const y = 170 + i * 40;
    text(c, p.id, 575, y, 20, P.ink);
    text(c, leg[p.id] ?? '', 620, y, 16, P.dim, 'left', 'Mono');
    text(c, visible ? d2(p) : '?', 905, y, 20, P.sea, 'right', 'Mono');
    line(c, 570, y + 17, 920, y + 17, P.grid);
  });
  footer(
    c,
    b === 3 && on(k, 3, 'Those are')
      ? 'Exact top two    A and B. Read the passages to judge their usefulness.'
      : 'Square each coordinate difference and add. Smaller wins.',
  );
}
export function centers(c, k) {
  const b = k.beat.beatIndex + 1,
    placed = cue(k, 1, 'File each passage', 1.5),
    routing = on(k, 4, 'The left center is nearer'),
    border = b >= 3;
  title(c, 'Which center owns each passage?', 'Inverted file index   /   list addresses');
  field(c, {
    scale: border && b === 3 ? 143 : 41,
    division: placed,
    centers: true,
    segments: POINTS.map((p) => [
      p,
      CENTROIDS[partition(p)],
      placed,
      partition(p) ? P.berry : P.sea,
    ]),
  });
  [0, 1].forEach((i) => {
    const y = 158 + i * 113,
      col = i ? P.berry : P.sea;
    heading(c, (i ? 'Right' : 'Left') + ' center  (' + CENTROIDS[i].x + ', 5)', 572, y);
    const members = POINTS.filter((p) => partition(p) === i);
    members.forEach((p, j) => {
      if (placed > j / 3) chip(c, p.id, 601 + j * 73, y + 49, col, 17);
    });
    if (routing) text(c, d2(CENTROIDS[i]), 918, y + 48, 22, col, 'right', 'Mono');
  });
  if (routing) caption(c, 'Squared distances from query', 573, 391);
  footer(
    c,
    b === 3
      ? 'At x = 5 the centers tie. A and B fall on opposite sides.'
      : routing
        ? 'The query at (4.8, 5) opens the left list first.'
        : 'A posting list keeps the IDs assigned to one center.',
  );
}
export function lists(c, k) {
  const right = on(k, 3, 'Read its three passages'),
    n = right ? 2 : 1,
    f = filing(n);
  const first = on(k, 1, 'Which ID'),
    second = on(k, 2, 'We got'),
    swapped = on(k, 3, 'A stays put');
  const res = swapped ? f.answer : second ? filing(1).answer : first ? ['A'] : [];
  const opening = cue(k, 3, 'open the right list', 0.85);
  title(c, 'Who can take the second slot?', 'IVF Flat   /   score original coordinates');
  field(c, {
    division: 1,
    rightCover: 1 - opening,
    rim: second ? (swapped ? 'B' : 'C') : null,
    marked: swapped ? ['B'] : [],
  });
  listRows(c, f, 113, opening);
  rect(c, 565, 337, 362, 93, P.paper);
  text(
    c,
    swapped ? 'Updated result' : right ? 'Previous result' : 'Result slots',
    574,
    370,
    15,
    P.dim,
  );
  res
    .concat(Array(2 - res.length).fill('?'))
    .forEach((id, i) => chip(c, id, 770 + 66 * i, 371, id === '?' ? P.dim : P.ink, 18));
  caption(c, 'Passage scores   ' + f.read.length + ' / 6', 574, 416);
  footer(
    c,
    k.beat.beatIndex === 3
      ? 'nprobe counts lists. Both runs also score the same two centers.'
      : 'Each scored entry is a squared distance to the same query.',
  );
}
export function recovery(c, k) {
  const two = on(k, 2, 'B connects'),
    f = filing(two ? 2 : 1),
    truth = ids(exact()),
    score = recall(exact(f.read), exact());
  title(c, 'How much of the exact pair survived?', 'Neighbor recall   /   match IDs at equal k');
  const a = 256,
    b = 698,
    ys = [224, 340];
  heading(c, 'Exact top two', a - 67, 145);
  heading(c, two ? 'Two lists open' : 'One list open', b - 72, 145);
  truth.forEach((id, i) => {
    const j = f.answer.indexOf(id);
    if (j >= 0) {
      const v = i === 0 ? cue(k, 1, 'A connects', 0.9) : cue(k, 2, 'B connects', 0.9);
      line(c, a + 25, ys[i], lerp(a + 25, b - 25, v), ys[i], P.sea, 5);
    }
    chip(c, id, a, ys[i], P.ink, 24);
    chip(c, f.answer[i], b, ys[i], P.ink, 24);
  });
  const answer = two ? on(k, 2, 'We scored') : on(k, 1, 'Count identities');
  if (answer) {
    rect(c, 363, 253, 230, 57, P.lagoon);
    text(c, score * 2 + ' / 2  =  ' + score * 100 + '%', 478, 282, 24, P.sea, 'center', 'Mono');
  }
  footer(
    c,
    k.beat.beatIndex === 2
      ? 'Match corpus, embeddings, metric, filter and tie rule in both runs.'
      : f.read.length + ' passage scores   ·   recovery compares IDs, relevance requires reading.',
  );
}
export function eligibility(c, k) {
  const filtered = on(k, 2, 'Apply the same filter'),
    deleted = on(k, 2, 'Recompute the reference'),
    rerun = on(k, 4, 'Check the deletion');
  const stage = deleted ? 'delete' : filtered ? 'filter' : 'all',
    e = eligible(stage);
  title(c, 'Which passages count now?', 'Rollback query   /   changing eligibility');
  caption(c, 'Eligible collection', 48, 134);
  POINTS.forEach((p, i) => {
    const x = 102 + i * 149,
      v = e.pool.includes(p.id);
    chip(c, p.id, x, 202, v ? P.sea : P.dim, 24);
    if (!v) line(c, x - 25, 177, x + 25, 226, P.white, 3);
    text(
      c,
      v ? 'eligible' : p.id === 'A' && deleted ? 'deleted' : 'filtered',
      x,
      252,
      14,
      P.dim,
      'center',
      'Mono',
    );
  });
  pair(c, e.reference, 231, 357, 'Exact eligible pair');
  pair(
    c,
    rerun ? e.reference : e.saved,
    605,
    357,
    rerun ? 'Fresh eligible search' : filtered ? 'Saved result after filter' : 'Saved result',
  );
  footer(
    c,
    rerun
      ? 'Rerun fills slot two with E. Check deletion visibility on every serving path.'
      : deleted
        ? 'Removing A leaves one saved hit. The request still asks for two.'
        : filtered
          ? 'The filter applies to both the approximate search and the exact reference.'
          : 'The graph walk and the one-list scan both missed B.',
  );
}
