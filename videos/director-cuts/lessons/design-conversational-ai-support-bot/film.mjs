import assert from 'node:assert/strict';
import {
  hash,
  money,
  tuple,
} from '../../../films/design-conversational-ai-support-bot/arithmetic.mjs';
import { confirmed } from '../../../films/design-conversational-ai-support-bot/fixtures.mjs';
import { decide } from '../../../films/design-conversational-ai-support-bot/model.mjs';

const signed = Object.freeze(tuple(confirmed));
const revised = Object.freeze({ ...confirmed, amount: 4000 });
const decision = decide(revised);
const beats = [
  {
    id: 'the-signature',
    say: 'Billing found a duplicate charge on Alex’s GPU invoice. Alex signs a request for thirty-five dollars back.',
    hold: 0.7,
  },
  {
    id: 'the-carbon-copy',
    say: 'Lift the top sheet. See the signature on the pink copy? The support app keeps a record like that. It ties Alex’s confirmation to the exact request on the screen.',
    hold: 0.7,
  },
  {
    id: 'the-correction',
    say: 'Before the bot sends anything to billing, Alex writes back. “Make it forty.” Watch the signature line as the bot prepares the new request.',
    hold: 1.2,
  },
  {
    id: 'the-comparison',
    say: 'The app compares the new request with the saved copy. Same invoice, same customer. Look at the two amounts. Which one did Alex sign?',
    hold: 2.1,
  },
  {
    id: 'the-next-reply',
    say: 'Thirty-five. Forty dollars is below this policy’s five-hundred-dollar threshold for specialist review, too. The bot asks Alex to confirm the new amount. Until Alex does, the billing queue stays empty.',
    hold: 2.4,
  },
];

const ink = '#263651';
const blue = '#234bc0';
const clamp = (v) => Math.max(0, Math.min(1, v));
function ease(v) {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
}
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;

function text(g, string, x, y, size, family = 'Sans', color = ink, weight = 400, align = 'left') {
  g.font = `${weight} ${size}px "Lesson ${family}"`;
  g.fillStyle = color;
  g.textAlign = align;
  g.fillText(string, x, y);
}

function line(g, x, y, x2, y2, color, width = 1) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x2, y2);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}

function shape(g, path, fill, stroke, width = 2) {
  g.beginPath();
  path(g);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = width;
    g.stroke();
  }
}

// A fixed scatter of short fibers keeps the material still as the camera moves.
function fibers(count, seed, width, height) {
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    x: next() * width,
    y: next() * height,
    length: 1 + 4 * next(),
    tilt: next() * 2 - 1,
  }));
}
const counterGrain = fibers(2100, 4320, 1920, 1080);
const paperGrain = fibers(340, 690, 724, 588);
function texture(g, grain, x, y, color, weight) {
  g.beginPath();
  for (const f of grain) {
    g.moveTo(x + f.x, y + f.y);
    g.lineTo(x + f.x + f.length, y + f.y + f.tilt);
  }
  g.lineWidth = weight;
  g.strokeStyle = color;
  g.stroke();
}

function counter(g) {
  const top = g.createLinearGradient(20, 40, 1630, 1240);
  top.addColorStop(0, '#bb493d');
  top.addColorStop(0.54, '#c85543');
  top.addColorStop(1, '#a53e36');
  g.fillStyle = top;
  g.fillRect(0, 0, 1920, 1080);
  // Daylight past the edge of the counter window.
  const light = g.createLinearGradient(0, 0, 315, 870);
  for (const [at, tone] of [
    [0, '#ffe8b725'],
    [0.28, '#ffe8b723'],
    [0.34, '#ffe8b700'],
    [0.46, '#ffe8b700'],
    [0.52, '#ffe8b71b'],
    [0.89, '#ffe8b717'],
    [1, '#ffe8b700'],
  ]) {
    light.addColorStop(at, tone);
  }
  g.fillStyle = light;
  g.fillRect(0, 0, 1920, 1080);
  texture(g, counterGrain, 0, 0, 'rgba(255,225,179,0.17)', 1.7);
}

const w = 728,
  h = 594;
