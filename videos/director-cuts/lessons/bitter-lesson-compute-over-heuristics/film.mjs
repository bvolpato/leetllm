import assert from 'node:assert/strict';

const beats = [
  {
    id: 'your-turn',
    say: "You're playing blue. Watch where the computer drops its cream counter. Where would you put yours to make four in a row?",
    hold: 2.1,
  },
  {
    id: 'the-open-hole',
    say: "Right on top of those three. Blue wins in column B. How did the computer leave that hole open?",
    hold: 1,
  },
  {
    id: 'the-middle',
    say: "Back up two moves. The computer follows a house rule. Play the middle whenever it's open. Give two processors that same check. They can work side by side, and both come back with D.",
    hold: 1.2,
  },
  {
    id: 'try-the-reply',
    say: "Let's spend that extra work on search. Try D on a copy of the board. This time, let the computer play for blue as well. It sees the fourth blue counter before it commits to D.",
    hold: 1.2,
  },
  {
    id: 'try-the-block',
    say: "Try B instead. Watch where blue would land in that column now. There's a cream counter in the way. Give blue a turn in each of the other columns. Can any of those replies finish four?",
    hold: 1.5,
  },
  {
    id: 'play-for-real',
    say: "Now play for real. Cream takes B. This is the search side of Rich Sutton's bitter lesson. With more computation, the same program can look further ahead. One reply bought cream another turn.",
    hold: 2.8,
  },
];

const columns = 'ABCDEFG';
const middle = 3;
const block = 1;
const cream = 'cream';
const blue = 'blue';

function drop(board, column, side) {
  if (column < 0 || column >= board.length || board[column].length >= 6) {
    throw new Error('Counter cannot land in that column.');
  }
  return board.map((stack, i) => i === column ? [...stack, side] : stack);
}

function wins(board, side) {
  return board.some((stack, x) => stack.some((piece, y) =>
    piece === side && [[0, 1], [1, 0], [1, 1], [1, -1]].some(([dx, dy]) =>
      [1, 2, 3].every(i => board[x + i * dx]?.[y + i * dy] === side))));
}

const start = [block, middle, block, middle, block].reduce(
  (board, col, i) => drop(board, col, i % 2 ? cream : blue),
  Array.from(columns, () => []),
);

function houseMove(board) {
  return board[middle].length < 6 ? middle : board.findIndex(stack => stack.length < 6);
}

function tryMove(column) {
  const afterCream = drop(start, column, cream);
  const replies = [];
  if (!wins(afterCream, cream)) {
    for (let col = 0; col < columns.length; col++) {
      if (afterCream[col].length < 6) {
        replies.push({ col, win: wins(drop(afterCream, col, blue), blue) });
      }
    }
  }
  return { column, afterCream, replies, safe: !replies.some(reply => reply.win) };
}

const choices = Array.from(columns, (_, i) => tryMove(i));
const house = choices[houseMove(start)];
const defense = choices.find(move => move.safe);
const answer = house.replies.find(reply => reply.win).col;
const otherReplies = defense.replies.map(reply => reply.col).filter(col => col !== answer);

function check() {
  assert.equal(wins(start, blue) || wins(start, cream), false);
  assert.equal(start[block].length, 3);
  assert.equal(start[middle].length, 2);
  assert.equal(houseMove(start), middle);
  assert.equal(houseMove(start.map(stack => [...stack])), middle);
  assert.deepEqual(house.replies.filter(reply => reply.win).map(reply => reply.col), [block]);
  assert.deepEqual(choices.filter(move => move.safe).map(move => move.column), [block]);
  assert.equal(wins(defense.afterCream, cream), false);
  assert.equal(defense.replies.length, 7);
  assert.equal(defense.replies.some(reply => reply.win), false);
  assert.deepEqual(drop(defense.afterCream, block, blue)[block], [blue, blue, blue, cream, blue]);
}

const clamp = v => Math.min(1, Math.max(0, v));
const ease = v => { const p = clamp(v); return p * p * (3 - 2 * p); };
const xAt = col => 92 + col * 134;
const yAt = row => 775 - row * 134;
const hole = 51;
const boardW = 988;
const boardH = 860;
const ink = '#182c46';

