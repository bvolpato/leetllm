import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { reportAdmission, secureEligibility, sourceRecord } from '../../../films/secure-rag/arithmetic.mjs';
import { PRINCIPAL, SECURE_SOURCES } from '../../../films/secure-rag/fixtures.mjs';

const title = 'Can the model still read yesterday’s report?';
const beats = [
  {
    id: 'last-thread',
    say: 'Watch the red thread. Three documents go into this incident report. The red comes from the key runbook.',
    hold: 0.7,
  },
  {
    id: 'sewn-in',
    say: 'The label tells us which version of each document went into the report. The service keeps that list when it saves the text. Yesterday our reader could open all three.',
    hold: 0.8,
  },
  {
    id: 'new-request',
    say: 'This morning the runbook’s owner withdraws access. The reader asks the assistant for an incident summary. Can it give the model yesterday’s report?',
    hold: 2.1,
  },
  {
    id: 'old-weave',
    say: 'See the red that’s still there? Even in different words, the report could tell the reader who reviews key requests. The retrieval service checks each source for this reader. The checklist passes. The FAQ passes. The runbook fails. That holds the whole report outside the prompt.',
    hold: 0.6,
  },
  {
    id: 'weave-again',
    say: 'Go back to the two documents the reader can still open. Start with those pages and write a fresh report.',
    hold: 0.8,
  },
  {
    id: 'reading-copy',
    say: 'Read the two names on its label. Both versions match the current documents, and both read checks pass. This is the copy the model gets.',
    hold: 2.6,
  },
];

const reader = { ...PRINCIPAL, groups: [...PRINCIPAL.groups, 'security'] };
const before = SECURE_SOURCES.filter(row => row.id !== 'plan').map(sourceRecord);
const after = before.map(row => row.id === 'key' ? { ...row, grant: null } : row);
const manifest = rows => rows.map(({ tenant, id, revision }) => ({ tenant, id, revision }));
const original = manifest(before);
const replacement = manifest(after.filter(row => secureEligibility(row, reader)));
const oldHeld = !reportAdmission(original, after, reader);
const newAdmitted = reportAdmission(replacement, after, reader);

function check() {
  assert.deepEqual(original.map(ref => [ref.id, ref.revision]), [['checklist', 1], ['FAQ', 3], ['key', 7]]);
  assert(reportAdmission(original, before, reader));
  assert.deepEqual(after.map(row => secureEligibility(row, reader)), [true, true, false]);
  assert(oldHeld);
  assert.deepEqual(replacement, original.slice(0, 2));
  assert(newAdmitted);
  assert(!reportAdmission(replacement, after.map(row => ({ ...row, revision: row.revision + 1 })), reader));
  assert(!reportAdmission(replacement, after, { ...reader, tenant: 'B' }));
}

const dyes = {
  checklist: { rgb: [55, 87, 137], ink: '#325484', light: '#96add3', short: 'Checklist' },
  FAQ: { rgb: [214, 159, 49], ink: '#936516', light: '#f9d087', short: 'FAQ' },
  key: { rgb: [187, 59, 64], ink: '#a43540', light: '#ed9e95', short: 'Key' },
};
const linen = [242, 227, 195];
const ink = '#2e2831';
const berry = '#8e2944';
const blue = '#284b6f';
const clamp = v => Math.min(1, Math.max(0, v));
const ease = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const art = new Map();

function cached(key, width, height, paint) {
  if (!art.has(key)) {
    const canvas = createCanvas(width, height);
    paint(canvas.getContext('2d'));
    art.set(key, canvas);
  }
  return art.get(key);
}

function label(c, words, x, y, size, family = 'Sans', color = ink, weight = 400, align = 'left') {
  c.fillStyle = color;
  c.font = `${weight} ${size}px "Lesson ${family}"`;
  c.textAlign = align;
  c.fillText(words, x, y);
}

function line(c, x, y, x2, y2, color, weight = 1) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.lineWidth = weight;
  c.strokeStyle = color;
  c.stroke();
}

function ellipse(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}

function studio() {
  return cached('table', 1920, 1080, c => {
    const wash = c.createLinearGradient(220, 0, 1340, 1450);
    wash.addColorStop(0, '#f4e8db');
    wash.addColorStop(0.56, '#ece1db');
    wash.addColorStop(1, '#d8c8c6');
    c.fillStyle = wash;
    c.fillRect(0, 0, 1920, 1080);
    // A faint tooth in the mounting board catches the window light.
    let seed = 98125;
    const noise = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    c.fillStyle = '#7759550e';
    for (let i = 0; i < 24000; i++) {
      c.fillRect(noise() * 1920, noise() * 1080, 1 + noise() * 2.5, 1);
    }
  });
}

