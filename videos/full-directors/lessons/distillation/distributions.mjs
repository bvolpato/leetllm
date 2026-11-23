import {
  C,
  paper,
  heading,
  text,
  serif,
  num,
  rect,
  line,
  dot,
  beat,
  at,
  mix,
  percent,
  dimension,
} from './studio.mjs';
import {
  kl,
  familyTeacher,
  family,
  familyScores,
  joint,
  chain,
  cache,
  conditional,
  retained,
  headBytes,
} from './examples.mjs';

export function directions(g, k) {
  paper(g);
  const b = beat(k);
  if (b <= 2) {
    const reversed = at(k, 2, 'The student gives B zero weight');
    heading(
      g,
      'Two outcomes   /   exact zero support',
      reversed ? 'Weight each term by the student.' : 'Weight each term by the teacher.',
    );
    const q = [0.5, 0.5],
      p = [1, 0],
      left = reversed ? p : q,
      right = reversed ? q : p;
    const parts = [
      ['A', left[0], right[0]],
      ['B', left[1], right[1]],
    ];
    const leftInk = reversed ? C.green : C.blue,
      rightInk = reversed ? C.blue : C.green;
    text(g, reversed ? 'Student' : 'Teacher', 586, 306, 39, leftInk);
    text(g, reversed ? 'Teacher' : 'Student', 1172, 306, 39, rightInk);
    parts.forEach(([word, a, b], i) => {
      const y = 451 + 189 * i;
      serif(g, word, 220, y + 31, 86);
      [
        [586, a, leftInk],
        [1172, b, rightInk],
      ].forEach(([x, v, col]) => {
        rect(g, x, y - 24, 419, 46, C.edge);
        rect(g, x, y - 24, v * 419, 46, col);
        num(g, v.toFixed(1), x, y + 77, 39, col);
      });
    });
    if (reversed && at(k, 2, 'gives log two'))
      num(g, '1 × ln(1/0.5) + 0  =  ' + kl(p, q).toFixed(3) + ' nats', 202, 888, 52);
    else if (!reversed && at(k, 1, 'That term diverges'))
      num(g, 'B   0.5 × ln(0.5/0)  →  ∞', 202, 888, 52, C.pink);
    return;
  }
  const fw = familyScores(false);
  const rv = familyScores(true);
  const scoreLimit = Math.ceil(Math.max(...fw, ...rv) * 10) / 10;
  function scoreReveal(phrase) {
    if (b !== 5) return { ready: b > 5, grow: Number(b > 5) };
    const { start, end } = k.wordCue(phrase);
    const ready = k.reveal(phrase, end - start, { captionStart: phrase }) === 1;
    return { ready, grow: Math.min(1, Math.max(0, (k.elapsed - end) / 0.42)) };
  }
  const forward = scoreReveal('It selects the center');
  const reverse = scoreReveal('Either side wins');
  let markGap = b > 5;
  if (b === 5) {
    const phrase = 'in the gap';
    const { start, end } = k.wordCue(phrase);
    markGap = k.reveal(phrase, end - start, { captionStart: false }) === 1;
  }
  const prediction =
    b === 4 && k.reveal('For each K L direction', 0, { captionStart: false }) === 1;

  heading(
    g,
    'Gold ticks: teacher [0.49, 0.02, 0.49]   /   Green bars: candidate students',
    'Which student fits the two peaks?',
  );
  const rows = [
    [fw, forward, 'Forward KL', C.blue],
    [rv, reverse, 'Reverse KL', C.pink],
  ];
  ['Left', 'Center', 'Right'].forEach((name, i) => {
    const x = 166 + i * 569;
    serif(g, name, x + 183, 311, 56, C.root, 'center');
    family[i].forEach((p, j) => {
      const x0 = x + 141 * j;
      const y = 605 - 275 * p;
      rect(g, x0, y, 88, 605 - y, C.green);
      const tick = 605 - 275 * familyTeacher[j];
      line(g, x0 - 8, tick, x0 + 97, tick, C.gold, 6);
      if (markGap && i === 1 && j === 1) {
        g.strokeStyle = C.pink;
        g.lineWidth = 6;
        g.strokeRect(x0 - 7, y - 7, 102, tick - y + 7);
      }
      num(g, p.toFixed(2), x0 + 43, 657, 34, C.root, 'center');
    });
    rows.forEach(([values, { ready, grow }, label, color], j) => {
      if (!ready) return;
      const y = 732 + j * 99;
      const best = values[i] === Math.min(...values);
      text(g, label, x, y - 21, 34, color);
      rect(g, x, y, 282, 16, C.edge);
      rect(g, x, y, (282 * values[i] * grow) / scoreLimit, 16, color);
      num(g, values[i].toFixed(3) + (best ? ' ✓' : ''), x + 308, y + 20, 38, best ? C.root : color);
    });
  });
  if (prediction)
    text(g, 'Which shape wins each comparison?', 960, 825, 53, C.root, 'center');
  if (forward.ready && b === 5)
    num(g, 'Common loss scale: 0–' + scoreLimit.toFixed(1) + ' nats  ·  Lower wins', 960, 893, 33, C.muted, 'center');
  if (b === 6) {
    const phrase = 'both losses would reach zero there';
    const { start, end } = k.wordCue(phrase);
    if (k.reveal(phrase, end - start, { captionStart: phrase }) === 1)
      text(g, 'An exact copy would score zero in both directions.', 960, 893, 34, C.muted, 'center');
  }
}

