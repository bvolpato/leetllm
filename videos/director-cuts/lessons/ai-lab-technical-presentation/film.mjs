import assert from 'node:assert/strict';
import { Path2D } from '@napi-rs/canvas';
import { PAIR_FIXTURE } from '../../../films/ai-lab-technical-presentation/fixtures.mjs';
import { pairedEvidence } from '../../../films/ai-lab-technical-presentation/arithmetic.mjs';

const beats = [
  {
    id: 'a-hand-goes-up',
    say: "You're halfway through a talk about runbook search when a hand goes up. “I see the score went up. Did any searches get worse?”",
    hold: 1.15,
  },
  {
    id: 'keep-the-questions-fixed',
    say: "Leave those numbers on the screen. You ran both versions on the same two hundred test queries. For each query, you knew which runbook the engineer needed. Count a hit if that guide appeared in the first five results.",
    hold: 0.7,
  },
  {
    id: 'follow-one-query',
    say: "Here's query one forty-one. The old version found its runbook in the top five. Follow that same query over to the new version.",
    hold: 1.25,
  },
  {
    id: 'the-crossing',
    say: "It dropped out of the top five. Now join the rest by query ID. See the two paths that cross? Eight queries lost a hit. Twenty-two picked one up. The ones that go straight across kept the same outcome.",
    hold: 0.95,
  },
  {
    id: 'answer-in-the-room',
    say: "Here's how I'd answer. “Yes. On these two hundred queries we gained twenty-two hits and lost eight. That leaves fourteen extra hits, which is how the score rose seven percentage points.”",
    hold: 1.15,
  },
  {
    id: 'where-to-look',
    say: "If someone asks why a runbook dropped out, point to one of those eight. “I'd open the two result lists for this query and look at what changed.”",
    hold: 2.8,
  },
];

const old = Object.fromEntries(PAIR_FIXTURE.map(q => [q.id, q.baseline]));
const current = Object.fromEntries(PAIR_FIXTURE.map(q => [q.id, q.candidate]));
const result = pairedEvidence(old, current);
const classes = { kept: [], lost: [], gained: [], missed: [] };
const flagPair = (q) => q.baseline ? (q.candidate ? 'kept' : 'lost') : (q.candidate ? 'gained' : 'missed');
for (const q of [...PAIR_FIXTURE].sort((a, b) => a.id.localeCompare(b.id))) {
  classes[flagPair(q)].push(q);
}

// Endpoints share the same vertical scale. Each strand is one matched query.
const x0 = 280, x1 = 1055, pitch = 0.85;
const hitTop = 239, missBottom = 596;
const keptEnd = hitTop + result.counts.both * pitch;
const missStart = missBottom - result.counts.neither * pitch;
const origins = {
  kept: [hitTop, hitTop],
  lost: [keptEnd, missStart - classes.lost.length * pitch],
  gained: [missStart - classes.gained.length * pitch, keptEnd],
  missed: [missStart, missStart],
};
const strands = Object.fromEntries(Object.entries(classes).map(([kind, group]) => [
  kind, group.map((q, i) => ({
    id: q.id,
    y0: origins[kind][0] + pitch * (i + 0.5),
    y1: origins[kind][1] + pitch * (i + 0.5),
  })),
]));
const example = strands.lost.find(q => q.id === 'query-141');
const net = result.candidateHits - result.baselineHits;
const ink = '#22273f', orange = '#b94726', blue = '#215c88', ghost = '#abb1b5';
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = t => Math.min(1, Math.max(0, t));
const ease = t => { const p = clamp(t); return p * p * (3 - 2 * p); };

function check() {
  assert.equal(new Set(PAIR_FIXTURE.map(q => q.id)).size, 200);
  assert.deepEqual(result.counts, { both: 140, baselineOnly: 8, candidateOnly: 22, neither: 30 });
  assert.equal(result.baselineHits, 148);
  assert.equal(result.candidateHits, 162);
  assert.equal(net, strands.gained.length - strands.lost.length);
  assert.equal(result.percentagePointChange, 7);
  assert.equal(old[example.id], true);
  assert.equal(current[example.id], false);
  assert.ok(strands.lost.every(q => q.y1 > q.y0));
  assert.ok(strands.gained.every(q => q.y1 < q.y0));
}

