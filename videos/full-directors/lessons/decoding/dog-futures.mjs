import { distribution, forkState } from './fork-state.mjs';
export { checkDogFutures } from './fork-state.mjs';
import { runningHound, sleepingHound } from './hound.mjs';

const paper = '#f7edda';
const ink = '#382f3a';
const runInk = '#a4432d';
const sleepInk = '#315884';

function shadow(c, x, y, width, depth, color) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, width, depth, 0, 0, Math.PI * 2);
  c.fill();
}

function line(c, x, y, endX, endY, width, color) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(endX, endY);
  c.stroke();
}

function type(c, text, x, y, size, color = ink, style = '', face = 'Lesson Serif') {
  c.fillStyle = color;
  c.font = `${style} ${size}px "${face}"`.trim();
  c.fillText(text, x, y);
}

function page(c) {
  c.fillStyle = paper;
  c.fillRect(0, 0, 1920, 1080);
  // Fine stationary fibers give the solid ink a paper ground.
  c.fillStyle = 'rgba(97,73,52,0.07)';
  let seed = 53;
  for (let i = 0; i < 1100; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const x = seed % 1920;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    c.fillRect(x, seed % 1080, 1 + (i % 4), 1);
  }
}

function field(c, x, baseline, width, sleeping) {
  const color = sleeping ? '#c0c8ba' : '#d9b992';
  shadow(c, x, baseline, width, sleeping ? 10 : 6, color);
  const tufts = sleeping ? [[-0.89, 13], [0.91, 18], [0.97, 9]] : [[-0.92, 15], [-0.86, 9], [0.76, 16]];
  for (const [at, rise] of tufts) {
    const a = x + width * at;
    line(c, a, baseline + 1, a - 8, baseline - rise, 3, color);
    line(c, a + 1, baseline + 1, a + 3, baseline - rise * 0.7, 2, color);
  }
}

function dogs(c, run, sleep, leap, breath) {
  if (run) {
    field(c, 470, 625, 340, false);
    c.save();
    c.translate(61, 153);
    c.scale(2.62, 2.62);
    runningHound(c, leap);
    c.restore();
  }
  if (sleep) {
    field(c, 1416, 625, 295, true);
    c.save();
    c.translate(945, 190);
    c.scale(2.84, 2.84);
    sleepingHound(c, breath);
    c.restore();
  }
}

function pencil(c, x, y, angle = -0.61) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.fillStyle = '#dbb47e';
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(25, -8);
  c.lineTo(25, 8);
  c.closePath();
  c.fill();
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(8, -2.8);
  c.lineTo(8, 2.8);
  c.closePath();
  c.fill();
  c.fillStyle = '#60736a';
  c.fillRect(25, -8, 118, 16);
  c.fillStyle = '#8c9a84';
  c.fillRect(25, -7, 118, 5);
  c.fillStyle = '#775343';
  c.fillRect(142, -8, 5, 16);
  c.fillStyle = '#c38e71';
  c.fillRect(147, -7, 12, 14);
  c.restore();
}

function sentence(c, s) {
  type(c, 'The dog', 102, 153, 108);
  const slots = [[535, 874, s.first], [920, 1391, s.second]];
  for (const [left, right, word] of slots) {
    line(c, left, 165, right, 165, 6, '#998976');
    if (word) type(c, word, left + 8, 148, 95, runInk, 'italic');
  }
  if (s.first) {
    const x = s.second ? 920 : 535;
    const word = s.second || s.first;
    c.font = 'italic 95px "Lesson Serif"';
    const length = c.measureText(word).width + 16;
    line(c, x, 165, x + s.write * length, 165, 5, runInk);
    // Hold the barrel below the lettering until the pencil clears the word.
    const angle = 0.06 - 0.67 * Math.max(0, (s.write - 0.88) / 0.12);
    pencil(c, x + 3 + s.write * length, 166, angle);
  } else {
    pencil(c, 541, 158);
  }
}

const percent = (x) => Math.round(100 * x) + '%';
const unit = 1210;
const ends = { run: 104, sleep: 1036 };
const width = 783;
const yBar = 762;
const yOther = 974;
const hBar = 35;
const splitOdds = distribution(1);

function rightText(c, value, x, y, size, color, style, face) {
  c.save();
  c.textAlign = 'right';
  type(c, value, x, y, size, color, style, face);
  c.restore();
}

// The same length always means the same fraction of all two-word endings.
function strip(c, left, y, fraction, color) {
  if (fraction <= 0) return;
  c.fillStyle = color;
  c.fillRect(left, y, unit * fraction, hBar);
}

function prior(c, left, word, probability, showNumber, color) {
  type(c, word, left, 724, 85, color, 'italic');
  if (!showNumber) return;
  rightText(c, percent(probability), left + width, 724, 82, color, '600', 'Lesson Sans');
  strip(c, left, yBar, probability, color);
}

function factors(c, left, a, b, color) {
  type(c, percent(a) + ' × ' + percent(b), left, 861, 56, color, '', 'Lesson Sans');
}

function pair(c, s, runner) {
  const left = runner ? ends.run : ends.sleep;
  const color = runner ? runInk : sleepInk;
  const track = runner ? '#dfc4ad' : '#bbcbd2';
  const name = runner ? 'ran home' : 'slept soundly';
  const d = s.odds;
  const first = runner ? d.run : d.sleep;
  const next = runner ? d.home : d.soundly;
  const joint = runner ? d.runHome : d.sleepSoundly;
  const showFactor = runner ? s.homeFactor : s.soundlyFactor;
  const showScore = runner ? s.runScore : s.sleepScore;
  type(c, name, left, 725, 78, color, 'italic');
  if (showScore) rightText(c, percent(joint), left + width, 725, 82, color, '600', 'Lesson Sans');

  strip(c, left, yBar, first, track);
  if (showScore || (runner && s.split === 1)) {
    strip(c, left, yBar, joint, color);
  }
  if (showFactor) factors(c, left, first, next, color);
}

