import assert from 'node:assert/strict';
import { vectors } from '../../../films/decision-models-jev-kev/fixtures.mjs';
import { softmax } from '../../../films/decision-models-jev-kev/arithmetic.mjs';

const choices = ['Test regression', 'Registry authentication', 'Insufficient evidence'];
const ids = ['A', 'B', 'C'];
const query = [1, 0];

function readMarkers(keys, decision) {
  const products = keys.map((key) => key.map((value, i) => value * decision[i]));
  const sums = products.map((row) => row.reduce((sum, x) => sum + x, 0));
  const logits = sums.map((sum) => sum / Math.sqrt(decision.length));
  const shares = softmax(logits);
  const winner = shares.indexOf(Math.max(...shares));
  return { products, sums, logits, shares, winner };
}

const result = readMarkers(vectors, query);
const beats = [
  {
    id: 'registry-reply',
    say: 'Watch the registry reply. Four oh one, unauthorized. The build never gets its image, so the tests never start. Which of these three answers fits the log?',
    hold: 1.8,
  },
  {
    id: 'mark-the-positions',
    say: "Keep your pick in mind. Kev reads the log, the question, and the options. These marks show where each option ends. There's one more mark where Kev makes its decision.",
    hold: 0.7,
  },
  {
    id: 'read-the-markers',
    say: "Each mark has a hidden vector. Kev's pointer head projects the three option vectors into keys and the decision vector into a query. Here we'll use two invented coordinates for each.",
    hold: 1.1,
  },
  {
    id: 'multiply-and-add',
    say: 'The query is one, zero. Multiply the matching coordinates. Watch the second column. Every value there gets multiplied by zero. Now add across each row. Which sum is largest?',
    hold: 2.0,
  },
  {
    id: 'scale-the-sums',
    say: "Two, in the middle row. That's the largest dot product. Kev divides each sum by the square root of the pointer width. With two coordinates, B's score comes out to about one point four one.",
    hold: 0.6,
  },
  {
    id: 'return-the-choice',
    say: 'At temperature one, softmax turns these scores into probabilities across the three options. B gets about sixty-three percent. Follow its marker back to the answer the caller supplied.',
    hold: 1.3,
  },
  {
    id: 'first-lead',
    say: "Registry authentication. That's where the build engineer can start looking.",
    hold: 2.6,
  },
];

const color = {
  white: '#f6f1ff', dim: '#bec4ed', line: '#707cae',
  aqua: '#99fff0', amber: '#ffd089', deep: '#171e53',
};
const rows = [419, 558, 697];
const lastRow = 831;
const glyphs = {
  '4': ['00110', '01110', '11010', '11010', '11111', '00010', '00010'],
  '0': ['01110', '11011', '11011', '11011', '11011', '11011', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
};
const mix = (a, b, t) => a + (b - a) * t;
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);

function path(ctx, commands, fill, stroke, width = 1) {
  ctx.beginPath();
  for (const [method, ...args] of commands) ctx[method](...args);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function box(ctx, x, y, w, h, r, fill) {
  path(ctx, [['roundRect', x, y, w, h, r]], fill);
}

function line(ctx, x, y, endX, endY, ink, width = 2) {
  path(ctx, [['moveTo', x, y], ['lineTo', endX, endY]], null, ink, width);
}

function type(ctx, message, x, baseline, size, ink = color.white, style = 'mono', weight = 500) {
  ctx.font = weight + ' ' + size + 'px "Lesson ' + (style === 'sans' ? 'Sans' : 'Mono') + '"';
  ctx.textAlign = 'left';
  ctx.fillStyle = ink;
  ctx.fillText(message, x, baseline);
  return ctx.measureText(message).width;
}

function layer(ctx, opacity, draw) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  draw();
  ctx.restore();
}

