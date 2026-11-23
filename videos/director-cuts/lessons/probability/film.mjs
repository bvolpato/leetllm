import assert from 'node:assert/strict';
import { broad, population } from '../../../films/probability/fixtures.mjs';
import { clamp, mix, smooth } from '../../../films/probability/arithmetic.mjs';

const title = 'Pick a light';
const beats = [
  {
    id: 'open-the-shutter',
    say: 'Watch the shutter open. Each little square is a signup we already know was abusive. Wherever the detector raised a flag, light comes through. Can you find the five it missed?',
    hold: 1.45,
  },
  {
    id: 'turn-the-question',
    say: 'The detector caught ninety-five of the hundred abusive signups. Now suppose you pick a flag at random from the whole batch. What are the chances it caught abuse?',
    hold: 1.4,
  },
  {
    id: 'second-plate',
    say: 'Slide a plate of clean signups alongside it. These hundred have five holes. A reviewer would get those five signups too.',
    hold: 0.8,
  },
  {
    id: 'open-the-file',
    say: 'The batch had nine thousand nine hundred clean signups. Five percent got flags. I’ve arranged them in hundreds, five lights to a plate. Look how many plates that takes.',
    hold: 1.3,
  },
  {
    id: 'gather-the-light',
    say: 'Follow the amber lights onto the strip. Here come all those little groups of five. How far along the strip does the amber reach?',
    hold: 1.2,
  },
  {
    id: 'read-the-print',
    say: 'Ninety-five amber. Four hundred ninety-five clean. If every flag has the same chance of being picked, your pick can land on any of these five hundred ninety lights.',
    hold: 0.8,
  },
  {
    id: 'pick-a-light',
    say: 'See how much of the strip is amber? That’s the chance of abuse given a flag. In this batch, about one flag in six caught abuse.',
    hold: 2.6,
  },
];

const perPlate = 100;
const cleanPlates = population.clean / perPlate;
const cleanPerPlate = broad.fp / cleanPlates;
const totalFlags = broad.tp + broad.fp;
const palette = {
  ink: '#1c292b',
  mute: '#42565a',
  amber: '#ffc75a',
  mint: '#a9f1e6',
  amberInk: '#7a380a',
  mintInk: '#15544e',
};

// Reorder the audited batch for counting. Each clean plate holds a group of five
// flags in the shape of five pips on a die.
const plates = Array.from({ length: 1 + cleanPlates }, (_, n) => {
  if (n === 0) return Array.from({ length: broad.tp }, (_, i) => i);
  const col = 1 + (n * 3) % 5;
  const row = 1 + (n * 7) % 5;
  const corner = row * 10 + col;
  return [corner, corner + 2, corner + 11, corner + 20, corner + 22];
});
const lights = plates.flatMap((slots, plate) => slots.map(slot => ({ plate, slot })));

const finalFrameCount = Math.ceil(lights.length / perPlate);
const sheet = { x: 90, y: 351, w: 1740, h: 330 };
const frameWidth = sheet.w / finalFrameCount;

function printSite(index) {
  // Keep the original amber exposure intact, including its five dark squares.
  // Start the clean exposures in a fresh frame of the same size.
  const position = index < broad.tp ? index : perPlate + index - broad.tp;
  const frame = Math.floor(position / perPlate);
  const within = position % perPlate;
  return {
    frame,
    x: sheet.x + frameWidth * (frame + 0.5) + (within % 10 - 4.5) * 22,
    y: sheet.y + sheet.h / 2 + (Math.floor(within / 10) - 4.5) * 22,
  };
}

function check() {
  assert.equal(plates.length * perPlate, population.abusive + population.clean);
  assert.equal(plates[0].length, broad.tp);
  assert.equal(perPlate - plates[0].length, 5);
  for (const slots of plates) {
    assert.equal(new Set(slots).size, slots.length);
    assert(slots.every(slot => Number.isInteger(slot) && slot >= 0 && slot < perPlate));
  }
  assert.equal(cleanPlates, 99);
  assert(plates.slice(1).every(slots => slots.length === cleanPerPlate));
  assert.equal(cleanPerPlate / perPlate, 0.05);
  assert.equal(lights.length, 590);
  assert.equal(lights.filter(light => light.plate > 0).length, broad.fp);
  const print = lights.map((_, i) => printSite(i));
  assert.equal(new Set(print.map(p => p.x + ',' + p.y)).size, totalFlags);
  assert(print.slice(0, broad.tp).every(p => p.frame === 0));
  assert(print.slice(broad.tp).every(p => p.frame >= 1));
  assert.equal(print.at(-1).frame, 5);
  assert.equal((100 * broad.tp / totalFlags).toFixed(1), '16.1');
}