function perimeter(g) {
  g.moveTo(-w / 2, -h / 2);
  g.lineTo(w / 2 - 4, -h / 2);
  g.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + 4);
  g.lineTo(w / 2, h / 2 - 2);
  // The two leaves tear from the same glued book.
  for (let i = 0; i <= 91; i++) {
    const x = w / 2 - i * 8;
    g.lineTo(x, h / 2 - (i % 3 === 1 ? 2.7 : i % 3 === 2 ? 0.8 : 1.5));
  }
  g.closePath();
}
function cast(g, blur, x, y, alpha) {
  g.shadowColor = `rgba(44,17,32,${alpha})`;
  g.shadowBlur = blur;
  g.shadowOffsetX = x;
  g.shadowOffsetY = y;
}
function clearShadow(g) {
  g.shadowColor = 'transparent';
  g.shadowBlur = g.shadowOffsetX = g.shadowOffsetY = 0;
}
function sheetBase(g, isCopy) {
  const paper = g.createLinearGradient(-360, -340, 300, 340);
  paper.addColorStop(0, isCopy ? '#ffd8cf' : '#fff6d7');
  paper.addColorStop(0.65, isCopy ? '#f7bcb6' : '#fff3ce');
  paper.addColorStop(1, isCopy ? '#edada9' : '#efdfb7');
  g.save();
  cast(g, 18, 6, 12, 0.26);
  shape(g, perimeter, paper);
  g.restore();
  texture(g, paperGrain, -362, -294, isCopy ? '#9b3e471a' : '#82553519', 1.2);

  // The removable margin has real pin-feed perforations in both leaves.
  g.save();
  g.setLineDash([5, 5]);
  line(g, -312, -295, -312, 293, isCopy ? '#bc8181' : '#beaf91', 1.8);
  g.restore();
  for (let y = -260; y < 288; y += 48) {
    const hole = g.createLinearGradient(-339, y - 8, -333, y + 9);
    hole.addColorStop(0, '#8c544a');
    hole.addColorStop(0.38, '#b75a4a');
    hole.addColorStop(1, '#c66b56');
    g.beginPath();
    g.arc(-339, y, 7.5, 0, TAU);
    g.fillStyle = hole;
    g.fill();
    g.beginPath();
    g.arc(-339, y, 8.2, 0.12, Math.PI - 0.12);
    g.strokeStyle = '#fff5dc';
    g.lineWidth = 1.6;
    g.stroke();
  }
}

// The pen follows the same curves that make the signature and its impression.
const script = [
  [
    [0, 48],
    [13, 42],
    [43, -6],
    [66, -14],
  ],
  [
    [66, -14],
    [83, -21],
    [58, 16],
    [54, 58],
  ],
  [
    [54, 58],
    [51, 82],
    [64, 62],
    [67, 50],
  ],
  [
    [67, 50],
    [58, 39],
    [23, 44],
    [19, 59],
  ],
  [
    [19, 59],
    [12, 75],
    [67, 48],
    [82, 36],
  ],
  [
    [82, 36],
    [107, 9],
    [107, -13],
    [96, -5],
  ],
  [
    [96, -5],
    [82, 6],
    [70, 67],
    [91, 55],
  ],
  [
    [91, 55],
    [104, 48],
    [125, 27],
    [115, 27],
  ],
  [
    [115, 27],
    [105, 26],
    [92, 50],
    [102, 56],
  ],
  [
    [102, 56],
    [115, 65],
    [133, 36],
    [140, 39],
  ],
  [
    [140, 39],
    [149, 42],
    [144, 66],
    [158, 52],
  ],
  [
    [158, 52],
    [169, 43],
    [176, 33],
    [180, 29],
  ],
  null,
  [
    [133, 64],
    [147, 53],
    [163, 43],
    [177, 45],
  ],
  [
    [177, 45],
    [190, 49],
    [196, 51],
    [208, 40],
  ],
  null,
  [
    [31, 75],
    [77, 68],
    [157, 62],
    [219, 60],
  ],
];
const points = [];
let distance = 0;
for (const curve of script) {
  if (!curve) continue;
  for (let i = 0; i <= 36; i++) {
    const t = i / 36,
      s = 1 - t;
    const [x, y] = [0, 1].map(
      (k) =>
        s ** 3 * curve[0][k] +
        3 * s * s * t * curve[1][k] +
        3 * s * t * t * curve[2][k] +
        t ** 3 * curve[3][k],
    );
    const prev = points.at(-1);
    const lift = i === 0 && prev && (prev.x !== x || prev.y !== y);
    if (prev) distance += Math.hypot(x - prev.x, y - prev.y);
    points.push({ x, y, d: distance, lift });
  }
}
function signature(g, amount, isCopy) {
  const d = distance * clamp(amount);
  if (amount === 0) return [-197, 106 + points[0].y * 0.86];
  g.save();
  g.translate(-197, 106);
  g.scale(0.91, 0.86);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  let end = points[0];
  g.moveTo(end.x, end.y);
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.d > d) {
      const f = (d - end.d) / (p.d - end.d);
      end = { x: lerp(end.x, p.x, f), y: lerp(end.y, p.y, f) };
      if (!p.lift) g.lineTo(end.x, end.y);
      break;
    }
    if (p.lift) g.moveTo(p.x, p.y);
    else g.lineTo(p.x, p.y);
    end = p;
  }
  g.strokeStyle = isCopy ? '#52548c' : '#214eaf';
  g.lineWidth = isCopy ? 4.8 : 5.8;
  g.stroke();
  g.restore();
  return [end.x * 0.91 - 197, end.y * 0.86 + 106];
}