// The wide crop keeps the three answer addresses fixed as the build terminal enters its readout.
function terminal(ctx) {
  const desk = ctx.createLinearGradient(0, 0, 1850, 1080);
  desk.addColorStop(0, '#d4aec2');
  desk.addColorStop(0.53, '#e4b9a7');
  desk.addColorStop(1, '#a67986');
  ctx.fillStyle = desk;
  ctx.fillRect(0, 0, 1920, 1080);

  const caseInk = ctx.createLinearGradient(60, 0, 1895, 870);
  caseInk.addColorStop(0, '#ffdcbb');
  caseInk.addColorStop(0.32, '#f7bea7');
  caseInk.addColorStop(0.79, '#dda79d');
  caseInk.addColorStop(1, '#ba848c');
  ctx.save();
  ctx.shadowColor = '#57394e';
  ctx.shadowBlur = 31;
  ctx.shadowOffsetY = 14;
  box(ctx, 31, -40, 1858, 1063, 100, caseInk);
  ctx.restore();
  box(ctx, 40, -37, 1837, 1043, 99, caseInk);
  const bevel = ctx.createLinearGradient(0, 40, 0, 945);
  bevel.addColorStop(0, '#8c6278');
  bevel.addColorStop(0.16, '#b38390');
  bevel.addColorStop(0.81, '#cd9da2');
  bevel.addColorStop(1, '#ffd7ba');
  box(ctx, 71, 25, 1778, 917, 81, bevel);
  box(ctx, 88, 43, 1744, 879, 65, '#3a314a');
  const glass = ctx.createRadialGradient(590, 385, 80, 930, 470, 1210);
  glass.addColorStop(0, '#303e84');
  glass.addColorStop(0.6, '#26326f');
  glass.addColorStop(1, '#19214d');
  box(ctx, 99, 52, 1722, 859, 56, glass);

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(99, 52, 1722, 859, 56);
  ctx.clip();
  ctx.fillStyle = 'rgba(14,19,58,0.12)';
  for (let y = 55; y < 911; y += 6) ctx.fillRect(99, y, 1722, 1);
  const reflection = ctx.createLinearGradient(91, 55, 700, 905);
  reflection.addColorStop(0, 'rgba(197,215,255,0.12)');
  reflection.addColorStop(0.62, 'rgba(197,215,255,0)');
  ctx.fillStyle = reflection;
  ctx.fillRect(99, 52, 1722, 859);
  ctx.restore();

  for (let i = 0; i < 10; i++) {
    const x = 1490 + 25 * i;
    box(ctx, x, 955, 10, 28, 5, '#e8bab0');
    box(ctx, x, 953, 9, 27, 4, '#a7757e');
    box(ctx, x + 1, 954, 6, 22, 3, '#996b77');
  }
  box(ctx, 165, 961, 30, 10, 5, '#b48784');
  box(ctx, 168, 963, 24, 5, 2.5, '#fff0d4');
}

function reply(ctx, elapsed, dock) {
  const x0 = 1049, y0 = mix(394, 123, dock), pitch = mix(32, 5.8, dock);
  const print = clamp((elapsed - 0.18) / 0.72);
  for (const [n, digit] of [...'401'].entries()) {
    glyphs[digit].forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const lit = row[x] === '1' && print > 0 && (n * 6 + x) / 17 <= print;
        ctx.fillStyle = lit ? color.amber : 'rgba(255,208,137,0.056)';
        ctx.fillRect(x0 + (n * 6 + x) * pitch, y0 + y * pitch, pitch * 0.88, pitch * 0.88);
      }
    });
  }
  layer(ctx, (1 - dock) * ease(clamp((elapsed - 0.58) / 0.45)), () => {
    type(ctx, 'Unauthorized', x0, 694, 58, color.amber, 'sans', 700);
    type(ctx, 'Tests skipped', x0 + 1, 754, 37, color.dim);
  });
}

function marker(ctx, x, y, amount, decision = false, ink = color.aqua) {
  layer(ctx, amount, () => {
    if (decision) {
      path(ctx, [['moveTo', x, y - 15], ['lineTo', x + 15, y],
        ['lineTo', x, y + 15], ['lineTo', x - 15, y], ['closePath']], color.amber);
    } else {
      path(ctx, [['moveTo', x - 6, y - 16], ['lineTo', x + 7, y - 16],
        ['lineTo', x + 7, y + 16], ['lineTo', x - 6, y + 16]], null, ink, 6);
    }
  });
}