function label(ctx, value, x, y, size, color, family = 'Sans', align = 'center', weight = 400) {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x, y);
}

function rounded(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function circle(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function withOpacity(ctx, opacity, paint) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha *= opacity;
  paint();
  ctx.restore();
}

function ramp(seconds, start, length) {
  return smooth((seconds - start) / length);
}

function after(clock, beat, duration) {
  if (clock.index < beat) return 0;
  if (clock.index > beat) return 1;
  return ramp(clock.elapsed, 0, duration);
}

function bench(ctx) {
  ctx.fillStyle = '#273333';
  ctx.fillRect(0, 0, 1920, 1080);
  rounded(ctx, 21, 24, 1878, 1034, 35, '#79817a');
  rounded(ctx, 27, 31, 1866, 1020, 30, '#485853');
  const glass = ctx.createRadialGradient(725, 397, 35, 850, 480, 1160);
  glass.addColorStop(0, '#f6edd1');
  glass.addColorStop(0.62, '#e6e0c8');
  glass.addColorStop(1, '#b4beb1');
  rounded(ctx, 46, 49, 1828, 978, 21, glass);
  // Fixed grain in the ground glass stays put as the emulsion moves over it.
  ctx.fillStyle = 'rgba(70,75,60,.09)';
  for (let n = 0; n < 950; n++) {
    const x = 56 + (n * 3271 % 1807);
    const y = 61 + (n * 859 % 949);
    ctx.fillRect(x, y, n % 4 + 1, 1.5);
  }
  for (const x of [24, 1895]) {
    for (const y of [60, 1021]) {
      circle(ctx, x, y, 8, '#293330');
      circle(ctx, x, y - 1, 6, '#adb0a0');
      ctx.fillStyle = '#444d46';
      ctx.fillRect(x - 4, y - 2, 8, 2);
    }
  }
}

function pose(x, y, size) {
  return { x, y, size };
}

function between(a, b, t) {
  return pose(mix(a.x, b.x, t), mix(a.y, b.y, t), mix(a.size, b.size, t));
}

const hero = pose(960, 500, 760);
const left = pose(532, 508, 580);
const right = pose(1375, 508, 580);
const amberInFile = pose(475, 496, 462);

function rack(i) {
  const col = i % 11;
  const row = Math.floor(i / 11);
  return pose(863 + 79 * col, 205 + 78 * row, 69);
}

function plateSite(p, slot) {
  const step = p.size * 0.073;
  return {
    x: p.x + (slot % 10 - 4.5) * step,
    y: p.y + (Math.floor(slot / 10) - 4.5) * step + p.size * 0.004,
  };
}

function plateBody(ctx, n, p, shutter = 1) {
  const s = p.size;
  const x = p.x - s / 2;
  const y = p.y - s / 2;
  const amber = n === 0;
  rounded(ctx, x + s * 0.008, y + s * 0.014, s, s, s * 0.024, 'rgba(25,34,29,.22)');
  const acetate = ctx.createLinearGradient(x, y, x + s, y + s);
  acetate.addColorStop(0, amber ? '#5d3729' : '#264749');
  acetate.addColorStop(0.42, amber ? '#302829' : '#182f33');
  acetate.addColorStop(1, amber ? '#422d28' : '#294244');
  rounded(ctx, x, y, s, s, s * 0.024, acetate);
  if (s > 160) {
    ctx.strokeStyle = 'rgba(245,237,208,.20)';
    ctx.lineWidth = s * 0.002;
    ctx.strokeRect(x + s * 0.025, y + s * 0.025, s * 0.95, s * 0.95);
    for (const side of [0.036, 0.938]) {
      for (let k = 0; k < 5; k++) {
        rounded(ctx, x + s * side, y + s * (0.17 + k * 0.156), s * 0.026, s * 0.051, s * 0.007, '#dcdac2');
      }
    }
    const step = s * 0.073;
    ctx.fillStyle = amber ? '#62483c' : '#354f4f';
    for (let i = 0; i < perPlate; i++) {
      const a = plateSite(p, i);
      ctx.fillRect(a.x - step * 0.43, a.y - step * 0.43, step * 0.86, step * 0.86);
    }
    label(ctx, amber ? '100 abusive signups' : '100 clean signups', p.x, y + s * 0.084, s * 0.063, '#fff4d8', 'Sans', 'center', 600);
  }
  if (shutter < 1) {
    const edge = x + s * shutter;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, s, s);
    ctx.clip();
    const blind = ctx.createLinearGradient(edge - 10, 0, edge + 16, 0);
    blind.addColorStop(0, 'rgba(22,23,23,0)');
    blind.addColorStop(0.5, 'rgba(20,23,23,.7)');
    blind.addColorStop(1, 'rgba(24,28,28,.92)');
    ctx.fillStyle = blind;
    ctx.fillRect(edge - 10, y + 0.13 * s, s, 0.75 * s);
    ctx.fillStyle = 'rgba(255,228,166,.48)';
    ctx.fillRect(edge - 2, y + 0.13 * s, 2, 0.75 * s);
    ctx.restore();
  }
}

