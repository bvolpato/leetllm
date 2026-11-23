import { smoothstep } from 'vizmatic';
import { C, clamp, mix } from './paint.mjs';
import { equipmentPassages, packedEvidence, lockerMs } from './evidence.mjs';

const dark = '#0f2839',
  metal = '#416277',
  rim = '#7793a0',
  light = '#e6d2ac';
function locker(p) {
  p.box(0, 0, 1920, 1080, dark);
  // The light falls inside one open locker. Its tray stays beneath the camera.
  p.box(0, 0, 821, 1080, '#233f50');
  p.box(46, 175, 707, 778, metal);
  p.box(68, 199, 661, 731, '#102938');
  p.box(86, 218, 625, 693, '#314d5b');
  p.path(
    [
      [86, 218],
      [173, 272],
      [173, 765],
      [86, 908],
    ],
    C.ink,
    3,
    '#263d4c',
  );
  p.path(
    [
      [711, 218],
      [628, 272],
      [628, 765],
      [711, 908],
    ],
    C.ink,
    3,
    '#233c4d',
  );
  p.box(173, 272, 455, 493, '#3b5560');
  p.path(
    [
      [173, 765],
      [628, 765],
      [711, 908],
      [86, 908],
    ],
    C.ink,
    3,
    '#789198',
  );
  p.path(
    [
      [158, 785],
      [624, 785],
      [679, 879],
      [108, 879],
    ],
    C.ink,
    3,
    '#a6b4ad',
  );
  for (let i = 0; i < 7; i++) p.line(165, 800 + i * 9, 623 + i * 3, 800 + i * 9, '#8e9f9a', 3);
  p.box(257, 231, 286, 17, '#dbbd7f');
  p.box(280, 248, 241, 5, '#e9d6a5');
  for (const x of [59, 739]) for (const y of [185, 941]) p.dot(x, y, 5, rim);
  p.text('OVERNIGHT RETURNS', 407, 125, 45, light, 'Mono', 'center');
  p.box(267, 969, 272, 70, '#203544');
  p.mono('LOCKER  02', 401, 1018, 31, light, 'center');
}
function camera(p, release) {
  const x = 160,
    y = 404;
  const c = p.c;
  c.save();
  c.translate(x, y);
  // The brass-sided battery remains visible through a cutaway in the grip.
  p.path(
    [
      [14, 84],
      [102, 84],
      [132, 40],
      [255, 40],
      [293, 84],
      [421, 84],
      [456, 115],
      [446, 298],
      [12, 298],
    ],
    C.ink,
    7,
    '#232e37',
  );
  p.box(25, 105, 414, 48, '#a9b7b6');
  p.box(27, 157, 405, 128, '#414f50');
  for (let i = 0; i < 14; i++) p.line(30 + i * 24, 165, 18 + i * 24, 280, '#52615e', 3);
  p.box(32, 59, 72, 25, '#758b8c');
  p.box(43, 44, 51, 16, '#c2ccc0');
  p.path(
    [
      [133, 58],
      [248, 58],
      [270, 86],
      [116, 86],
    ],
    C.ink,
    2,
    '#a3afac',
  );
  p.box(169, 60, 53, 17, '#263e4b');
  for (const [r, col] of [
    [111, '#192a33'],
    [99, '#74888a'],
    [92, '#283c45'],
    [79, '#697a77'],
    [71, '#243947'],
    [59, '#344e5b'],
    [49, '#223540'],
  ])
    p.dot(192, 195, r, col);
  for (let k = 0; k < 32; k++) {
    const a = (k * Math.PI) / 16;
    p.line(
      192 + 101 * Math.cos(a),
      195 + 101 * Math.sin(a),
      192 + 109 * Math.cos(a),
      195 + 109 * Math.sin(a),
      '#a4ada2',
      2,
    );
  }
  p.line(151, 211, 229, 178, '#556e77', 6);
  p.box(341, 106, 83, 194, '#162b36');
  p.box(351, 118, 62, 161, '#50636b');
  const by = 126 + release * 207,
    bx = 355 + release * 36;
  p.box(bx + 3, by + 7, 60, 156, '#182c36');
  p.box(bx, by, 60, 150, '#d19a47');
  p.box(bx + 5, by + 10, 50, 102, '#edcc80');
  p.box(bx + 8, by - 6, 11, 9, '#e6d18f');
  p.box(bx + 37, by - 6, 11, 9, '#e6d18f');
  p.text('+', bx + 30, by + 48, 33, C.ink, 'Mono', 'center');
  p.text('−', bx + 30, by + 97, 29, C.ink, 'Mono', 'center');
  c.restore();
}
function ranked(p, depth, showScores) {
  const x = 910;
  p.mono(showScores ? 'PASSAGES IN SCORE ORDER' : 'SEARCH ORDER', x, 289, 32, C.brass);
  const list = showScores
    ? [...equipmentPassages].sort((a, b) => b.score - a.score)
    : equipmentPassages;
  list.forEach((row, i) => {
    const y = 381 + i * 110,
      inDepth = row.rank <= depth,
      col = inDepth ? light : '#8ba1aa';
    p.mono(showScores ? row.score : row.rank, x, y, 38, col);
    p.text(row.label, x + 104, y, 48, col, 'Serif');
    if (showScores)
      p.mono(
        row.score >= 5 ? 'eligible' : 'below 5',
        1804,
        y,
        30,
        row.score >= 5 ? '#b3d9c3' : rim,
        'right',
      );
    else if (row.required) p.mono('required', 1806, y, 30, '#f0c57f', 'right');
    p.line(x, y + 31, 1810, y + 31, '#3b5765', 2);
  });
  if (!showScores)
    p.line(x - 13, 381 + (depth - 1) * 110 + 41, 1811, 381 + (depth - 1) * 110 + 41, '#edbd6d', 5);
}
const initialBudget = 40;
const initialPacking = packedEvidence(equipmentPassages.length, initialBudget);
const expandedBudget = initialPacking.total;
const expandedPacking = packedEvidence(equipmentPassages.length, expandedBudget);

