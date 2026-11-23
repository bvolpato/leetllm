import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { labeledId, nativeStrip, resizedStrip } from '../../../films/vision-transformers/incident.mjs';
import { C, arrow, caption, cell, cue, grid, mono, range, rect, strip, text, title } from './canvas.mjs';

// Darcet et al., ICLR 2024, Figure 8. The three equal crops preserve the photo,
// the zero-register attention map and the four-register map in the published colors.
const study = await loadImage(fileURLToPath(new URL('./register-study.png', import.meta.url)));
const tile = 151;
const leaf = { x: 125, y: 16 };
const registerNames = ['R1', 'R2', 'R3', 'R4'];
const side = 14;
const patches = range(side ** 2);
const encoder = ['CLS', ...registerNames, ...patches];
const bridge = encoder.filter(Number.isInteger);

function registerRow(c, x, y, width, height, color) {
  const pitch = width / registerNames.length;
  registerNames.forEach((name, i) => cell(c, x + pitch * i, y, pitch - 12, height, name, color, 42));
}

function studyPanel(c, panel, label, mark) {
  const x = 107 + panel * 587, y = 251, size = 485;
  text(c, label, x, y - 45, 39);
  c.imageSmoothingEnabled = false;
  c.drawImage(study, panel * tile, 0, tile, tile, x, y, size, size);
  if (mark) {
    const cx = x + (leaf.x + 0.5) * size / tile;
    const cy = y + (leaf.y + 0.5) * size / tile;
    rect(c, cx - 28, cy - 28, 56, 56, null, C.ink, 3);
  }
}

export function registerStudy(c, k) {
  const locateLeaves = cue(k, 5, 'Just leaves');
  const trained = cue(k, 5, 'four learned registers');
  const compare = cue(k, 5, 'Look at the same leaves now');
  const scoreIds = cue(k, 5, 'For our request IDs');
  title(c, 'Where does DINOv2 attend in this photo?');
  studyPanel(c, 0, 'Input photograph', locateLeaves);
  studyPanel(c, 1, 'Trained without registers', true);
  if (trained) {
    if (compare) studyPanel(c, 2, 'Trained with four registers', true);
    else {
      text(c, 'Trained with four registers', 1281, 206, 39);
      rect(c, 1281, 251, 485, 485, C.deep, C.rim);
      text(c, 'Same input photo', 1524, 494, 36, C.sub, 'center');
    }
    text(c, 'Extra encoder slots', 1281, 788, 35, C.purple);
    registerRow(c, 1281, 830, 497, 77, C.purple);
  }
  if (scoreIds) {
    text(c, 'Exact ID matches by input', 107, 789, 37);
    text(c, 'Full screenshot', 107, 849, 30, C.sub);
    text(c, 'Native crop', 608, 849, 30, C.sub);
    strip(c, resizedStrip, 107, 882, 5);
    strip(c, nativeStrip, 608, 882, 5);
    mono(c, 'Label   ' + labeledId, 107, 958, 32, C.ink);
  }
  caption(c, 'Darcet et al. (2024), figure 8  ·  DINOv2 ViT-L/14 attention maps', 107, 1022);
}

export function registerBridge(c, k) {
  const counted = cue(k, 6, 'If the bridge selects only patch features');
  const selected = cue(k, 6, 'a token-wise projector');
  const result = cue(k, 6, 'Count actual selected states');
  title(c, 'Which states does the bridge take?');
  caption(c, 'Worked example   ·   224 × 224 input   ·   16 × 16 pixels per patch', 145, 196);
  grid(c, 145, 254, side, side, 43, (r, col) =>
    r >= 3 && r <= 7 && col > 0 && col < 13 ? '#a76766' : C.plate,
  );
  text(c, patches.length + ' patches', 145, 922, 50, C.cyan);
  const auxColor = selected ? C.sub : C.purple;
  cell(c, 942, 253, 217, 92, 'CLS', selected ? C.sub : C.gold, 49);
  registerRow(c, 942, 402, 700, 92, auxColor);
  text(c, selected ? 'These five stay in the encoder' : 'Class token and learned registers', 942, 550, 39, auxColor);
  if (counted) {
    mono(c, patches.length + ' + 1 + ' + registerNames.length + ' = ' + encoder.length, 942, 671, 53);
  }
  if (selected) {
    arrow(c, 755, 806, 920, 806, C.cyan);
    text(c, 'Patch-only bridge', 956, 809, 43);
    if (result) mono(c, bridge.length + ' visual slots', 955, 920, 57, C.cyan);
  }
}

export function checkRegisters() {
  assert.equal(study.width, 3 * tile);
  assert.equal(study.height, tile);
  const ctx = createCanvas(study.width, tile).getContext('2d');
  ctx.drawImage(study, 0, 0);
  // Yellow on the original map, dark purple at the same leaves with registers.
  const green = (panel, x, y) => ctx.getImageData(panel * tile + x, y, 1, 1).data[1];
  assert.ok(green(1, leaf.x, leaf.y) > 180 && green(2, leaf.x, leaf.y) < 20);
  assert.ok(green(2, 108, 70) > 145 && green(1, 108, 70) < 60);
  assert.equal(encoder.length, 201);
  assert.deepEqual(bridge, patches);
  assert.deepEqual(encoder.filter((slot) => !bridge.includes(slot)), ['CLS', ...registerNames]);
}