// The wrist leaves with the pen. The signed impression stays in the frame.
function writingHand(g) {
  const skin = g.createLinearGradient(117, -76, 270, 130);
  skin.addColorStop(0, '#dda17b');
  skin.addColorStop(0.52, '#bd7d5c');
  skin.addColorStop(1, '#945847');
  shape(
    g,
    (p) => {
      p.moveTo(40, 26);
      p.bezierCurveTo(46, 7, 64, -15, 84, -27);
      p.bezierCurveTo(105, -42, 115, -72, 143, -85);
      p.bezierCurveTo(171, -98, 195, -85, 222, -67);
      p.bezierCurveTo(257, -52, 275, -56, 304, -38);
      p.bezierCurveTo(343, -16, 365, 20, 406, 57);
      p.lineTo(597, 171);
      p.lineTo(515, 293);
      p.lineTo(335, 192);
      p.bezierCurveTo(292, 170, 246, 173, 209, 159);
      p.bezierCurveTo(169, 146, 167, 124, 136, 110);
      p.bezierCurveTo(112, 99, 103, 101, 79, 90);
      p.bezierCurveTo(64, 82, 58, 74, 60, 64);
      p.bezierCurveTo(22, 62, 23, 42, 40, 26);
      p.closePath();
    },
    skin,
    '#815348',
    2.1,
  );
  shape(
    g,
    (p) => {
      p.moveTo(59, 65);
      p.bezierCurveTo(74, 67, 88, 63, 102, 48);
      p.bezierCurveTo(88, 74, 79, 78, 67, 76);
    },
    '#a36550',
  );
  shape(
    g,
    (p) => {
      p.moveTo(93, 91);
      p.bezierCurveTo(105, 87, 117, 76, 122, 61);
      p.bezierCurveTo(120, 85, 111, 92, 100, 95);
    },
    '#a46754',
  );
  shape(
    g,
    (p) => {
      p.moveTo(129, -71);
      p.bezierCurveTo(156, -94, 177, -86, 196, -73);
      p.bezierCurveTo(166, -83, 151, -76, 134, -64);
    },
    '#e5ab864f',
  );

  // The cuff is cropped by the frame in the close shot.
  shape(
    g,
    (p) => {
      p.moveTo(387, 38);
      p.bezierCurveTo(402, 56, 384, 111, 330, 191);
      p.lineTo(1462, 900);
      p.lineTo(1571, 760);
      p.closePath();
    },
    '#263855',
  );
  shape(
    g,
    (p) => {
      p.moveTo(391, 40);
      p.bezierCurveTo(403, 70, 369, 138, 336, 191);
      p.lineTo(352, 200);
      p.bezierCurveTo(398, 134, 423, 73, 408, 53);
      p.closePath();
    },
    '#e8c79b',
  );
}