function afterPhrase(p, beat, phrase, duration = 0) {
  if (p.b !== beat) return Number(p.b > beat);
  const elapsed = p.clock.elapsed - p.clock.wordCue(phrase).end;
  return duration ? smoothstep(clamp(elapsed / duration)) : Number(elapsed >= -1e-9);
}

function capacity(p) {
  const [member, instructions] = initialPacking.eligible;
  const x = 916,
    unit = 19.2,
    railY = 475,
    compareY = 642,
    barHeight = 100;
  const memberKnown = afterPhrase(p, 4, 'The member rule takes eighteen');
  const lockerKnown = afterPhrase(p, 4, 'the locker instructions take twenty-six');
  const memberMove = afterPhrase(p, 5, 'Only the member rule fits', 0.55);
  const freeKnown = afterPhrase(p, 5, 'Eighteen tokens leave twenty-two free');
  const alignLocker = afterPhrase(p, 5, 'The locker instructions need twenty-six', 0.5);
  const totalKnown = afterPhrase(p, 5, 'Together the rules need forty-four tokens');
  const shortageKnown = afterPhrase(p, 5, 'four tokens short');
  const widen = afterPhrase(p, 6, 'That reserves forty-four for passages', 0.65);
  const packLocker = afterPhrase(p, 6, 'Now the two whole passages fit', 0.6);
  const budget = Math.round(mix(initialBudget, expandedBudget, widen));
  const edge = x + unit * budget;
  const shortage = expandedBudget - budget;

  p.text('Passage allowance', x, 294, 55, light, 'Serif');
  p.mono(budget + ' tokens   /   2 slots', x, 372, 42, '#b5d1d2');
  p.mono('PACK WHOLE PASSAGES', x, 437, 34, '#a9c3c6');
  p.box(x, railY, unit * budget, barHeight, '#294350', rim, 3);

  const bar = (label, tokens, startX, top, color, overhang = 0) => {
    p.box(startX + 2, top + 2, unit * tokens - 4, barHeight - 4, color);
    if (overhang > 0) p.box(edge, top + 2, unit * overhang - 2, barHeight - 4, '#e8a891');
    p.text(label + ' · ' + tokens, startX + 19, top + 64, 46, C.ink, 'Serif');
  };
  if (memberKnown) bar('Member', member.tokens, x, mix(compareY, railY, memberMove), '#b4d1c3');
  if (lockerKnown) {
    const startX = x + unit * member.tokens * alignLocker;
    const top = mix(mix(compareY + 112, compareY, alignLocker), railY, packLocker);
    bar('Locker', instructions.tokens, startX, top, '#ead4a2', alignLocker === 1 ? shortage : 0);
  }

  const compareAtEdge = alignLocker === 1 && packLocker === 0;
  const lineBottom = (compareAtEdge ? compareY : railY) + barHeight + 16;
  p.line(edge, railY - 16, edge, lineBottom, '#f0bf70', 6);
  if (freeKnown && packLocker === 0)
    p.mono(
      budget - initialPacking.used + ' free',
      x + unit * member.tokens + 23,
      railY + 64,
      39,
      light,
    );
  if (packLocker === 1) {
    p.mono('PACKED  ' + expandedPacking.used + ' / ' + budget + ' TOKENS', x, 696, 38, '#b4d1c3');
  } else if (totalKnown && packLocker === 0) {
    p.mono(expandedBudget + ' tokens needed', x, 856, 37, light);
    if (shortageKnown && shortage > 0)
      p.mono(
        shortage + (shortage === 1 ? ' token short' : ' tokens short'),
        1813,
        856,
        37,
        '#e8a891',
        'right',
      );
  }
}
export function overnight(p) {
  locker(p);
  const removed = p.at(8, 'Slide it out', 1.65);
  camera(p, removed);
  p.mono('CAMERA RETURN   /   AFTER CLOSING', 911, 109, 32, '#a9c3c6');
  p.line(909, 143, 1818, 143, '#486270', 2);
  const depth = p.at(2, 'That brings in') ? 5 : 4;
  if (p.b <= 3) {
    ranked(p, depth, p.b === 3);
    if (p.b === 1)
      p.words(
        'What is the smallest depth that admits both required rules?',
        911,
        950,
        894,
        42,
        54,
        light,
      );
    if (p.b === 2)
      p.text(
        '5 + 4 × ' + depth + ' = ' + lockerMs(depth) + ' ms   /   30 ms',
        910,
        953,
        47,
        '#b4d1c3',
        'Serif',
      );
    if (p.b === 3) p.mono('2 slots   /   40 tokens   /   score ≥ 5', 912, 950, 34, '#b4d1c3');
    return;
  }
  if (p.b <= 6) {
    capacity(p);
    return;
  }
  const [member, instructions] = expandedPacking.packed;
  const bodyColor = '#c8d5d1';
  p.mono('IN THE PROMPT    ' + expandedPacking.used + ' / ' + expandedBudget, 910, 228, 36, '#b4d1c3');
  p.text('1   ' + member.label, 910, 312, 52, light, 'Serif');
  p.words(member.text, 910, 379, 875, 44, 53, bodyColor, 'Sans');
  p.line(908, 531, 1813, 531, '#486270', 3);
  p.text('2   ' + instructions.label, 910, 601, 52, light, 'Serif');
  const sentences = instructions.text.split('. ');
  const condition = sentences.pop();
  const lastY = p.words(sentences.join('. ') + '.', 910, 658, 875, 44, 53, bodyColor, 'Sans');
  const highlight = afterPhrase(p, 8, 'Remove the battery first');
  p.text(condition, 910, lastY + 53, 44, highlight ? '#f2ce89' : bodyColor, 'Sans');
  if (removed === 1 && p.at(8, 'Cite the member rule'))
    p.text('Return after closing [1]   ·   Remove battery [2]', 910, 884, 37, bodyColor, 'Sans');
}