// Each source supplies its own dyed yarn. Two-over, two-under twill makes
// the warp and weft visible inside a check. The two cloths have different setts.
const clothW = 802, clothH = 520, margin = 26;

function wovenCloth(refs) {
  const key = refs.map(ref => ref.id).join('.');
  return cached('cloth.' + key, clothW + 2 * margin, clothH + 2 * margin, c => {
    const colors = refs.map(ref => dyes[ref.id].rgb);
    const sett = colors.length === 3
      ? [[0, 40], [1, 7], [0, 10], [-1, 22], [2, 34], [-1, 5], [2, 9], [-1, 22], [0, 10], [1, 7], [0, 40]]
      : [[0, 35], [-1, 12], [1, 8], [-1, 25], [1, 20], [-1, 25], [1, 8], [-1, 12], [0, 35]];
    const loop = sett.flatMap(([dye, width]) => Array(width).fill(colors[dye] ?? linen));
    const data = c.createImageData(clothW, clothH);
    for (let y = 0; y < clothH; y++) {
      const weft = loop[(y + 62) % loop.length];
      const pick = Math.floor(y / 3);
      for (let x = 0; x < clothW; x++) {
        const i = 4 * (clothW * y + x);
        const warp = loop[(x + 13 + Math.round(1.5 * Math.sin(y / 60))) % loop.length];
        const onTop = (Math.floor(x / 3) + pick) % 4 < 2;
        const cross = onTop ? x % 3 : y % 3;
        const light = [0.9, 1.055, 1][cross] + 0.02 * Math.sin(x / 32 + y / 85);
        const warpShare = onTop ? 0.90 : 0.10;
        for (let channel = 0; channel < 3; channel++) {
          data.data[i + channel] = mix(weft[channel], warp[channel], warpShare) * light;
        }
        data.data[i + 3] = 255;
      }
    }
    c.putImageData(data, margin, margin);
    for (let x = 1; x < clothW; x += 3) {
      const rgb = loop[(x + 13) % loop.length];
      const color = 'rgb(' + rgb.join(',') + ')';
      const len = 9 + 7 * Math.sin(x * 0.61) + 3 * Math.cos(x * 0.089);
      line(c, x + margin, margin, x + margin - 2, margin - len * 0.6, color, 2);
      line(c, x + margin, clothH + margin - 1, x + margin + 2 * Math.sin(x), clothH + margin + len, color, 2);
    }
    for (let y = 0; y < clothH; y += 3) {
      const color = 'rgb(' + loop[(y + 62) % loop.length].join(',') + ')';
      const len = 4 + 3 * Math.cos(y);
      line(c, margin - len, margin + y, margin + 1, margin + y, color, 2);
      line(c, clothW + margin - 1, margin + y, clothW + margin + len, margin + y + 1, color, 2);
    }
  });
}

function sewnLabel(c, refs, isOriginal, checked) {
  const x = -364, y = 32, width = 728, h = 172;
  c.save();
  c.rotate(-0.009);
  c.shadowColor = '#1d102556';
  c.shadowBlur = 5;
  c.shadowOffsetY = 4;
  c.fillStyle = '#f6edd6';
  c.fillRect(x, y, width, h);
  c.shadowColor = 'transparent';
  for (let t = 2; t < h; t += 3) line(c, x, y + t, x + width, y + t, '#a47f4e0e', 1);
  c.strokeStyle = '#af997f';
  c.lineWidth = 1.5;
  c.setLineDash([6, 5]);
  c.strokeRect(x + 9, y + 9, width - 18, h - 18);
  c.setLineDash([]);
  label(c, isOriginal ? 'Saved incident report' : 'Fresh incident report', 0, 112, 54, 'Serif', ink, 400, 'center');
  const items = refs.map(ref => dyes[ref.id].short + ' v' + ref.revision);
  c.font = '600 35px "Lesson Sans"';
  const widths = items.map(item => c.measureText(item).width + 33);
  const gap = 29;
  let pen = -(widths.reduce((sum, w) => sum + w, 0) + gap * (items.length - 1)) / 2;
  refs.forEach((ref, i) => {
    const dye = dyes[ref.id];
    const allowed = reportAdmission([ref], after, reader);
    if (checked > i + 0.5) {
      if (allowed) {
        line(c, pen, 160, pen + 8, 168, blue, 5);
        line(c, pen + 8, 168, pen + 25, 144, blue, 5);
      } else {
        line(c, pen + 2, 145, pen + 23, 167, berry, 6);
        line(c, pen + 23, 145, pen + 2, 167, berry, 6);
      }
    } else {
      line(c, pen, 156, pen + 24, 156, dye.ink, 7);
    }
    label(c, items[i], pen + 33, 169, 35, 'Sans', ink, 600);
    pen += widths[i] + gap;
  });
  c.restore();
}

