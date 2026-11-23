import { C } from './paint.mjs';
import { print } from './prints.mjs';
import {
  loss,
  preferenceExample,
  logits,
  masses,
  sum,
  pairLogits,
  cacheKey,
  perms,
  maxSimMatrix,
} from './evidence.mjs';
function graph(p, fn, color, domain, area, maxY) {
  const [min, max] = domain,
    [x, y, w, h] = area;
  const xy = (n) => [x + ((n - min) / (max - min)) * w, y + h - (fn(n) / maxY) * h];
  p.path(
    Array.from({ length: 121 }, (_, i) => xy(min + ((max - min) * i) / 120)),
    color,
    7,
  );
  return xy;
}
export function losses(p) {
  p.base('Learning to rank', 'Sunday question');
  if (p.b <= 4) {
    const pair = p.b >= 3;
    p.title(pair ? 'A loss for the order of two passages' : 'A loss for each labeled passage');
    const area = [135, 336, 930, 393],
      domain = [-2, 2],
      axisX = area[0] + area[2] / 2;
    [0, 1, 2].forEach((y) => {
      const yy = 729 - (y / 2.5) * 393;
      p.line(135, yy, 1065, yy, C.faint, 2);
      p.mono(y, 106, yy + 10, 26, C.muted, 'right');
    });
    [-2, -1, 0, 1, 2].forEach((v, i) => p.mono(v, 135 + 232.5 * i, 778, 29, C.muted, 'center'));
    p.line(axisX, 312, axisX, 729, C.faint, 2);
    p.mono('LOSS', 135, 292, 28, C.muted);
    p.text(pair ? 'gap = hours − story time' : 'logit', 593, 846, 39, C.ink, 'Serif', 'center');
    const curve = graph(p, loss, C.teal, domain, area, 2.5);
    const { hours, story, gap, exponent, value } = preferenceExample(
      p.at(4, 'Swap the scores', 1.6),
    );
    if (pair) {
      const [x, y] = curve(gap);
      if (p.at(3, 'Hours leads by one')) p.dot(x, y, 16, C.teal, C.white, 5);
    } else {
      const neg = graph(p, (n) => loss(-n), C.red, domain, area, 2.5);
      p.dot(...curve(hours), 15, C.teal, C.white, 4);
      p.dot(...neg(story), 15, C.red, C.white, 4);
    }
    for (const [i, id, val] of [
      [0, 2, hours],
      [1, 0, story],
    ]) {
      const y = 344 + i * 185;
      print(p.c, id, 1184, y, 185, 89);
      p.text(id === 2 ? 'Hours' : 'Story time', 1395, y + 36, 39, C.ink, 'Serif');
      p.mono(val.toFixed(2), 1395, y + 90, 41, id === 2 ? C.teal : C.red);
    }
    if (p.b === 2) {
      if (p.at(2, 'Take the negative natural log')) {
        p.text('−ln σ(' + hours.toFixed(2) + ') ≈ ' + loss(hours).toFixed(3), 1185, 494, 36, C.teal);
        p.text(
          '−ln(1 − σ(' + story.toFixed(2) + ')) ≈ ' + loss(-story).toFixed(3),
          1185, 679, 36, C.red,
        );
      }
      if (p.at(2, 'Their mean')) {
        const mean = (loss(hours) + loss(-story)) / 2;
        p.mono('Mean loss   ' + mean.toFixed(3), 1185, 822, 40, C.blue);
      }
    }
    if (pair) {
      if (p.at(3, 'Hours leads by one')) {
        const signedGap = (gap > 0 ? '+' : '') + gap.toFixed(2).replace('-', '−');
        p.mono('Gap   ' + signedGap, 1185, 704, 38, C.blue);
      }
      if (p.at(3, 'For the logistic preference loss'))
        p.text('L = ln(1 + exp(−gap))', 1185, 786, 46, C.ink, 'Serif');
      if (p.at(3, 'Here e to the minus one')) {
        const power = (-gap).toFixed(2).replace('-', '−');
        p.mono('exp(' + power + ') ≈ ' + exponent.toFixed(3), 1185, 857, 36, C.muted);
      }
      if (p.at(3, 'The natural log of one point'))
        p.text(
          'L ≈ ln(1 + ' + exponent.toFixed(3) + ') ≈ ' + value.toFixed(3),
          1185, 936, 43, C.teal, 'Serif',
        );
    }
    return;
  }
  p.title('Which search result makes a hard negative?');
  print(p.c, 1, 112, 306, 630, 302);
  p.text('Holiday hours vary by branch.', 116, 711, 49, C.ink, 'Serif');
  p.line(859, 310, 859, 835, C.faint, 4);
  p.mono('QUERY', 959, 370, 32, C.blue);
  p.words('Is the library open on Sunday?', 959, 469, 789, 61, 81);
  p.words('The notice mentions hours. It leaves Sunday unanswered.', 959, 689, 783, 44, 60, C.red);
  if (p.b === 6) p.text('Keep each query family in one split.', 116, 942, 39, C.blue);
}
export function tokenScore(p) {
  p.base('Checkpoint contract', 'One prediction position');
  const pairs = p.at(5, 'Now score passages A and B');
  if (p.b <= 2) {
    p.title('Which output does the checkpoint read?');
    [
      ['MonoT5', 'true', 'false', 'Encoder → decoder'],
      ['Qwen3 reranker', 'yes', 'no', 'Final prompt position'],
    ].forEach(([name, a, b, which], i) => {
      const y = 327 + i * 238;
      p.text(name, 125, y + 55, 62, C.ink, 'Serif');
      p.text(which, 128, y + 117, 34, C.muted);
      p.box(832, y, 375, 133, C.mint);
      p.text(a, 1020, y + 88, 63, C.teal, 'Serif', 'center');
      p.box(1240, y, 375, 133, C.sky);
      p.text(b, 1428, y + 88, 63, C.blue, 'Serif', 'center');
    });
    if (p.b === 2) {
      p.mono('One token per label at the same position', 122, 878, 34, C.muted);
      p.text('Binary yes share = sigmoid(yes logit − no logit)', 122, 959, 47, C.ink, 'Serif');
    }
    return;
  }
  if (!pairs) {
    p.title('Which weights enter the denominator?');
    const palette = [C.teal, C.blue, C.gold],
      labels = ['yes', 'no', 'other'];
    logits.forEach((l, i) => {
      const x = 111 + i * 575;
      p.mono(labels[i], x, 327, 43, palette[i]);
      p.text('logit  ' + l, x, 408, 48, C.ink, 'Serif');
      p.text('weight  ' + masses[i].toFixed(2), x, 472, 35, C.muted);
    });
    const bar = (y, n) => {
      const total = sum(masses.slice(0, n));
      let x = 538;
      p.text(n === 2 ? 'Binary' : 'Whole vocabulary', 108, y + 58, 41, C.ink, 'Serif');
      for (let i = 0; i < n; i++) {
        const w = (1010 * masses[i]) / total;
        p.box(x, y, w, 86, palette[i]);
        p.text(labels[i], x + w / 2, y + 56, 33, C.white, 'Sans', 'center');
        x += w;
      }
      p.mono((masses[0] / total).toFixed(3), 1794, y + 63, 45, C.teal, 'right');
      p.mono(
        'yes share = exp(2) / (' +
          logits
            .slice(0, n)
            .map((l) => 'exp(' + l + ')')
            .join(' + ') +
          ')',
        538,
        y + 134,
        30,
        C.muted,
      );
    };
    if (p.at(4, 'That is the binary')) bar(575, 2);
    else p.text('yes weight / (yes weight + no weight)', 135, 650, 55, C.ink, 'Serif');
    if (p.at(5, 'Both scores come')) bar(768, 3);
    else if (p.b >= 4)
      p.text('What share is left when “other” counts?', 110, 828, 49, C.ink, 'Serif');
    return;
  }
  p.title('Two ways to order A and B');
  const xs = [126, 521, 808, 1157, 1502];
  ['Passage', 'yes', 'no', 'yes only', 'yes − no'].forEach((v, i) =>
    p.text(v, xs[i], 364, 41, C.muted),
  );
  const yes = p.at(7, 'Subtract no'),
    diff = p.at(7, 'B’s gap');
  pairLogits.forEach(([a, b], i) => {
    const y = 513 + i * 180;
    [i ? 'B' : 'A', a, b, yes ? a : '?', diff ? a - b : '?'].forEach((v, j) =>
      p.mono(
        v,
        xs[j],
        y,
        68,
        (j === 3 && yes && i === 1) || (j === 4 && diff && i === 0) ? C.teal : C.ink,
      ),
    );
    p.line(124, y + 44, 1801, y + 44, C.faint, 3);
  });
  p.text(
    p.b === 8
      ? 'Finite precision can tie distinct logits after a sigmoid.'
      : 'Read the checkpoint’s template and scoring code.',
    129,
    930,
    43,
    C.blue,
  );
}
const colors = { P: C.blue, Q: C.teal, R: C.lilac, X: C.red };
function letters(p, x, y, list, w = 166, h = 139) {
  list.forEach((v, i) => {
    const X = x + i * (w + 18);
    p.box(X, y, w, h, colors[v]);
    p.text(v, X + w / 2, y + h * 0.72, h * 0.65, C.white, 'Serif', 'center');
  });
}
export function listwise(p) {
  p.base('Reading order', 'Listwise inputs');
  const swap = p.at(1, 'Swap the holiday notice');
  if (p.b <= 2) {
    p.title('Change a neighbor, keep the hours notice');
    p.mono('PAIR SCORER', 116, 337, 34, C.blue);
    p.mono('LISTWISE SCORER', 116, 640, 34, C.teal);
    function strip(y, words) {
      words.forEach((v, i) => {
        const x = 109 + i * 433;
        p.sheet(x, y, 401, 132, v === 'Hours' ? C.mint : v === 'Events' ? C.rose : C.white);
        p.text(v, x + 201, y + 87, 51, C.ink, 'Serif', 'center');
      });
    }
    strip(389, ['Sunday?', 'Hours']);
    strip(690, ['Sunday?', swap ? 'Events' : 'Holiday', 'Hours', 'Map']);
    if (p.b === 2) p.text('Same pair input', 111, 572, 38, C.blue);
    if (p.b === 2) p.text('Different ordered input', 111, 884, 38, C.teal);
    return;
  }
  if (p.b <= 4) {
    p.title('Which earlier words can “Hours” read?');
    const words = ['Sunday?', 'Events', 'Hours', 'Map'];
    words.forEach((s, i) => {
      const x = 426 + i * 202,
        y = 369 + i * 126;
      p.text(s, x + 72, 317, 32, C.muted, 'Sans', 'center');
      p.text(s, 349, y + 59, 39, i === 2 ? C.teal : C.muted, 'Sans', 'right');
      for (let j = 0; j < 4; j++)
        p.box(426 + j * 202, y, 145, 90, j <= i ? (i === 2 ? C.teal : C.blue) : C.faint);
    });
    p.text('Causal attention', 1353, 402, 48, C.ink, 'Serif');
    p.words('The hours passage can use the events to its left.', 1354, 492, 448, 40, 57);
    if (p.b === 4)
      p.words(
        'Jina v3.5 projects hidden states and scores with cosine similarity.',
        1354,
        707,
        448,
        35,
        47,
        C.teal,
      );
    return;
  }
  p.title('Check the returned identifiers');
  const sent = ['P', 'Q', 'R'],
    ret = ['Q', 'P', p.at(5, 'Replace its last identifier') ? 'X' : 'R'];
  p.text('Sent', 134, 382, 56, C.ink, 'Serif');
  letters(p, 130, 438, sent, 200, 174);
  p.arrow(841, 526, 1009, 526, C.muted);
  p.text('Returned', 1133, 382, 56, C.ink, 'Serif');
  if (p.at(5, 'Getting Q')) {
    letters(p, 1128, 438, ret, 195, 174);
    const valid = perms(sent, ret);
    if (valid || p.at(6, 'Reject the order'))
      p.text(
        valid ? 'Each ID appears once' : 'Missing R · unexpected X',
        1128,
        746,
        45,
        valid ? C.teal : C.red,
        'Serif',
      );
  }
}
export function cache(p) {
  p.base('Score cache', 'Trusted namespace');
  p.title(
    p.b === 5 ? 'Can the caller read this cached result?' : 'What identifies this scoring input?',
  );
  const text = p.at(3, 'Change the passage text') ? 'revision B' : 'revision A';
  const tenant = p.at(3, 'Change tenant') ? 'beta' : 'alpha';
  const list = p.at(3, 'Swap P and R') ? ['R', 'Q', 'P'] : ['P', 'Q', 'R'];
  const revoked = p.at(5, 'Grant eight revoked');
  const old = cacheKey({ text, tenant, list }),
    current = cacheKey({ text, tenant, list, grant: revoked ? 8 : 7 });
  p.sheet(112, 292, 1004, 601);
  p.mono('ORDERED INPUT', 158, 369, 30, C.blue);
  letters(p, 158, 421, list, 183, 125);
  p.mono('source text     ' + text, 158, 631, 35);
  p.mono('model / tokens  m1 / t1', 158, 701, 35);
  p.mono('template        v1  ·  limit 24', 158, 771, 35);
  p.mono('tenant / grant  ' + tenant + ' / 7', 158, 841, 35);
  p.arrow(1139, 593, 1237, 593, C.muted);
  p.mono('STORED KEY', 1282, 419, 31, C.teal);
  p.mono(old.slice(0, 12) + '…', 1280, 498, 46, C.ink);
  if (p.b === 5) {
    p.mono('CURRENT GRANT  ' + (revoked ? 8 : 7), 1282, 620, 31, revoked ? C.red : C.teal);
    p.mono(current.slice(0, 12) + '…', 1280, 698, 46, C.ink);
    if (revoked)
      p.words('Access revoked. Withhold the cached result.', 1281, 794, 480, 39, 52, C.red);
  } else p.words('Fingerprint of the named inputs and settings', 1281, 622, 488, 44, 62, C.ink);
}
export function maxsim(p) {
  p.base('Late interaction', 'ColBERT  /  toy unit vectors');
  p.title('Each query token chooses its own match');
  const mat = maxSimMatrix(),
    prune = p.at(7, 'discarding the third arrow');
  const ox = 554,
    oy = 643,
    scale = 295,
    n = prune ? 2 : 3,
    col = [C.blue, C.teal, C.red];
  p.line(174, oy, 915, oy, C.faint, 4);
  p.line(ox, 279, ox, 963, C.faint, 4);
  p.c.beginPath();
  p.c.arc(ox, oy, scale, 0, Math.PI * 2);
  p.c.strokeStyle = C.faint;
  p.c.lineWidth = 2;
  p.c.stroke();
  for (let i = 0; i < n; i++) {
    const x = ox + scale * mat[0][i],
      y = oy - scale * mat[1][i];
    p.arrow(ox, oy, x, y, col[i], 7);
    p.mono('d' + (i + 1), x + (i === 2 ? -32 : 10), y - 13, 32, col[i]);
  }
  if (p.b === 6 && p.at(6, 'a nearby centroid')) {
    const x = ox + 0.72 * scale,
      y = oy - 0.33 * scale;
    p.dot(x, y, 11, C.gold);
    p.arrow(x, y, ox + mat[0][0] * scale, oy - mat[1][0] * scale, C.gold, 5);
    p.text('centroid', x + 16, y + 44, 34, C.ink, 'Serif');
    p.mono('TOKEN VECTOR = CENTROID + RESIDUAL', 1018, 379, 32, C.muted);
    p.words(
      'Keep the centroid ID and encode the small displacement to the token vector.',
      1016,
      492,
      750,
      47,
      66,
    );
    p.words('ColBERTv2 study: 6–10× less storage.', 1016, 770, 740, 37, 51, C.teal);
    return;
  }
  if (p.b === 3 || p.b === 4) {
    const vertical = p.b === 4;
    p.arrow(ox, oy, vertical ? ox : ox + scale, vertical ? oy - scale : oy, C.gold, 5);
    for (let i = 0; i < n; i++) {
      const x = ox + mat[0][i] * scale,
        y = oy - mat[1][i] * scale;
      p.c.save();
      p.c.setLineDash([6, 9]);
      p.line(x, y, vertical ? ox : x, vertical ? y : oy, col[i], 2);
      p.c.restore();
      p.dot(vertical ? ox : x, vertical ? y : oy, 6, col[i]);
    }
  }
  if (p.b < 3) {
    p.text('Document token vectors', 1044, 430, 52, C.ink, 'Serif');
    p.words('Precompute one contextual vector per document token.', 1046, 532, 692, 44, 63);
    if (p.b === 2)
      p.words('Unit vectors: dot product = cosine similarity.', 1046, 781, 705, 37, 53, C.teal);
    return;
  }
  p.mono('DOT PRODUCTS', 1020, 323, 30, C.muted);
  const row2 = p.b >= 4;
  [0, 1].slice(0, row2 ? 2 : 1).forEach((r) => {
    const y = 437 + r * 207,
      win = Math.max(...mat[r].slice(0, n)),
      done = r === 0 ? p.at(3, 'so its dot product') : p.at(5, 'Add point nine');
    p.text(r ? 'q₂   straight up' : 'q₁   due right', 1018, y, 43, C.ink, 'Serif');
    for (let j = 0; j < n; j++) {
      const x = 1017 + j * 260;
      p.box(x, y + 32, 226, 88, done && mat[r][j] === win ? C.mint : C.white);
      p.mono(
        mat[r][j].toFixed(3).replace(/0+$/, '').replace(/\.$/, ''),
        x + 113,
        y + 90,
        39,
        col[j],
        'center',
      );
    }
  });
  if (p.at(5, 'That sum of row maxima'))
    p.text(
      'MaxSim   ' + mat.map((r) => Math.max(...r.slice(0, n))).join(' + ') + ' = 1.7',
      1017,
      899,
      47,
      C.teal,
      'Serif',
    );
  if (prune) p.mono('2 × 2 = 4 comparisons', 1019, 972, 30, C.muted);
}