function splitRow(c, left, y, { name, joint, color, conditional, showJoint = true }) {
  type(c, name, left, y - 18, 56, color, 'italic');
  if (conditional !== undefined) {
    type(c, percent(conditional) + ' of branch', left + 344, y - 20, 38, ink, '', 'Lesson Sans');
  }
  if (showJoint) {
    rightText(c, percent(joint), left + width, y - 18, 58, color, '600', 'Lesson Sans');
  }
  if (joint !== undefined) strip(c, left, y, joint, color);
}

function splitPicture(c, s) {
  const { odds: d } = s;
  if (s.proposal) type(c, 'Which pair leads after the split?', 103, 145, 82);
  else sentence(c, s);

  const scale = 0.56;
  for (const [x, runner] of [[470, true], [1416, false]]) {
    c.save();
    c.translate(x * (1 - scale), 65);
    c.scale(scale, scale);
    dogs(c, runner, !runner, s.leap, 0);
    c.restore();
  }
  type(c, 'Bar length shows the share of all two-word endings', ends.run, 462, 39, ink, '', 'Lesson Sans');
  type(c, 'ran   /   ' + percent(d.run) + ' at the first word', ends.run, 525, 47, runInk);
  type(c, 'slept   /   ' + percent(d.sleep) + ' at the first word', ends.sleep, 525, 47, sleepInk);
  const top = 614;
  const middle = 741;
  const bottom = 868;
  const stayingHome = s.moving ? splitOdds.runHome : d.runHome;
  splitRow(c, ends.run, top, {
    name: 'ran home',
    joint: s.moving || s.runScore ? stayingHome : undefined,
    color: runInk,
    conditional: s.homeFactor ? d.home : undefined,
    showJoint: s.runScore,
  });
  splitRow(c, ends.sleep, top, {
    name: 'slept soundly', joint: s.sleepScore ? d.sleepSoundly : undefined,
    color: sleepInk, conditional: d.soundly, showJoint: s.sleepScore,
  });
  if (s.quickly) {
    splitRow(c, ends.run, bottom, {
      name: 'ran quickly', joint: d.runQuickly, color: runInk, conditional: d.quickly,
    });
  }
  if (s.sleepOutside) {
    splitRow(c, ends.sleep, middle, {
      name: 'slept outside', joint: d.sleptOutside, color: sleepInk, conditional: d.sleepOutside,
    });
  }
  if (s.outside) {
    splitRow(c, ends.run, middle, {
      name: 'ran outside', joint: d.runOutside, color: runInk,
      conditional: s.homeFactor ? d.outside : undefined, showJoint: s.equal,
    });
  } else if (s.moving) {
    // Clear the home bar before moving the detached piece left.
    const slide = Math.max(0, (s.split - 0.32) / 0.68);
    const x = ends.run + unit * splitOdds.runHome * (1 - slide);
    const y = top + (middle - top) * s.split;
    strip(c, x, y, splitOdds.runOutside, runInk);
  }
  if (s.winner) {
    type(c, 'Largest share', ends.sleep + unit * d.sleepSoundly + 26, top + 28, 37, sleepInk, '', 'Lesson Sans');
  }
}

export function drawDogFutures(c, clock) {
  const s = forkState(clock);
  const firstChoice = ['c01-b01', 'c01-b02'].includes(clock.beat.id);
  c.save();
  try {
    page(c);
    if (clock.beat.chapterId === 'c02' || s.carrySplit) return splitPicture(c, s);
    sentence(c, s);
    c.save();
    c.translate(0, 122 * s.lift);
    dogs(c, true, s.sleeping, s.leap, s.breath);
    if (firstChoice && !s.sleeping) {
      c.globalAlpha = 0.32;
      dogs(c, false, true, 0, 0);
    }
    c.restore();

    if (s.tiedChoice) {
      const d = s.odds;
      type(c, 'After ran', ends.run, 728, 74, runInk, 'italic');
      for (const [i, word] of ['home', 'outside'].entries()) {
        const x = ends.run + i * 452;
        type(c, word, x, 850, 62, ink);
        type(c, percent(d[word]), x, 924, 59, runInk);
        strip(c, x, yOther, d.run * d[word], runInk);
      }
    } else if (s.home) pair(c, s, true);
    else if (s.runWord) prior(c, ends.run, 'ran', s.odds.run, s.runPrior, runInk);
    if (s.sleeping) {
      if (s.soundly) pair(c, s, false);
      else if (s.sleepWord) prior(c, ends.sleep, 'slept', s.odds.sleep, s.sleepPrior, sleepInk);
    }
    if (firstChoice) {
      if (s.runPrior) type(c, 'home   ·   quickly', ends.run, 907, 56, runInk, 'italic');
      c.save();
      if (!s.sleeping) {
        c.globalAlpha = 0.48;
        prior(c, ends.sleep, 'slept', s.odds.sleep, true, sleepInk);
      }
      if (s.sleepPrior) type(c, 'soundly   ·   outside', ends.sleep, 907, 56, sleepInk, 'italic');
      c.restore();
      if (!s.sleeping) type(c, 'out of reach', ends.sleep, 993, 44, '#736c69', '', 'Lesson Sans');
    }
    if (s.greedy) type(c, 'Greedy choice', ends.run, 993, 46, ink, '', 'Lesson Sans');
  } finally {
    c.restore();
  }
}