function rect(g, x, y, w, h, r, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

function oval(g, x, y, rx, ry, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

function line(g, points, color, width) {
  g.beginPath();
  points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.stroke();
}

function label(g, value, x, y, size, family = 'Sans', color = ink, weight = 500) {
  g.font = `${weight} ${size}px "Lesson ${family}"`;
  g.fillStyle = color;
  g.fillText(value, x, y);
}

function wash(g, x1, y1, x2, y2, ...colors) {
  const gradient = g.createLinearGradient(x1, y1, x2, y2);
  colors.forEach((value, i) => gradient.addColorStop(i / (colors.length - 1), value));
  return gradient;
}

function room(g) {
  g.fillStyle = wash(g, 0, 0, 1720, 960, '#c1c6d5', '#b3b9cf', '#929bb4');
  g.fillRect(0, 0, 1920, 1080);
  // The window light continues through the empty holes.
  g.fillStyle = '#faefdc48';
  g.beginPath();
  g.moveTo(0, 0); g.lineTo(790, 0); g.lineTo(81, 794); g.lineTo(0, 794); g.fill();
  g.fillStyle = wash(g, 0, 811, 0, 1080, '#b97b5c', '#dfac84', '#e9bc97');
  g.fillRect(0, 811, 1920, 269);
  g.save();
  g.beginPath(); g.rect(0, 813, 1920, 267); g.clip();
  for (let i = 0; i < 49; i++) {
    const x = ((i * 217) % 2380) - 300;
    const y = 820 + (i * 71) % 260;
    g.strokeStyle = i % 3 ? '#9d614620' : '#fff1d038';
    g.lineWidth = 1 + i % 3;
    g.beginPath(); g.moveTo(x, y);
    g.bezierCurveTo(x + 150, y - 14, x + 245, y + 8, x + 400, y - 12);
    g.stroke();
  }
  g.restore();
  oval(g, 754, 990, 670, 26, '#855a493d');
  oval(g, 729, 982, 557, 16, '#794b3735');
  oval(g, 1484, 959, 315, 21, '#855a493b');
}

function counter(g, x, y, side, r, trial = false) {
  const dark = side === blue;
  const outer = dark ? '#142b65' : '#b8a57c';
  const light = dark ? '#697ec4' : '#fff8d4';
  oval(g, x, y + 2, r, r, outer);
  const resin = g.createRadialGradient(x - r * .35, y - r * .45, 1, x, y, r);
  resin.addColorStop(0, dark ? '#4965ad' : '#fff1b5');
  resin.addColorStop(.81, dark ? '#2c458c' : '#f3d993');
  resin.addColorStop(1, dark ? '#192e68' : '#c9a96e');
  oval(g, x, y, r - 3, r - 3, resin);
  g.strokeStyle = dark ? '#172c6e' : '#c6a86e';
  g.lineWidth = dark ? 2.8 : 4;
  const ring = r * .64;
  g.beginPath(); g.arc(x, y, ring, 0, 2 * Math.PI); g.stroke();
  g.strokeStyle = light;
  g.beginPath(); g.arc(x, y + 1.8, ring - 1, .08, Math.PI * 1.12); g.stroke();
  if (trial) {
    g.save();
    g.setLineDash([7, 8]);
    g.lineWidth = 3;
    g.strokeStyle = dark ? '#d8deef' : '#8c795e';
    g.beginPath(); g.arc(x, y, r * .48, 0, Math.PI * 2); g.stroke();
    g.restore();
  }
}

function foot(g, x) {
  g.fillStyle = '#863425';
  g.beginPath(); g.moveTo(x + 11, 822); g.lineTo(x + 67, 820);
  g.lineTo(x + 84, 885); g.lineTo(x + 60, 898); g.lineTo(x - 36, 898); g.closePath(); g.fill();
  g.fillStyle = wash(g, x, 830, x + 45, 904, '#e16346', '#cc4931');
  g.beginPath(); g.moveTo(x + 8, 830); g.lineTo(x + 46, 830);
  g.lineTo(x + 59, 889); g.lineTo(x - 35, 889); g.closePath(); g.fill();
  line(g, [[x - 31, 889], [x + 57, 889]], '#ef926d', 3);
}

function face(g) {
  // A single perforated face occludes each falling counter between holes.
  g.beginPath();
  g.roundRect(0, 0, boardW, boardH, 29);
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row < 6; row++) {
      const x = xAt(col), y = yAt(row);
      g.moveTo(x + hole, y); g.arc(x, y, hole, 0, 2 * Math.PI);
    }
  }
  g.fillStyle = wash(g, 20, 0, 880, 990, '#f27651', '#db553b', '#c13e2e');
  g.fill('evenodd');
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row < 6; row++) {
      const x = xAt(col), y = yAt(row);
      g.lineWidth = 4;
      g.strokeStyle = '#8c382d';
      g.beginPath(); g.arc(x, y, hole + 1, Math.PI * 1.03, Math.PI * 1.86); g.stroke();
      g.strokeStyle = '#fa9169';
      g.beginPath(); g.arc(x, y, hole + 1.4, .16, Math.PI * .9); g.stroke();
    }
  }
  line(g, [[32, 6], [boardW - 31, 6]], '#ffa983', 4);
  line(g, [[29, boardH - 6], [boardW - 29, boardH - 6]], '#a7392a', 5);
  g.textAlign = 'center';
  for (let col = 0; col < 7; col++) {
    label(g, columns[col], xAt(col), 42, 38, 'Sans', '#54251f', 700);
  }
  g.textAlign = 'left';
}