function statusTape(c, text, color, opacity) {
  if (!opacity) return;
  c.save();
  c.globalAlpha *= opacity;
  c.rotate(0.017);
  const w = text === 'Held here' ? 248 : 423;
  const x = clothW / 2 - w + 12, y = -clothH / 2 + 47;
  c.shadowColor = '#26111c60';
  c.shadowOffsetY = 4;
  c.shadowBlur = 4;
  c.fillStyle = color;
  c.fillRect(x, y, w, 81);
  c.shadowColor = 'transparent';
  line(c, x + 6, y + 6, x + w - 6, y + 6, '#ffffff56', 2);
  line(c, x + 6, y + 74, x + w - 6, y + 74, '#ffffff56', 2);
  label(c, text, x + w / 2, y + 55, 43, 'Sans', '#fff6e7', 600, 'center');
  c.restore();
}

function shuttle(c, x, y, dye) {
  c.save();
  c.translate(x, y);
  c.fillStyle = '#86522f';
  c.beginPath();
  c.moveTo(-78, 1);
  c.quadraticCurveTo(-9, -42, 83, -1);
  c.quadraticCurveTo(8, 37, -78, 1);
  c.fill();
  ellipse(c, 3, 0, 36, 12, '#452d27');
  ellipse(c, 3, -1, 25, 7, dye);
  line(c, -48, -3, -14, -11, '#ffd19b', 3);
  c.restore();
}

function swatch(c, refs, { x, y, scale, angle, woven, tag, verdict, stamp, moving, checked }) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(scale, scale);
  const left = -clothW / 2, top = -clothH / 2;
  if (woven < 1) {
    for (let i = 2; i < clothW; i += 6) {
      line(c, left + i, top + woven * clothH, left + i + 1, top + clothH + 5, '#a4958070', 2);
    }
  }
  const plies = wovenCloth(refs);
  const sourceH = Math.ceil(woven * (clothH + margin * 2));
  if (sourceH > 0) {
    c.save();
    c.shadowColor = '#38263455';
    c.shadowBlur = 15;
    c.shadowOffsetX = 6;
    c.shadowOffsetY = 13;
    c.drawImage(plies, 0, 0, plies.width, sourceH, left - margin, top - margin, plies.width, sourceH);
    c.restore();
  }
  if (moving && woven < 1) {
    const fraction = ((woven * 6) % 2);
    const phase = fraction < 1 ? fraction : 2 - fraction;
    const endX = left + 20 + (clothW - 40) * phase;
    const edgeY = top - margin + sourceH;
    line(c, left, edgeY, endX, edgeY, dyes[refs.at(-1).id].ink, 8);
    shuttle(c, endX, edgeY, dyes[refs.at(-1).id].ink);
  }
  if (tag > 0) {
    c.save();
    c.globalAlpha *= tag;
    sewnLabel(c, refs, refs.length === 3, checked);
    c.restore();
  }
  statusTape(c, verdict, verdict === 'Held here' ? berry : blue, stamp);
  c.restore();
}

function bobbin(c, x, y, id) {
  // A wooden bobbin seen from slightly above. Each winding crosses the previous layer.
  c.save();
  c.translate(x, y);
  c.rotate(-0.10);
  const dye = dyes[id];
  ellipse(c, 7, 39, 89, 14, '#5841471a');
  c.fillStyle = '#9d704b';
  c.fillRect(-84, -26, 163, 54);
  ellipse(c, -78, 0, 13, 46, '#ad805a');
  ellipse(c, -82, -1, 10, 44, '#dac09c');
  const thread = c.createLinearGradient(0, -38, 0, 40);
  thread.addColorStop(0, dye.ink);
  thread.addColorStop(0.32, dye.light);
  thread.addColorStop(0.58, 'rgb(' + dye.rgb.join(',') + ')');
  thread.addColorStop(1, dye.ink);
  c.fillStyle = thread;
  c.beginPath();
  c.moveTo(-72, -33);
  c.quadraticCurveTo(1, -43, 69, -34);
  c.bezierCurveTo(78, -24, 78, 24, 69, 34);
  c.quadraticCurveTo(0, 41, -72, 32);
  c.bezierCurveTo(-60, 20, -60, -21, -72, -33);
  c.fill();
  c.save();
  c.clip();
  for (let i = -95; i < 90; i += 4) {
    line(c, i, -44, i + 16, 44, '#fcead76b', 1.5);
    line(c, i + 29, -44, i, 44, '#38263955', 1.2);
  }
  c.restore();
  ellipse(c, 77, 0, 13, 45, '#926c50');
  ellipse(c, 80, -1, 11, 45, '#d5b28c');
  ellipse(c, 81, -1, 4, 12, '#664838');
  c.restore();
}