function dot(ctx, x, y, r, amber) {
  circle(ctx, x, y, r, amber ? palette.amber : palette.mint);
  if (r > 5) {
    circle(ctx, x - r * 0.12, y - r * 0.15, r * 0.68, amber ? '#ffe2a0' : '#d5fff2');
  }
}

function lightRadius(p) {
  return Math.max(2.25, p.size * 0.0244);
}

function plateLights(ctx, n, p, shutter) {
  for (const slot of plates[n]) {
    const a = plateSite(p, slot);
    const light = clamp((p.x + p.size * (shutter - 0.5) - a.x) / (p.size * 0.04));
    if (light > 0) withOpacity(ctx, light, () => dot(ctx, a.x, a.y, lightRadius(p), n === 0));
  }
}

function framePrint(ctx) {
  const { x, y, w, h } = sheet;
  rounded(ctx, x + 4, y + 10, w, h, 7, 'rgba(26,35,32,.25)');
  rounded(ctx, x, y, w, h, 6, '#242d2d');
  for (let frame = 0; frame < finalFrameCount; frame++) {
    const u = x + frameWidth * frame;
    rounded(ctx, u + 10, y + 43, frameWidth - 20, h - 86, 3, '#121f21');
    for (let k = 0; k < 6; k++) {
      const dx = u + 14 + k * 47;
      for (const dy of [12, h - 30]) {
        rounded(ctx, dx, y + dy, 24, 16, 4, '#dad8be');
      }
    }
  }
}