function board(g, pieces, winningInk) {
  g.save();
  g.translate(151, 81);
  g.transform(1, .014, -.018, 1, 0, 0);
  foot(g, 40); foot(g, 920);
  // Side wall and the thinner, shadowed tunnel behind every aperture.
  g.fillStyle = '#993c2e';
  g.beginPath(); g.moveTo(boardW - 25, 0); g.lineTo(boardW + 14, 9);
  g.lineTo(boardW + 17, boardH - 23); g.quadraticCurveTo(boardW + 8, boardH + 8, boardW - 27, boardH);
  g.closePath(); g.fill();
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row < 6; row++) {
      const x = xAt(col), y = yAt(row);
      g.save();
      g.beginPath(); g.arc(x, y, hole + 3, 0, Math.PI * 2); g.clip();
      g.lineWidth = 14; g.strokeStyle = '#844839ba';
      g.beginPath(); g.arc(x + 6, y + 6, hole, 0, Math.PI * 2); g.stroke();
      g.restore();
    }
    for (const [row, side] of start[col].entries()) counter(g, xAt(col), yAt(row), side, 60);
  }
  pieces.forEach(p => counter(g, xAt(p.col), p.y, p.side, 60, p.trial));
  face(g);
  if (winningInk > 0) {
    const x = xAt(answer), bottom = yAt(0), end = yAt(start[answer].length);
    g.save(); g.globalAlpha = .87;
    line(g, [[x, bottom + 9], [x, bottom + 9 + (end - bottom - 18) * winningInk]], '#fff7d6', 6);
    g.restore();
  }
  g.restore();
}

function moving(col, row, side, fraction, trial = false) {
  if (fraction <= 0) return null;
  const p = clamp(fraction), landing = yAt(row);
  const impact = .82;
  const y = p < impact
    ? -58 + (landing + 58) * (p / impact) ** 2
    : landing - 11 * Math.sin(Math.PI * (p - impact) / (1 - impact));
  return { col, y, side, trial };
}

function notebook(g, clock, state) {
  g.save();
  g.translate(1215, 309);
  g.transform(1, -.055, .038, 1, 0, 0);
  const w = 540, h = 652;
  rect(g, 12, 11, w + 5, h + 4, 13, '#62524b');
  rect(g, 8, 5, w + 4, h + 5, 12, '#a98b6f');
  rect(g, 4, 3, w, h + 3, 10, '#ddc8a1');
  rect(g, 0, 0, w, h, 9, wash(g, 0, 0, w, h, '#fff7df', '#f1e6c9', '#e5d6b4'));
  for (let x = 34; x < w - 18; x += 47) {
    oval(g, x + 2, 23, 6, 8, '#817461');
    g.strokeStyle = '#514d47'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(x + 2, 23); g.bezierCurveTo(x + 2, -16, x - 10, -18, x - 13, -4); g.stroke();
    g.strokeStyle = '#e5ddc8'; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(x + 1, 17); g.quadraticCurveTo(x - 1, -15, x - 10, -8); g.stroke();
  }
  const heading = text => {
    label(g, text, 45, 114, 53, 'Serif', ink);
    line(g, [[45, 139], [w - 46, 139]], '#897c6566', 2);
  };
  function rulePage() {
    heading('House rule');
    label(g, 'Play the middle', 43, 238, 55, 'Serif');
    label(g, 'if it’s open.', 45, 302, 55, 'Serif');
    for (const [i, alpha] of state.processors.entries()) {
      if (alpha <= 0) continue;
      const y = 426 + i * 95;
      g.save(); g.globalAlpha = alpha;
      label(g, 'Processor ' + (i + 1), 48, y, 38);
      line(g, [[285, y - 14], [357, y - 14], [346, y - 23]], '#666b70', 3);
      line(g, [[357, y - 14], [346, y - 5]], '#666b70', 3);
      label(g, columns[house.column], 388, y + 5, 55, 'Serif');
      g.restore();
    }
  }
  function trialPage() {
    heading('One reply ahead');
    const rows = [
      { move: house, show: state.first, result: state.loss, note: 'Blue wins in ' + columns[answer] },
      { move: defense, show: state.second, result: state.safe, note: 'No winning reply' },
    ];
    rows.forEach(({ move, show, result, note }, i) => {
      if (show <= 0) return;
      const y = 239 + i * 193;
      g.save(); g.globalAlpha = show;
      counter(g, 72, y - 16, cream, 24, true);
      label(g, 'Try ' + columns[move.column], 115, y, 56, 'Serif');
      g.globalAlpha = result * show;
      label(g, note, 105, y + 66, 46);
      g.restore();
    });
    if (state.visits > 0) {
      const order = [answer, ...otherReplies];
      const tried = order.slice(0, state.visits);
      for (let i = 0; i < 7; i++) {
        const x = 67 + 67 * i;
        label(g, columns[i], x - 11, 587, 38, 'Mono', tried.includes(i) ? ink : '#8c806d');
        if (tried.includes(i)) line(g, [[x - 9, 601], [x + 10, 601]], '#3d599b', 4);
      }
    }
  }
  if (clock.index < 3) {
    rulePage();
  } else {
    trialPage();
    if (clock.index === 3 && clock.elapsed < .52) {
      const flip = ease(clock.elapsed / .52);
      g.save(); g.scale(1, 1 - flip);
      rect(g, 0, 31, w, h - 31, 9, '#f8edcf');
      rulePage(); g.restore();
    }
  }
  g.restore();
}