const silhouettes = new Map();
function fill(ctx, shape, color) {
  if (!silhouettes.has(shape)) silhouettes.set(shape, new Path2D(shape));
  ctx.fillStyle = color;
  ctx.fill(silhouettes.get(shape));
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function stroke(ctx, x, y, x2, y2, color, width) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function dot(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
}

function type(ctx, text, x, y, px, { face = 'Sans', weight = 500, color = ink, align = 'center' } = {}) {
  ctx.font = weight + ' ' + px + 'px "Lesson ' + face + '"';
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function opacity(ctx, amount, fn) {
  if (amount <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(amount);
  fn();
  ctx.restore();
}

// The low afternoon sun cuts across the acoustic planks. The projection stays in shade.
function seminarRoom(ctx) {
  const wall = ctx.createLinearGradient(0, 0, 1700, 920);
  wall.addColorStop(0, '#dfb392');
  wall.addColorStop(0.43, '#bb8880');
  wall.addColorStop(1, '#72596c');
  rect(ctx, -340, -220, 2700, 1500, wall);
  for (let x = -125; x < 2150; x += 52) {
    rect(ctx, x, -120, 3, 1090, '#6f536254');
    rect(ctx, x + 4, -120, 2.1, 1090, '#ffe8b839');
    for (let k = 0; k < 3; k++) {
      const start = 120 + 165 * k + 89 * Math.sin(x * 0.27 + k);
      stroke(ctx, x + 17 + 4*k, start, x + 18 + 4*k, start + 94, '#563f531c', 1.4);
    }
  }
  fill(ctx, 'M-160 490 L278 -70 L344 -70 L-140 557 Z M-120 679 L426 -30 L515 -30 L-130 799 Z', '#ffe0a875');
  rect(ctx, -200, 871, 2420, 14, '#735665');
  rect(ctx, -200, 884, 2420, 320, '#a57e78');
  rect(ctx, -200, 888, 2420, 6, '#f4c6a580');
  // A pull-down screen with a rolled lip, wall shadow, bottom bar and pull cord.
  rect(ctx, 254, 88, 1424, 759, '#543d4d55');
  rect(ctx, 235, 67, 1424, 759, '#342f3d');
  const light = ctx.createRadialGradient(759, 315, 50, 924, 390, 956);
  light.addColorStop(0, '#fffbee');
  light.addColorStop(0.74, '#f6f2e7');
  light.addColorStop(1, '#e2ded1');
  rect(ctx, 245, 76, 1404, 738, light);
  rect(ctx, 216, 57, 1462, 25, '#423c47');
  rect(ctx, 219, 57, 1454, 5, '#b5a7aa');
  rect(ctx, 228, 813, 1438, 13, '#46404c');
  stroke(ctx, 945, 826, 945, 864, '#624d58', 3);
  ctx.beginPath();
  ctx.ellipse(945, 870, 7, 11, 0, 0, 2*Math.PI);
  ctx.strokeStyle = '#594b56';
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function presenter(ctx) {
  // The remote and the presenter's gaze lead back into the screen.
  fill(ctx, 'M1717 969 L1859 969 L1869 1120 L1789 1120 L1782 1041 L1760 1120 L1689 1120 Z', '#39384e');
  fill(ctx, 'M1767 575 Q1753 562 1757 537 L1746 525 Q1742 521 1749 513 L1758 498 Q1753 462 1781 451 Q1813 438 1832 463 Q1846 486 1832 514 L1814 538 L1818 565 L1841 583 L1810 626 Z', '#b97666');
  fill(ctx, 'M1755 489 Q1749 470 1761 451 Q1770 436 1787 439 Q1799 423 1820 433 Q1849 431 1850 464 Q1868 488 1845 524 L1820 541 L1817 518 Q1827 498 1817 494 Q1808 492 1803 507 L1796 500 L1797 478 Q1776 486 1755 489 Z', '#353043');
  fill(ctx, 'M1765 549 Q1785 561 1798 549 Q1787 569 1768 567 Z', '#8a5557');
  fill(ctx, 'M1756 566 L1785 589 L1817 561 Q1859 572 1871 603 L1894 793 L1877 1014 L1698 1014 L1719 691 L1740 595 Z', '#494968');
  fill(ctx, 'M1745 581 L1757 564 L1785 588 L1773 626 Z M1785 588 L1817 559 L1827 572 L1804 611 Z', '#e3b69c');
  fill(ctx, 'M1785 602 L1747 684 L1716 714 L1685 698 L1645 674 L1633 692 L1689 743 Q1717 763 1743 740 L1799 679 Z', '#3d3e5b');
  fill(ctx, 'M1646 674 L1628 654 Q1619 649 1611 652 L1594 646 Q1587 645 1587 650 L1603 660 L1593 662 L1578 654 Q1571 650 1570 656 L1593 678 Q1602 685 1623 681 L1634 691 Z', '#c5816c');
  fill(ctx, 'M1593 649 L1598 644 L1628 654 L1624 662 Z', '#383d4c');
  stroke(ctx, 1754, 500, 1763, 500, '#774f52', 2.5);
  stroke(ctx, 1749, 527, 1759, 527, '#855459', 2);
  stroke(ctx, 1721, 777, 1711, 953, '#8e7c8c', 2);
}

// A three-quarter back view. The elbow is a fixed pivot on the audience member's shoulder.
function audience(ctx, raised) {
  fill(ctx, 'M-100 1140 L-75 927 Q-41 867 50 855 L78 820 L77 759 Q72 718 99 702 Q126 684 164 696 Q200 708 199 742 L192 792 Q187 816 162 827 L158 853 Q247 871 272 946 L303 1140 Z', '#434157');
  fill(ctx, 'M68 764 Q40 730 58 697 Q55 665 83 666 Q98 638 121 650 Q148 635 165 651 Q195 646 204 672 Q231 691 209 719 Q215 740 191 752 L180 783 L168 759 Q157 744 148 760 L144 793 Q112 812 78 790 Z', '#303246');
  fill(ctx, 'M-25 914 Q43 863 84 854 L122 881 L88 932 L-30 986 Z', '#62637d');
  fill(ctx, 'M122 881 L158 851 L191 862 L170 909 Z', '#7c7990');
  ctx.save();
  ctx.translate(219, 935);
  ctx.rotate(lerp(1.91, 0.08, raised));
  // Rust-colored knit sleeve, ribbed cuff, then an open hand.
  fill(ctx, 'M-52 42 Q-70 0 -37 -66 L5 -137 L31 -238 L91 -226 L74 -102 L36 -8 Q20 49 -15 55 Z', '#a5594f');
  fill(ctx, 'M-42 9 Q-10 -39 17 -80 L39 -184 L49 -185 L38 -73 L6 -2 Z', '#be7966');
  fill(ctx, 'M28 -243 L91 -230 L85 -200 L22 -213 Z', '#804853');
  for (let i=0;i<8;i++) stroke(ctx,31+i*7,-238+i*1.5,26+i*7,-217+i*1.5,'#bd7968',2);
  fill(ctx, 'M39 -241 L42 -262 Q34 -279 24 -291 L8 -310 Q5 -318 12 -320 Q16 -321 22 -315 L37 -301 L23 -345 Q21 -354 27 -356 Q33 -358 36 -347 L49 -319 L39 -363 Q37 -373 43 -375 Q50 -377 53 -365 L63 -325 L61 -368 Q60 -377 66 -377 Q72 -377 73 -368 L76 -323 L83 -352 Q86 -361 91 -359 Q96 -357 94 -347 L89 -305 L86 -279 L76 -257 L74 -234 Z', '#d4957b');
  fill(ctx, 'M42 -262 Q55 -285 70 -296 Q64 -276 55 -250 L50 -239 L40 -242 Z', '#bc796b');
  ctx.restore();
  fill(ctx, 'M1283 1110 Q1296 996 1391 977 L1420 956 L1417 893 Q1398 843 1431 815 Q1455 794 1498 812 Q1533 826 1531 861 L1520 923 L1498 947 L1501 969 Q1584 988 1603 1111 Z', '#34384d');
  fill(ctx, 'M1415 909 Q1386 870 1400 833 Q1411 797 1454 797 Q1502 789 1526 819 Q1544 847 1526 875 Q1521 847 1500 850 Q1465 877 1437 863 L1433 904 Z', '#292c40');
  fill(ctx, 'M1498 965 L1546 987 L1570 1012 L1530 994 L1486 981 Z', '#626071');
}

function curve(ctx, strand, until, color, width) {
  if (until <= 0) return;
  // The cubic's x controls sit at thirds. Its vertical tangent vanishes at both ends.
  const t = clamp(until), dx = x1-x0, dy = strand.y1-strand.y0, endY = strand.y0+dy*ease(t);
  ctx.beginPath();
  ctx.moveTo(x0, strand.y0);
  ctx.bezierCurveTo(x0 + t*dx/3, strand.y0, x0 + 2*t*dx/3, strand.y0+dy*t*t, x0+t*dx, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function chalkEnd(ctx, x, top, n, right, label) {
  const middle = top + n*pitch/2;
  rect(ctx, x-5, top, 10, n*pitch, '#343d55');
  type(ctx, label, x+(right ? 22 : -22), middle+12, 37, { align: right ? 'left' : 'right' });
}

function projection(ctx, s) {
  ctx.save();
  ctx.translate(283, 98);
  const v = s.open;
  const overview = 1-ease(s.focus/0.55);
  const detail = ease((s.focus-0.55)/0.45);
  const headingY = lerp(165, 53, v);
  type(ctx, 'Runbook search', 661, headingY, lerp(64, 37, v), { face: 'Serif' });
  const left = lerp(370, x0, v), right = lerp(960, x1, v);
  const y = lerp(428, 179, v), size = lerp(179, 91, v);
  for (const [x, rate, heading] of [[left, result.baselineRate, 'Old version'], [right, result.candidateRate, 'New version']]) {
    type(ctx, heading, x, y-size*1.04+72*detail, lerp(37, 29, v)+5*detail, {color:'#4c5264'});
    opacity(ctx, overview, () => type(ctx, Math.round(100*rate)+'%', x, y, size, {face:'Serif'}));
  }
  opacity(ctx, 1-v, () => {
    const cy = 369;
    stroke(ctx, 592, cy, 726, cy, '#7c8392', 5);
    stroke(ctx, 700, cy-20, 727, cy, '#7c8392', 5);
    stroke(ctx, 700, cy+20, 727, cy, '#7c8392', 5);
    type(ctx, 'Runbook in the top five', 663, 529, 40);
  });
  opacity(ctx, v, () => {
    opacity(ctx, s.sample, () => type(ctx, result.n+' paired queries', 664, 661, 39, {color:'#505566'}));
    opacity(ctx, overview*s.sample, () => {
      chalkEnd(ctx, x0, hitTop, result.baselineHits, false, result.baselineHits+' hits');
      chalkEnd(ctx, x0, missBottom - (result.n-result.baselineHits)*pitch, result.n-result.baselineHits, false, (result.n-result.baselineHits)+' misses');
      chalkEnd(ctx, x1, hitTop, result.candidateHits, true, result.candidateHits+' hits');
      chalkEnd(ctx, x1, missBottom - (result.n-result.candidateHits)*pitch, result.n-result.candidateHits, true, (result.n-result.candidateHits)+' misses');
      for (const [kind, color] of [['kept',ghost], ['missed',ghost], ['gained',blue]]) {
        for (const strand of strands[kind]) curve(ctx, strand, s.all, color, 0.79);
      }
    });

    // In the last shot the rust bundle fans out, keeping the same query at the top.
    const losses = strands.lost.map((strand, i) => ({
      y0: lerp(strand.y0, 241+i*17, s.focus),
      y1: lerp(strand.y1, 444+i*17, s.focus),
    }));
    for (const strand of losses) {
      curve(ctx, strand, s.all, orange, lerp(0.79, 2.6, s.focus));
      opacity(ctx, s.focus, () => {
        dot(ctx, x0, strand.y0, 3.7, orange);
        dot(ctx, x1, strand.y1, 3.7, orange);
      });
    }
    opacity(ctx, detail, () => {
      type(ctx, classes.lost.length+' lost hits', 664, 153, 67, {face:'Serif',color:orange});
      type(ctx, 'Hit', x0-25, 311, 41, {align:'right'});
      type(ctx, 'Miss', x1+25, 517, 41, {align:'left'});
    });

    // Keep the audience's chosen query visible as the wider comparison is assembled.
    if (s.one > 0 || s.pointer > 0) {
      const chosen = losses[strands.lost.indexOf(example)];
      curve(ctx, chosen, s.one, orange, lerp(5, 2, s.all)+2*s.focus);
      const tip = clamp(s.one);
      const px = lerp(x0, x1, tip), py = lerp(chosen.y0, chosen.y1, ease(tip));
      dot(ctx, px, py, lerp(10, 6, s.all), orange);
      opacity(ctx, s.pointer, () => {
        const xTag = Math.min(px + 15, x1-94), yTag = py + (tip > 0.65 ? -37 : 48);
        rect(ctx, xTag-102, yTag-33, 204, 44, '#f8f4e8');
        type(ctx, example.id, xTag, yTag, 33, {face:'Mono',color:orange});
      });
    }
    opacity(ctx, s.down*overview, () => {
      type(ctx, classes.lost.length+' lost', 897, 515, 42, {weight:700,color:orange});
    });
    opacity(ctx, s.up*overview, () => {
      type(ctx, classes.gained.length+' gained', 446, 490, 42, {weight:700,color:blue});
    });
    opacity(ctx, s.math*overview, () => {
      type(ctx, '+'+result.percentagePointChange+' points', 664, 150, 55, {face:'Serif'});
      type(ctx, net+' more hits', 664, 198, 31, {color:'#505566'});
    });
  });
  ctx.restore();
}

function draw(ctx, clock) {
  const {index:i, elapsed, reveal} = clock;
  const cue = (beat, phrase, span) => i > beat ? 1 : i < beat ? 0 : ease(reveal(phrase,span));
  const open = cue(1, 'Leave those numbers', 1.4);
  const one = cue(2, 'Follow that same query', 1.9);
  const all = cue(3, 'Now join the rest', 1.8);
  const returnToRoom = cue(4, "Here's how", 1.7);
  const focus = cue(5, 'If someone asks', 1.5);
  const pointAgain = cue(5, 'point to one', 0.6);
  const state = {
    open, one, all, focus,
    sample: cue(1, 'the same two hundred', 0.85),
    pointer: Math.max(cue(1, 'Count a hit', 0.55)*(1-all), pointAgain),
    down: cue(3, 'the two paths', 0.6),
    up: cue(3, 'the two paths', 0.6),
    math: cue(4, 'That leaves', 0.65),
  };
  const raise = i === 0 ? ease(0.12 + elapsed/1.25) : 1;
  const lower = cue(1, 'Both versions', 1.35);
  const zoom = 1 + 0.23*open - 0.13*returnToRoom + 0.08*focus;
  ctx.save();
  ctx.translate(960, 490);
  ctx.scale(zoom, zoom);
  ctx.translate(-960, -490);
  seminarRoom(ctx);
  projection(ctx, state);
  presenter(ctx);
  audience(ctx, raise*(1-lower));
  ctx.restore();
}

export default { title: 'Did any searches get worse?', beats, draw, check };