function yarn(c, y, targetY, dye, alpha) {
  c.save();
  c.globalAlpha *= alpha;
  for (const [offset, color, width] of [[3, '#60444432', 5], [0, dye.ink, 5], [-1, dye.light, 1.8]]) {
    c.beginPath();
    c.moveTo(188, y - 16 + offset);
    c.bezierCurveTo(250, y - 16 + offset, 259, y + 60 + offset, 388, y + 64 + offset);
    c.bezierCurveTo(735, y + 85 + offset, 795, targetY + 17 + offset, 968, targetY + offset);
    c.lineWidth = width;
    c.strokeStyle = color;
    c.stroke();
  }
  c.restore();
}

function registry(c, { withdrawal, camera, movingEdge }) {
  c.save();
  c.translate(-camera * 1060, 0);
  label(c, 'This reader’s access', 93, 153, 66, 'Serif');
  before.forEach((row, i) => {
    const y = 291 + i * 196;
    const lift = row.id === 'key' ? withdrawal : 0;
    const targetY = row.id === 'key' ? movingEdge : 314 + i * 164;
    yarn(c, y + 15, targetY, dyes[row.id], (1 - camera) * (1 - lift));
    if (lift > 0) {
      c.save();
      c.globalAlpha = lift;
      c.setLineDash([6, 6]);
      c.strokeStyle = '#9b7976';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(184, y, 91, 42, -0.10, 0, 2 * Math.PI);
      c.stroke();
      c.restore();
    }
    bobbin(c, 184 - 315 * lift, y - 17 * lift, row.id);
    label(c, row.id === 'key' ? 'Key runbook' : row.title, 321, y - 7, 47, 'Sans', ink, 600);
    const allowed = secureEligibility((withdrawal > 0 ? after : before)[i], reader);
    label(c, 'v' + row.revision + '   /   ' + (allowed ? 'Can read' : 'Withdrawn'), 321, y + 39,
      35, 'Sans', allowed ? '#514950' : berry, allowed ? 400 : 700);
  });
  c.restore();
}

function draw(c, clock) {
  const { index, elapsed } = clock;
  const afterCue = (beatIndex, phrase, span) => index > beatIndex ? 1
    : index === beatIndex ? ease(clock.reveal(phrase, span)) : 0;
  const camera = afterCue(4, 'the two documents', 1.9);
  const newWeave = afterCue(4, 'Start with those pages', 3.5);
  const withdrawal = index < 2 ? 0 : index === 2 ? ease(elapsed / 0.85) : 1;
  const oldChecked = afterCue(3, 'checks each source', 2.8) * original.length;
  const newChecked = afterCue(5, 'Both versions match', 1.2) * replacement.length;
  const oldStamp = oldHeld ? afterCue(3, 'The runbook fails', 0.55) : 0;
  const newStamp = newAdmitted ? afterCue(5, 'and both read checks pass', 0.65) : 0;
  const opening = index === 0 ? ease(elapsed / 2.6) : 1;
  const attached = index === 0 ? ease((elapsed - 2.1) / 0.65) : 1;

  c.drawImage(studio(), 0, 0);
  const woven = 0.48 + 0.52 * opening;
  const localEdge = Math.min(clothH / 2 - 5, -clothH / 2 - margin + woven * (clothH + 2 * margin));
  const movingEdge = 478 + 1.12 * (localEdge - 9);
  registry(c, { withdrawal, camera, movingEdge });
  swatch(c, original, {
    x: mix(1360, 487, camera), y: mix(478, 494, camera), scale: mix(1.12, 1, camera),
    angle: mix(0.022, -0.045, camera), woven, tag: attached,
    verdict: 'Held here', stamp: oldStamp, moving: index === 0, checked: oldChecked,
  });
  if (camera > 0) {
    swatch(c, replacement, {
      x: mix(2385, 1445, camera), y: mix(484, 492, camera), scale: 1, angle: 0.025,
      woven: newWeave, tag: ease((newWeave - 0.93) / 0.07), verdict: 'In model context',
      stamp: newStamp, moving: newWeave > 0, checked: newChecked,
    });
  }
}

export default { title, beats, draw, check };