// A transparent blue ballpoint. Its metal cone ends at the ink coordinate.
function pen(g, x, y, retreat) {
  if (retreat >= 1) return;
  g.save();
  g.translate(x + 1340 * retreat, y - 170 * retreat);
  g.rotate(-0.4 + 0.12 * retreat);
  cast(g, 12, 4, 9, 0.18);
  writingHand(g);
  cast(g, 8 + 20 * retreat, 5 + 16 * retreat, 7 + 28 * retreat, 0.29);
  const shell = g.createLinearGradient(0, -17, 0, 19);
  shell.addColorStop(0, '#183d76');
  shell.addColorStop(0.22, '#8cbae4');
  shell.addColorStop(0.38, '#89bde0');
  shell.addColorStop(0.5, '#467cb3');
  shell.addColorStop(0.66, '#285486');
  shell.addColorStop(1, '#183151');
  shape(
    g,
    (p) => {
      p.moveTo(0, 0);
      p.lineTo(46, -11);
      p.lineTo(68, -16);
      p.lineTo(296, -15);
      p.quadraticCurveTo(308, -14, 308, -3);
      p.lineTo(308, 7);
      p.quadraticCurveTo(307, 16, 296, 16);
      p.lineTo(68, 16);
      p.lineTo(46, 11);
      p.closePath();
    },
    shell,
  );
  clearShadow(g);
  const nib = g.createLinearGradient(0, -11, 0, 12);
  nib.addColorStop(0, '#374a64');
  nib.addColorStop(0.43, '#ecedf1');
  nib.addColorStop(1, '#445267');
  shape(
    g,
    (p) => {
      p.moveTo(0, 0);
      p.lineTo(48, -11);
      p.lineTo(48, 11);
      p.closePath();
    },
    nib,
  );
  line(g, 66, -9, 270, -9, '#dbf1ffb3', 2.4);
  line(g, 74, 4, 280, 4, '#203a76a0', 3);
  for (let i = 52; i <= 70; i += 4) line(g, i, -11, i, 11, '#283f5c', 1.2);
  shape(
    g,
    (p) => {
      p.moveTo(302, -12);
      p.lineTo(325, -12);
      p.quadraticCurveTo(333, -11, 332, 1);
      p.lineTo(331, 8);
      p.lineTo(303, 10);
      p.closePath();
    },
    '#203a69',
  );
  line(g, 302, -12, 227, -16, '#c5d3df', 5);
  line(g, 227, -16, 220, -12, '#a6b6c7', 4);
  // The thumb crosses the barrel. A nail and one crease locate the grip.
  shape(
    g,
    (p) => {
      p.moveTo(150, -40);
      p.bezierCurveTo(124, -42, 92, -32, 74, -22);
      p.bezierCurveTo(54, -11, 49, 4, 62, 14);
      p.bezierCurveTo(74, 25, 90, 21, 110, 12);
      p.bezierCurveTo(138, 0, 162, 7, 187, -10);
      p.bezierCurveTo(199, -20, 190, -35, 173, -38);
      p.bezierCurveTo(163, -41, 156, -40, 150, -40);
    },
    '#d99974',
    '#965e4e',
    1.8,
  );
  shape(
    g,
    (p) => {
      p.moveTo(60, 2);
      p.bezierCurveTo(61, -8, 73, -15, 84, -15);
      p.bezierCurveTo(89, -7, 85, 3, 77, 10);
      p.bezierCurveTo(69, 14, 63, 12, 60, 8);
      p.closePath();
    },
    '#efb9a1',
    '#bb8170',
    1.3,
  );
  shape(
    g,
    (p) => {
      p.moveTo(124, -22);
      p.quadraticCurveTo(131, -16, 131, -8);
    },
    null,
    '#b3795e',
    2,
  );
  g.restore();
}

function underline(g, x, y, length, amount) {
  if (!amount) return;
  const reach = length * amount;
  shape(
    g,
    (p) => {
      p.moveTo(x, y + 2);
      p.quadraticCurveTo(x + reach * 0.42, y - 4, x + reach, y);
      p.lineTo(x + reach, y + 5);
      p.quadraticCurveTo(x + reach * 0.4, y + 2, x, y + 8);
      p.closePath();
    },
    '#b8473e',
  );
}