const branchColor = ['#c99d57', '#ecd3a0', '#90b9b0', '#548776'];
function pairedMass(g, row, x, y, w, split) {
  const parts =
    split === 2
      ? row
      : split === 1
        ? [row[0], row[1], row[2] + row[3]]
        : [row[0] + row[1], row[2] + row[3]];
  const names =
    split === 2 ? ['AA', 'AB', 'BA', 'BB'] : split === 1 ? ['AA', 'AB', 'B'] : ['A', 'B'];
  let pos = x;
  parts.forEach((v, i) => {
    const len = v * w;
    rect(g, pos, y, len, 92, branchColor[split ? i : 2 * i]);
    line(g, pos, y, pos, y + 92, C.light, 3);
    num(g, names[i], pos + len / 2, y + 39, Math.min(35, len / 1.6), C.root, 'center');
    num(g, percent(v), pos + len / 2, y + 76, Math.min(31, len / 2), C.root, 'center');
    pos += len;
  });
}
function traceWeight(g, y, progress, ink) {
  // Trace the selected bracket around both strips to the coefficient after B.
  const path = [[1752, y], [1800, y], [1800, 710], [1057, 710], [1057, 742]];
  const length = 48 + (710 - y) + 743 + 32;
  g.save();
  g.beginPath();
  g.moveTo(...path[0]);
  for (const point of path.slice(1)) g.lineTo(...point);
  g.strokeStyle = ink;
  g.lineWidth = 4;
  g.setLineDash([length, length + 1]);
  g.lineDashOffset = length * (1 - progress);
  g.stroke();
  g.restore();
}