// Four phosphor segments show two units. Each lit segment contributes one half.
function coordinate(ctx, x, y, value, ink) {
  type(ctx, String(value), x, y + 16, 50, ink, 'mono', 600);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i < Math.round(value * 2) ? ink : 'rgba(199,212,255,0.11)';
    ctx.fillRect(x + 112 + 19 * i, y - 24, 13, 43);
  }
}

function draw(ctx, clock) {
  const cue = (beat, phrase, duration) => clock.index === beat
    ? ease(clock.reveal(phrase, duration)) : Number(clock.index > beat);
  const marks = cue(1, 'These marks', 0.95);
  const decisionMark = cue(1, "one more mark", 0.45);
  const open = cue(2, 'a hidden vector', 0.9);
  const keys = cue(2, "Kev's pointer head", 0.75);
  const showQuery = cue(2, 'and the decision vector', 0.65);
  const apply = cue(3, 'Watch the second column', 1.15);
  const sum = cue(3, 'Now add across each row', 0.85);
  const scale = cue(4, 'divides each sum', 1.0);
  const share = cue(5, 'softmax turns these scores', 1.0);
  const pick = cue(5, 'Follow its marker back', 1.15);

  terminal(ctx);
  type(ctx, 'RUN-842', 174, 160, 48, color.white, 'mono', 700);
  type(ctx, '/  build triage', 415, 160, 40, color.dim);
  layer(ctx, open, () => type(ctx, '/  image pull failed', 1180, 157, 38, color.amber));
  line(ctx, 174, 208, 1744, 208, color.line);
  type(ctx, 'Investigate first?', 172, 315, 67, color.white, 'sans', 600);

  layer(ctx, 1 - open, () => {
    type(ctx, 'Image pull', 1048, 305, 47, color.dim, 'sans', 600);
  });
  reply(ctx, clock.seconds, open);

  // The return highlight travels from the winning share back to the caller's option.
  const winnerY = rows[result.winner];
  if (pick > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(mix(1748, 164, pick), winnerY - 54, 1584 * pick + 1, 108);
    ctx.clip();
    box(ctx, 164, winnerY - 54, 1584, 108, 9, color.aqua);
    ctx.restore();
  }

  const keyX = 1048, otherX = 1435;
  const sumX = mix((keyX + otherX) / 2, keyX, scale);
  const leaderEnd = mix(keyX, sumX, sum) - 42;
  for (const [i, choice] of choices.entries()) {
    const y = rows[i];
    const winner = i === result.winner;
    const option = (selected) => {
      const ink = selected ? color.deep : color.white;
      const accent = selected ? color.deep : color.dim;
      type(ctx, ids[i], 188, y + 17, 49, accent);
      const w = type(ctx, choice, 275, y + 17, 51, ink, 'sans', 500);
      const mx = 298 + w;
      marker(ctx, mx, y - 2, clamp(marks * 3 - i), false, selected ? color.deep : color.aqua);
      layer(ctx, keys * (1 - pick * Number(winner)), () => {
        line(ctx, mx + 26, y, leaderEnd, y, color.line, 2);
        ctx.fillStyle = color.aqua;
        ctx.fillRect(leaderEnd - 1, y - 3, 6, 6);
      });
    };
    option(false);
    if (winner && pick > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(mix(1748, 164, pick), y - 54, 1584 * pick + 1, 108);
      ctx.clip();
      option(true);
      ctx.restore();
    }
    line(ctx, 175, y + 72, 930, y + 72, 'rgba(197,209,255,0.19)');
  }

  layer(ctx, keys * (1 - clamp(sum / 0.52)), () => {
    layer(ctx, 1 - clamp(apply / 0.28), () => type(ctx, 'Option keys', keyX, 307, 43, color.aqua));
    layer(ctx, clamp((apply - 0.28) / 0.3), () => {
      type(ctx, '× 1', keyX, 307, 47, color.aqua);
      type(ctx, '× 0', otherX, 307, 47, color.amber);
    });
    const scanY = mix(lastRow - 43, rows[0] - 60, apply);
    if (apply > 0 && apply < 1) {
      line(ctx, otherX - 14, scanY, otherX + 198, scanY, color.amber, 5);
    }
    rows.forEach((y, i) => {
      const offset = sum * (otherX - keyX) / 2;
      const crossed = clamp((y - scanY + 16) / 32);
      coordinate(ctx, keyX + offset, y, vectors[i][0], color.aqua);
      layer(ctx, 1 - crossed, () => coordinate(ctx, otherX - offset, y, vectors[i][1], color.aqua));
      layer(ctx, crossed, () => {
        coordinate(ctx, otherX - offset, y, result.products[i][1], color.dim);
        type(ctx, '+', keyX + 276, y + 13, 40, color.dim);
      });
    });
  });

  const replaceSums = clamp(share / 0.35);
  layer(ctx, clamp((sum - 0.42) / 0.58) * (1 - replaceSums), () => {
    type(ctx, 'Dot product', sumX - 6, 307, 43, color.dim);
    rows.forEach((y, i) => type(ctx, String(result.sums[i]), sumX, y + 19, 65));
  });
  const printScore = clamp((scale - 0.52) / 0.48);
  layer(ctx, printScore * (1 - replaceSums), () => {
    rows.forEach((y) => type(ctx, '÷ √2', keyX + 150, y + 11, 39, color.dim));
  });

  const moveScore = ease(clamp((share - 0.18) / 0.65));
  const scoreX = mix(otherX, keyX, moveScore);
  const printShare = clamp((share - 0.74) / 0.26);
  layer(ctx, printScore, () => {
    type(ctx, 'Score', scoreX, 307, 44, color.dim);
    layer(ctx, printShare, () => type(ctx, 'Share', otherX, 307, 43, color.aqua));
    rows.forEach((y, i) => {
      const isSelected = i === result.winner;
      const numbers = (selected) => {
        type(ctx, result.logits[i].toFixed(3), scoreX, y + 16, 53, selected ? color.deep : color.white);
        layer(ctx, printShare, () => {
          type(ctx, (result.shares[i] * 100).toFixed(1) + '%', otherX, y + 21, 66,
            selected ? color.deep : color.aqua, 'mono', 700);
        });
      };
      numbers(false);
      if (isSelected && pick > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(mix(1748, 164, pick), y - 54, 1584 * pick + 1, 108);
        ctx.clip();
        numbers(true);
        ctx.restore();
      }
    });
  });

  layer(ctx, decisionMark * (1 - sum), () => {
    marker(ctx, 203, lastRow - 2, 1, true);
    type(ctx, 'Decision marker', 275, lastRow + 15, 44, color.amber, 'sans');
    layer(ctx, showQuery, () => {
      type(ctx, 'query', 800, lastRow + 13, 35, color.amber);
      coordinate(ctx, keyX, lastRow, query[0], color.amber);
      coordinate(ctx, otherX, lastRow, query[1], color.amber);
    });
  });
}

function check() {
  assert.deepEqual(result.products, [[0, 0], [2, 0], [0.5, 0]]);
  assert.deepEqual(result.sums, [0, 2, 0.5]);
  assert.deepEqual(result.logits.map((z) => z.toFixed(3)), ['0.000', '1.414', '0.354']);
  assert.deepEqual(result.shares.map((p) => (100 * p).toFixed(1)), ['15.3', '62.9', '21.8']);
  assert.ok(Math.abs(result.shares.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert.equal(choices[result.winner], 'Registry authentication');
  assert.equal(choices[readMarkers(vectors, [0, 1]).winner], 'Test regression');
}

export default { title: 'Which option does Kev point to?', beats, draw, check };