function leaf(g, { copy = false, changed = false, written = 1, mark = 0, invite = 0 }) {
  sheetBase(g, copy);
  const left = -273,
    right = 315;
  const tone = copy ? '#543e59' : ink;
  // A cropped double rule and a large serif title give the two parts one printer's imprint.
  line(g, left, -247, right, -247, tone, 4);
  line(g, left, -239, right, -239, tone, 1.6);
  text(g, 'Billing support', left, -191, 29, 'Sans', tone, 600);
  text(g, signed.invoice, right, -191, 29, 'Mono', tone, 400, 'right');
  text(g, copy ? 'Signed copy' : 'Credit request', left - 3, -105, 69, 'Serif', tone);
  line(g, left, -81, right, -81, tone, 2);
  text(g, 'GPU usage', left, -34, 31, 'Sans', tone);
  text(g, money(changed ? revised.amount : signed.amount), left - 6, 74, 118, 'Serif', tone);
  underline(g, left - 2, 87, 336, mark);
  line(g, left, 175, right, 175, copy ? '#99788a' : '#9b9783', 2);
  text(g, 'Alex', left, 223, 33, 'Sans', tone, 600);
  text(g, signed.policy + '  /  R' + signed.revision, right, 223, 22, 'Mono', tone, 400, 'right');
  const tip = signature(g, written, copy);
  if (invite > 0) {
    g.save();
    g.globalAlpha *= invite;
    const prompt = 'Confirm ' + money(revised.amount);
    g.fillStyle = blue;
    g.beginPath();
    g.roundRect(left, 104, 371, 66, 12);
    g.fill();
    text(g, prompt, left + 23, 149, 34, 'Sans', '#fff9e4', 600);
    line(g, 44, 137, 73, 137, '#fff9e4', 3);
    shape(
      g,
      (p) => {
        p.moveTo(62, 126);
        p.lineTo(74, 137);
        p.lineTo(62, 149);
      },
      null,
      '#fff9e4',
      3,
    );
    g.restore();
  }
  return tip;
}

function carbon(g, separation) {
  g.save();
  g.translate(-10 - 56 * separation, 9 + 59 * separation);
  g.rotate(-0.064 - 0.08 * separation);
  cast(g, 12, 4, 10, 0.27);
  const wax = g.createLinearGradient(-400, -300, 350, 300);
  wax.addColorStop(0, '#21335a');
  wax.addColorStop(0.72, '#293f6a');
  wax.addColorStop(0.92, '#3b5381');
  wax.addColorStop(1, '#1d3055');
  shape(g, perimeter, wax);
  clearShadow(g);
  texture(g, paperGrain, -362, -294, '#dbe7fd33', 1.5);
  // The waxed leaf has a small folded corner where the book opens.
  shape(
    g,
    (p) => {
      p.moveTo(309, 296);
      p.lineTo(364, 243);
      p.lineTo(364, 295);
      p.closePath();
    },
    '#667fa6',
  );
  g.restore();
}

function atLeaf(g, x, y, rotation, scale, paint) {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.scale(scale, scale);
  paint();
  g.restore();
}
function correction(g, amount) {
  if (amount <= 0) return;
  g.save();
  g.globalAlpha *= amount;
  g.translate(535, lerp(111, 101, amount));
  g.rotate(-0.025);
  // One message from the conversation crosses onto the working copy.
  cast(g, 8, 0, 4, 0.12);
  shape(
    g,
    (p) => {
      p.moveTo(-176, -38);
      p.lineTo(167, -38);
      p.quadraticCurveTo(185, -38, 185, -21);
      p.lineTo(185, 22);
      p.quadraticCurveTo(185, 38, 165, 38);
      p.lineTo(-94, 38);
      p.lineTo(-111, 58);
      p.lineTo(-111, 38);
      p.lineTo(-176, 38);
      p.quadraticCurveTo(-194, 38, -194, 20);
      p.lineTo(-194, -21);
      p.quadraticCurveTo(-194, -38, -176, -38);
    },
    '#263651',
  );
  clearShadow(g);
  text(g, 'Make it $40.', 0, 17, 46, 'Sans', '#fff7e2', 600, 'center');
  g.restore();
}