export function sequences(g, k) {
  paper(g);
  const b = beat(k),
    sub = at(k, 2, 'Do the same under B') ? 2 : at(k, 2, 'Split the A branch') ? 1 : 0,
    reverse = at(k, 5, 'put the student on the left') && !at(k, 6, 'Keep the forward comparisons'),
    equal = at(k, 6, 'give the two prefixes equal weight');
  if (b <= 6) {
    const selected = at(k, 4, 'The teacher');
    const addPaths = at(k, 4, 'Sixteen percent');
    const subtotal = at(k, 4, 'That puts a weight');
    const carry = at(k, 4, 'on the conditional', 1.2);
    const ink = equal ? C.root : reverse ? C.green : C.blue;
    const r = chain(reverse, equal);
    let context = 'Two tokens per path   /   A or B at each step';
    let title = 'Who reaches the second decision?';
    if (equal) {
      context = 'Local comparisons   /   KL(teacher || student)';
      title = 'Replay with equal prefix weights';
    } else if (selected) {
      context = (reverse ? 'KL(student || teacher)' : 'KL(teacher || student)') + '   /   two tokens per path';
      title = reverse ? 'Reverse sequence KL' : 'Forward sequence KL';
    } else if (b === 3) {
      context = 'Forward sequence KL';
      title = 'Which model supplies the weight after B?';
    }
    heading(g, context, title);
    const rows =
      reverse && !equal
        ? [
            [joint.p, 'Student'],
            [joint.q, 'Teacher'],
          ]
        : [
            [joint.q, 'Teacher'],
            [joint.p, 'Student'],
          ];
    rows.forEach(([v, name], i) => {
      const y = 333 + i * 188;
      text(g, name, 124, y + 57, 44, name === 'Teacher' ? C.blue : C.green);
      pairedMass(g, v, 398, y, 1354, sub);
      if (!selected) return;
      const massA = v[0] + v[1], massB = v[2] + v[3];
      const cut = 398 + 1354 * massA;
      const chosen = i === 0 && !equal;
      if (!chosen && b === 4) return;
      if (chosen) {
        g.strokeStyle = ink;
        g.lineWidth = 5;
        g.strokeRect(cut, y, 1752 - cut, 92);
      }
      if (b > 4 || at(k, 4, 'After A')) {
        dimension(g, 398, cut - 3, y + 116);
        text(g, 'after A   ' + percent(massA), (398 + cut) / 2, y + 157, 30, C.muted, 'center');
      }
      const bracketInk = chosen ? ink : C.muted;
      dimension(g, cut, 1752, y + 116, '', bracketInk);
      let label = 'after B   ' + percent(massB);
      if (chosen) {
        label = 'BA + BB';
        if (addPaths) label = percent(v[2]) + ' + ' + percent(v[3]);
        if (subtotal) label += ' = ' + percent(massB);
      }
      text(g, label, (cut + 1752) / 2, y + 157, 30, bracketInk, 'center');
    });
    if (selected) {
      if (carry && !equal) traceWeight(g, 449, carry, ink);
      if (carry === 1) {
        text(g, 'After B', 1020, 790, 31, ink);
        num(g, r.weights[1].toFixed(1) + ' × ' + r.local[1].toFixed(3), 1020, 859, 43, ink);
      }
      if (at(k, 4, 'At the root')) {
        text(g, 'Root KL', 125, 790, 31, C.muted);
        num(g, r.first.toFixed(3), 125, 859, 46);
      }
      if (at(k, 4, 'After A')) {
        text(g, 'After A', 525, 790, 31, C.muted);
        num(g, '+', 425, 859, 43);
        num(g, r.weights[0].toFixed(1) + ' × ' + r.local[0].toFixed(3) + '   +', 525, 859, 43);
      }
      const showTotal = equal ? at(k, 6, 'The source of the prefix weights') :
        reverse ? b > 5 || k.elapsed >= k.speechDuration : at(k, 4, 'the same as comparing');
      if (showTotal)
        num(g, '= ' + r.total.toFixed(3), 1495, 859, 47, C.green);
      if (at(k, 4, 'Forward K L averages')) {
        const note = equal ? 'Forward local KLs with hand-set weights' :
          'Average over paths drawn from the ' + (reverse ? 'student' : 'teacher') + '.';
        text(g, note, 125, 943, 32, C.muted);
        if (showTotal) text(g, 'Nats per sequence, summed before rounding', 1775, 943, 30, C.muted, 'right');
      }
    } else if (b === 2 && at(k, 2, 'Nine tenths of eighty percent')) {
      const factors = joint.q0[0].toFixed(2) + ' × ' + joint.q1[0][0].toFixed(2);
      num(g, 'Teacher AA     ' + factors + ' = ' + joint.q[0].toFixed(2), 125, 870, 51, C.blue);
    } else if (b === 3) {
      serif(g, 'What weight do you get, and why use that strip?', 125, 803, 54);
      text(g, 'Add the paths in your strip that start with B.', 125, 886, 42, C.muted);
    }
    return;
  }
  heading(
    g,
    'Collect a path, then assign credit',
    b === 7 ? 'GKD scores the visited prefix.' : 'MiniLLM assigns sequence-level credit.',
  );
  const tokens = ['A', 'B'];
  const y = 487;
  text(g, 'Student sample', 125, y + 11, 38, C.green);
  tokens.forEach((s, i) => {
    const x = 570 + 487 * i;
    dot(g, x, y, 70, i ? C.blue : C.green);
    serif(g, s, x, y + 21, 62, C.white, 'center');
  });
  line(g, 644, y, 984, y, C.root, 5);
  if (b === 7) {
    text(g, 'Prefix A', 572, 677, 42, C.green, 'center');
    text(g, 'Teacher after A', 1056, 677, 42, C.blue, 'center');
    num(g, '[0.90, 0.10]', 1056, 751, 42, C.blue, 'center');
    text(
      g,
      'λ  chooses the sampled fraction.     The divergence scores the fixed prefix.',
      124,
      888,
      36,
      C.muted,
    );
  } else {
    text(g, 'Sequence log ratio   ·   log teacher − log student', 123, 674, 47);
    num(
      g,
      'AB    ln(' +
        joint.q[1].toFixed(2) +
        ' / ' +
        joint.p[1].toFixed(2) +
        ') = ' +
        Math.log(joint.q[1] / joint.p[1]).toFixed(3),
      124,
      777,
      47,
      C.green,
    );
    text(
      g,
      'Inspect generated text for repetition as well as measuring divergence.',
      124,
      914,
      36,
      C.muted,
    );
  }
}