function brace(ctx, x, end, y, color) {
  ctx.beginPath();
  ctx.moveTo(x, y + 14);
  ctx.lineTo(x, y);
  ctx.lineTo(end, y);
  ctx.lineTo(end, y + 14);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function draw(ctx, clock) {
  bench(ctx);
  const pair = after(clock, 1, 1.55);
  const second = after(clock, 2, 1.65);
  const file = after(clock, 3, 2.2);
  const gather = after(clock, 4, 7.1);
  const shutter = after(clock, 0, 1.75);
  const origin = between(between(hero, left, pair), amberInFile, file);
  const firstClean = between(between(pose(2230, 561, right.size), right, second), rack(0), file);
  const locations = [origin, firstClean];
  for (let i = 1; i < cleanPlates; i++) {
    const parked = rack(i);
    locations.push(pose(parked.x + (1 - file) * (960 + (i % 11) * 27), parked.y, parked.size));
  }

  if (gather < 1) {
    withOpacity(ctx, 1 - smooth(gather / 0.72), () => {
      if (file > 0) {
        withOpacity(ctx, file, () => {
          for (let n = 2; n < plates.length; n++) plateBody(ctx, n, locations[n]);
        });
      }
      if (second > 0) plateBody(ctx, 1, firstClean);
      plateBody(ctx, 0, origin, shutter);
    });
    if (gather === 0) {
      plateLights(ctx, 0, origin, shutter);
      if (second > 0) plateLights(ctx, 1, firstClean, 1);
      if (file > 0) withOpacity(ctx, file, () => {
        for (let n = 2; n < plates.length; n++) plateLights(ctx, n, locations[n], 1);
      });
    }
  }

  if (clock.index === 0) {
    const mark = clock.reveal('Can you find', 0.65);
    withOpacity(ctx, mark, () => {
      const first = plateSite(origin, broad.tp);
      const last = plateSite(origin, perPlate - 1);
      brace(ctx, first.x - 19, last.x + 19, last.y + 38, palette.amber);
    });
  }
  if (clock.index === 1) {
    const show = clock.reveal('ninety-five of the hundred', 0.45);
    withOpacity(ctx, show, () => {
      label(ctx, '95 / 100', right.x, 470, 129, palette.ink, 'Serif');
      label(ctx, 'abusive signups flagged', right.x, 582, 42, palette.ink);
    });
  }
  if (clock.index === 2) {
    const count = clock.reveal('five holes', 0.42);
    label(ctx, '95 flagged', left.x, 835, 50, palette.amberInk, 'Serif');
    withOpacity(ctx, count, () => label(ctx, '5 flagged', right.x, 835, 50, palette.mintInk, 'Serif'));
  }
  if (clock.index === 3) {
    withOpacity(ctx, smooth((file - 0.8) / 0.2), () => {
      label(ctx, '9,900 clean signups', 1258, 898, 54, palette.mintInk, 'Serif');
    });
  }
  if (clock.index < 4) return;
  withOpacity(ctx, smooth(gather / 0.60), () => framePrint(ctx));
  for (let i = 0; i < lights.length; i++) {
    const { plate, slot } = lights[i];
    const source = plateSite(locations[plate], slot);
    const end = printSite(i);
    const delay = plate === 0 ? 0 : 0.15 + 0.38 * plate / cleanPlates;
    const path = smooth((gather - delay) / (1 - delay));
    const x = mix(source.x, end.x, path);
    const y = mix(source.y, end.y, path) - 80 * Math.sin(Math.PI * path);
    const radius = mix(lightRadius(locations[plate]), 7.8, path);
    if (path > 0 && path < 1) {
      circle(ctx, x, y, radius + 1.8, plate === 0 ? '#92653f' : '#518180');
    }
    dot(ctx, x, y, radius, plate === 0);
  }
  if (clock.index < 5) return;
  const labels = after(clock, 5, 0.55);
  withOpacity(ctx, labels, () => {
    const split = sheet.x + frameWidth;
    label(ctx, '95 abusive', sheet.x + frameWidth / 2, 242, 60, palette.amberInk, 'Serif');
    label(ctx, '495 clean', (split + sheet.x + sheet.w) / 2, 242, 60, palette.mintInk, 'Serif');
    ctx.strokeStyle = palette.amberInk;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sheet.x + frameWidth / 2, 282);
    ctx.lineTo(sheet.x + frameWidth / 2, sheet.y - 9);
    ctx.stroke();
    brace(ctx, split + 8, sheet.x + sheet.w - 32, 305, palette.mintInk);
  });
  if (clock.index === 5) {
    withOpacity(ctx, clock.reveal('five hundred ninety lights', 0.4), () => {
      label(ctx, totalFlags + ' flags', 960, 822, 68, palette.ink, 'Serif');
    });
  } else {
    const result = clock.reveal('That’s the chance', 0.65);
    label(ctx, broad.tp + ' / ' + totalFlags, mix(960, 792, result), 820, 96, palette.ink, 'Serif');
    withOpacity(ctx, result, () => label(ctx, '≈ ' + (100 * broad.tp / totalFlags).toFixed(1) + '%', 1160, 820, 96, palette.amberInk, 'Serif'));
  }
}

export default { title, beats, draw, check };