// Turn the old proposal off the pad. The retained pink sheet never turns.
function replacePage(g, t, mark, invite) {
  leaf(g, { changed: true, written: 0, mark, invite });
  if (t >= 1) return;
  const edge = lerp(w / 2, -w / 2, t);
  g.save();
  g.beginPath();
  g.rect(-w / 2 - 30, -h / 2 - 30, edge + w / 2 + 30, h + 72);
  g.clip();
  leaf(g, {});
  g.restore();
  const bend = 85 * Math.sin(t * Math.PI);
  if (bend > 0.1) {
    const shade = g.createLinearGradient(edge - bend, 0, edge + 18, 0);
    shade.addColorStop(0, '#fff4cf');
    shade.addColorStop(0.55, '#d8ceaf');
    shade.addColorStop(0.86, '#fff9e1');
    shade.addColorStop(1, '#493e483a');
    shape(
      g,
      (p) => {
        p.moveTo(edge - bend, -h / 2);
        p.quadraticCurveTo(edge + 22, -h / 2 + 32, edge + 10, 0);
        p.lineTo(edge + 8, h / 2 - 2);
        p.quadraticCurveTo(edge - bend * 0.55, h / 2 - 13, edge - bend, h / 2);
        p.closePath();
      },
      shade,
    );
  }
}

function draw(g, clock) {
  const { index, elapsed, reveal } = clock;
  const separation = index === 0 ? 0 : index === 1 ? ease(reveal('Lift the top sheet', 1.85)) : 1;
  const written = index === 0 ? ease(0.03 + elapsed / 3.0) : 1;
  const withdraw = index === 0 ? ease((elapsed - 3.2) / 1.5) : 1;
  const replacing =
    index > 2 ? 1 : index === 2 ? ease(reveal('Watch the signature line', 1.05)) : 0;
  const mark = index > 3 ? 1 : index === 3 ? ease(reveal('Look at the two amounts', 0.65)) : 0;
  const invite =
    index === 4 && decision.outcome === 'CONFIRM' ? ease(reveal('specialist review', 0.5)) : 0;
  const message =
    index === 2
      ? ease(reveal('Alex writes back', 0.35)) * (1 - ease((elapsed - clock.speechDuration) / 0.55))
      : 0;
  const scale = lerp(1.39, 1, separation);
  const cy = lerp(463, 492, separation);
  counter(g);
  const close = index < 3 ? 0 : index === 3 ? ease(reveal('Look at the two amounts', 1.7)) : 1;
  g.save();
  g.translate(960, 500);
  g.scale(1 + 0.105 * close, 1 + 0.105 * close);
  g.translate(-960, -500);

  const copyX = lerp(966, 1383, separation),
    copyY = cy + 10;
  atLeaf(g, copyX, copyY, lerp(-0.044, 0.041, separation), scale, () => {
    leaf(g, { copy: true, written, mark });
  });

  const x = lerp(960, 534, separation),
    angle = lerp(-0.062, -0.024, separation);
  atLeaf(g, x, cy, angle, scale, () => {
    carbon(g, separation);
    const tip = replacing > 0 ? replacePage(g, replacing, mark, invite) : leaf(g, { written });
    if (index === 0) pen(g, tip[0], tip[1], withdraw);
  });
  correction(g, message);
  g.restore();
}

function check() {
  assert.equal(confirmed.authenticated, true);
  assert.equal(confirmed.duplicate, true);
  assert.equal(confirmed.amount, 3500);
  assert.equal(confirmed.confirmed, hash(signed));
  assert.equal(decide(confirmed).outcome, 'QUEUE ELIGIBLE');
  const newTerms = tuple(revised);
  assert.deepEqual(
    Object.keys(signed).filter((key) => signed[key] !== newTerms[key]),
    ['amount'],
  );
  assert.equal(signed.amount, 3500);
  assert.equal(newTerms.amount, 4000);
  assert.equal(decision.outcome, 'CONFIRM');
  assert.equal(decide({ ...revised, confirmed: hash(newTerms) }).outcome, 'QUEUE ELIGIBLE');
  return true;
}

export default { title: 'What did Alex sign?', beats, draw, check };