const cacheInks = ['#e4bf73', '#87beb2', '#cc8184'];
export function cacheScene(g, k) {
  paper(g, true);
  const b = beat(k);
  if (b === 1) {
    heading(g, 'Teacher access', 'Which signal can you keep?', true);
    serif(g, '“bird in the garden”', 132, 457, 96, C.white);
    text(g, 'Reviewed text', 130, 554, 43, C.teal);
    text(g, 'Student tokenizes the answer.', 720, 554, 39, C.white);
    line(g, 130, 637, 1770, 637, '#466762', 3);
    num(g, '[z[0], …, z[V−1]]', 130, 756, 53, C.brass);
    text(g, 'Full logits or normalized log probabilities', 720, 755, 39, C.white);
    text(g, 'Recompute softmax at a positive temperature.', 720, 823, 34, C.faint);
    return;
  }
  if (b <= 6) {
    const keep = at(k, 3, 'Keep A and B', 0.7);
    const stretch = at(k, 5, 'Stretch the retained pair', 1.1);
    const restore = at(k, 6, 'Restore the full strips', 1.3);
    const zoom = stretch * (1 - Math.min(1, restore * 2));
    const tailOpacity = Math.max(1 - keep, 2 * restore - 1);
    const conditionalOnly = zoom === 1;
    const originalScale = zoom === 0;
    heading(
      g,
      'Top-two cache   /   the teacher supplies the selected IDs',
      conditionalOnly ? 'Inside the retained pair' :
        stretch && !restore ? 'Stretch each pair to fill its strip.' :
        restore ? 'Restore the original coverage.' : 'How much mass did the cache keep?',
      true,
    );
    cache.forEach((row, i) => {
      const x = 406, y = 355 + 235 * i, w = 1308;
      const selected = retained(row), shares = conditional(row);
      const pairWidth = w * mix(selected, 1, zoom);
      text(g, i ? 'Student' : 'Teacher', 126, y + 68, 42, C.white);
      rect(g, x, y, w, 104, '#2d494a');
      let pos = x;
      shares.forEach((share, j) => {
        const width = pairWidth * share;
        rect(g, pos, y, width, 104, cacheInks[j]);
        line(g, pos, y, pos, y + 104, C.night, 3);
        num(g, ['A', 'B'][j], pos + width / 2, y + 67, width < 90 ? 35 : 48, C.night, 'center');
        pos += width;
      });
      if (tailOpacity > 0) {
        const width = w * row[2];
        g.save();
        g.globalAlpha = tailOpacity;
        rect(g, pos, y, width, 104, cacheInks[2]);
        line(g, pos, y, pos, y + 104, C.night, 3);
        num(g, 'C', pos + width / 2, y + 67, 48, C.night, 'center');
        g.restore();
      }
      if (keep && restore < 1) {
        dimension(g, x, x + pairWidth, y + 117, '', C.brass);
        if (conditionalOnly) {
          num(g, 'A  ' + percent(shares[0]) + '     B  ' + percent(shares[1]),
            x, y + 177, 39, C.brass);
        } else if (originalScale) {
          text(g, percent(selected) + ' of original mass in A + B', x, y + 177, 37, C.brass);
        }
      } else {
        text(g, row.map((p, j) => ['A', 'B', 'C'][j] + ' ' + percent(p)).join('     '),
          x, y + 168, 38, C.faint);
      }
    });
    if (conditionalOnly && at(k, 5, 'conditional K L is zero'))
      num(g, 'Conditional KL = ' + kl(...cache.map(conditional)) + ' nats', 129, 938, 47, C.teal);
    else if (at(k, 6, 'Full forward K L')) {
      num(g, 'Full forward KL = ' + kl(...cache).toFixed(3) + ' nats', 129, 938, 47, C.teal);
      text(g, 'Cached pair alone    0 nats', 1750, 935, 35, C.brass, 'right');
    } else if (b === 4)
      text(g, 'Stretch both pairs to the same width. What will KL see?', 129, 938, 39, C.white);
    return;
  }
  if (b === 7) {
    heading(g, 'Dense cache   /   payload only', 'How large is the saved distribution?', true);
    const factors = [
      ['10,000', 'positions'],
      ['50,000', 'values per position'],
      ['2', 'bytes per value'],
    ];
    factors.forEach(([v, s], i) => {
      const x = 158 + i * 552;
      num(g, v, x, 533, 89, C.white);
      text(g, s, x, 631, 38, C.faint);
      if (i < 2) text(g, '×', x + 417, 533, 61, C.brass);
    });
    if (at(k, 7, 'one decimal gigabyte'))
      serif(g, headBytes / 1e9 + ' decimal GB', 154, 865, 89, C.teal);
    return;
  }
  if (b < 10) {
    heading(
      g,
      'TRL guide   /   October 2026',
      b === 8 ? 'Which turns supply targets?' : 'Which head weights receive gradients?',
      true,
    );
    if (b === 8) {
      ['Prompt', 'Assistant', 'Tool reply', 'Assistant'].forEach((s, i) => {
        const x = 125 + i * 430,
          active = i % 2;
        rect(g, x, 415, 386, 116, active ? C.teal : '#47615f');
        serif(g, s, x + 193, 491, 46, active ? C.night : C.white, 'center');
        text(
          g,
          active ? 'In loss' : 'Context',
          x + 193,
          656,
          42,
          active ? C.teal : C.faint,
          'center',
        );
      });
      text(
        g,
        'Sample student completions    ·    chunked full-vocabulary generalized JS loss',
        125,
        881,
        37,
        C.white,
      );
    } else {
      text(g, 'Student backbone', 127, 393, 43, C.teal);
      num(g, 'lm_head.weight', 126, 530, 81, C.white);
      text(g, 'Loss reads the head weights directly.', 129, 627, 45, C.white);
      num(g, 'modules_to_save = ["lm_head"]', 129, 809, 52, C.brass);
      text(
        g,
        'Head adapters and prompt learning bypassed by this path are rejected.',
        128,
        909,
        35,
        C.faint,
      );
    }
    return;
  }
  heading(g, 'Training diagnostics', 'What did a falling CPU loss establish?', true);
  const rows = [
    ['Collection fraction λ', 'Which student prefixes reach the teacher?'],
    ['Divergence β', 'How is each distribution mismatch scored?'],
    ['Positionwise CPU fixture', 'The optimizer can fit a random teacher.'],
  ];
  rows.forEach(([s, v], i) => {
    const y = 386 + 163 * i;
    text(g, s, 130, y, 42, C.teal);
    serif(g, v, 746, y + 3, 47, C.white);
    line(g, 130, y + 44, 1770, y + 44, '#45615c', 2);
  });
  text(g, 'Language transfer needs fresh tasks.', 131, 924, 39, C.brass);
}