function draw(g, clock) {
  const { index, elapsed } = clock;
  const t = (delay, duration) => clamp((elapsed - delay) / duration);
  const cue = (phrase, duration) => clock.reveal(phrase, duration);
  const state = { first: 0, second: 0, loss: 0, safe: 0, visits: 0, processors: [0, 0] };
  const pieces = [];
  function add(column, row, side, fraction, trial) {
    const p = moving(column, row, side, fraction, trial);
    if (p) pieces.push(p);
  }
  let stripe = 0;
  const d = house.column, b = defense.column;
  if (index === 0) {
    add(d, start[d].length, cream, .27 + .73 * t(0, 1.05));
  } else if (index === 1) {
    add(d, start[d].length, cream, 1);
    add(answer, start[answer].length, blue, t(0, .95));
    stripe = ease(t(.93, .65));
  } else if (index === 2) {
    add(d, start[d].length, cream, 1 - t(.68, .78));
    add(answer, start[answer].length, blue, 1 - t(.05, .76));
    stripe = 1 - ease(t(0, .18));
    state.processors = [cue('Give two processors', .5), cue('side by side', .5)];
  } else if (index === 3) {
    state.processors = [1, 1];
    state.first = cue('Try D', .85);
    const reply = cue('let the computer', .95);
    add(d, start[d].length, cream, state.first, true);
    add(answer, house.afterCream[answer].length, blue, reply, true);
    stripe = ease(clamp((reply - .82) / .18));
    state.loss = stripe;
  } else if (index === 4) {
    state.first = state.loss = 1;
    const lift = 1 - t(0, .75);
    add(d, start[d].length, cream, lift, true);
    add(answer, house.afterCream[answer].length, blue, lift, true);
    stripe = 1 - ease(t(0, .2));
    state.second = t(.8, .83);
    add(b, start[b].length, cream, state.second, true);
    const reply = cue('blue would land', .85);
    const sweep = cue('each of the other columns', 4.5);
    if (sweep === 0) {
      add(answer, defense.afterCream[answer].length, blue, reply, true);
    } else if (sweep < 1) {
      const phase = sweep * otherReplies.length;
      const col = otherReplies[Math.floor(phase)];
      add(col, defense.afterCream[col].length, blue, clamp((phase % 1) * 1.7), true);
    }
    state.visits = (reply >= .85 ? 1 : 0) + Math.floor(sweep * otherReplies.length);
    state.safe = sweep === 1 ? 1 : 0;
  } else {
    state.first = state.second = state.loss = state.safe = 1;
    state.visits = defense.replies.length;
    add(b, start[b].length, cream, 1 - t(0, .45), true);
    add(b, start[b].length, cream, t(.48, .98));
  }
  room(g);
  board(g, pieces, stripe);
  notebook(g, clock, state);
}

export default { title: 'The Bitter Lesson: One Reply Ahead', beats, draw, check };
