import assert from 'node:assert/strict';
import {
  boundary,
  drillRun,
  nextDrillGroup,
} from '../../../films/training-run-operations/boundaries.mjs';
import { specimen } from './samples.mjs';

const run = boundary(drillRun);
const groups = Array.from({ length: drillRun.rounds }, (_, i) =>
  nextDrillGroup(run.saved + i * run.perRound),
);
const first = nextDrillGroup(run.saved);
const late = nextDrillGroup(run.live);
const restoredCursor = run.live - drillRun.finished * run.perRound;
const restored = nextDrillGroup(restoredCursor);
const matches = restored.filter((id, i) => id === first[i]).length;

const beats = [
  {
    id: 'first-image',
    say: 'The run on the left kept going. The one on the right restarted from the same weights. How did the first image change from a striped sweater to a high-top?',
    hold: 0.9,
  },
  {
    id: 'at-the-save',
    say: 'Back up to the save. Both loaders follow this same order. At the end of update seventy-three, the workers had used seventeen hundred fifty-two images. The checkpoint recorded that count. The sweater was next.',
    hold: 0.6,
  },
  {
    id: 'two-reads',
    say: 'Each worker takes one row. They read six images between them, then six more. The workers add up the gradients in memory. Look at the two empty slots. It takes four groups to make one weight update.',
    hold: 0.8,
  },
  {
    id: 'power-loss',
    say: 'Cut the power here. The partial gradients disappear. The checkpoint still holds the weights from update seventy-three. Where was the cursor when the workers stopped?',
    hold: 0.75,
  },
  {
    id: 'at-the-shoe',
    say: "Start the loader at that last count. There's the shoe, two groups ahead. Those twelve images never got to change the weights. Which group should the restart read first?",
    hold: 1.5,
  },
  {
    id: 'rewind',
    say: "Load the cursor saved with the weights. That takes us back two groups. Let's see what each worker actually gets.",
    hold: 0.55,
  },
  {
    id: 'first-group',
    say: "There's the sweater. Now compare the whole group. Worker zero gets the jeans and the bag, too. Check the row underneath. All six sample IDs match the run we kept going.",
    hold: 2.6,
  },
];

const ink = '#262c39';
const faintInk = '#58575b';
const cursorInk = '#a03e29';
const lineInk = '#b7ad9e';
const sheet = '#faf4e8';
const groupLeft = (i) => 102 + i * 441;
const groupWidth = 385;
const format = (n) => n.toLocaleString('en-US');
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (n) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

function label(ctx, s, x, y, size, family = 'Sans', color = ink, align = 'left', weight = 400) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Lesson ${family}"`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = align;
  ctx.fillText(String(s), x, y);
}
function stroke(ctx, x, y, ex, ey, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
}
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function paper(ctx) {
  const wash = ctx.createLinearGradient(0, 0, 1800, 1080);
  wash.addColorStop(0, '#f7f1e5');
  wash.addColorStop(0.55, '#f2eadc');
  wash.addColorStop(1, '#e8dcca');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 1920, 1080);
}
function photo(ctx, id, x, y, size) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(specimen(id), Math.round(x), Math.round(y), Math.round(size), Math.round(size));
}
function rule(ctx, x, y, width, color) {
  stroke(ctx, x, y, x + width, y, color);
}

function output(ctx, { x, name, ids, zoom, scan = 1 }) {
  const width = 810;
  label(ctx, name, x + width / 2, 221, 44, 'Sans', ink, 'center', 600);
  const tile = mix(490, 184, zoom);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 252, width, 597);
  ctx.clip();

  for (let i = 0; i < ids.length; i++) {
    const col = i % drillRun.sequences;
    const row = Math.floor(i / drillRun.sequences);
    const targetX = x + 157 + col * 201;
    const targetY = 268 + row * 253;
    const px = mix(x + (width - tile) / 2 + col * 540, targetX, zoom);
    const py = mix(264 + row * 620, targetY, zoom);
    ctx.save();
    if (i > 0) ctx.globalAlpha = smooth((zoom - 0.32) / 0.5);
    const reveal = i === 0 ? scan : 1;
    if (reveal < 1) {
      rect(ctx, px, py, tile, tile, '#d9cdbb');
      ctx.beginPath();
      ctx.rect(px, py, tile, tile * reveal);
      ctx.clip();
    }
    photo(ctx, ids[i], px, py, tile);
    ctx.restore();
    if (i === 0 && reveal > 0 && reveal < 1) {
      rule(ctx, px, py + tile * reveal, tile, '#fffaee');
    }
    const opacity = i === 0 ? smooth((reveal - 0.4) / 0.6) : smooth((zoom - 0.45) / 0.4);
    ctx.save();
    ctx.globalAlpha = opacity;
    label(
      ctx,
      `ID ${ids[i]}`,
      px + tile / 2,
      py + tile + mix(66, 39, zoom),
      mix(56, 39, zoom),
      'Mono',
      ink,
      'center',
    );
    ctx.restore();
  }

  if (zoom > 0.7) {
    ctx.save();
    ctx.globalAlpha = smooth((zoom - 0.7) / 0.3);
    for (let row = 0; row < drillRun.replicas; row++) {
      label(ctx, `Worker ${row}`, x + 142, 374 + row * 253, 32, 'Sans', faintInk, 'right');
    }
    ctx.restore();
  }
  ctx.restore();
}

function comparison(ctx, clock, matched) {
  label(ctx, `First read after update ${drillRun.step}`, 100, 129, 85, 'Serif');
  rule(ctx, 100, 165, 1720, lineInk);
  stroke(ctx, 960, 189, 960, 832, lineInk);
  const zoom = matched ? smooth(clock.reveal('compare the whole group', 1.65)) : 0;
  const scan = matched ? 1 : smooth(clock.elapsed / 1.1);
  output(ctx, { x: 104, name: 'Uninterrupted run', ids: first, zoom });
  output(ctx, { x: 1007, name: 'Restart', ids: matched ? restored : late, zoom, scan });
  if (matched) {
    const confirmed = smooth(clock.reveal('All six', 0.48));
    ctx.save();
    ctx.globalAlpha = confirmed;
    label(
      ctx,
      `${matches} of ${first.length} sample IDs match`,
      960,
      902,
      48,
      'Serif',
      ink,
      'center',
    );
    ctx.restore();
  }
}

function samplerState(clock) {
  const { id } = clock.beat;
  if (id === 'at-the-save') return { position: 0, accumulated: 0, tag: 'Next read' };
  if (id === 'two-reads') {
    const one = smooth(clock.reveal('They read six images', 1.2));
    const two = smooth(clock.reveal('then six more', 1.2));
    return { position: one + two, accumulated: one + two, tag: 'Next read' };
  }
  if (id === 'power-loss') {
    const loss = smooth(clock.elapsed / 0.75);
    return {
      position: drillRun.finished,
      accumulated: drillRun.finished,
      tag: 'Last live cursor',
      loss,
    };
  }
  if (id === 'at-the-shoe') {
    return {
      position: drillRun.finished,
      accumulated: 0,
      tag: 'Restart cursor',
      selected: drillRun.finished,
      loss: 1,
      skipped: smooth(clock.elapsed / 0.6),
    };
  }
  const rewind = smooth(clock.reveal('That takes us back', 1.85));
  return {
    position: drillRun.finished * (1 - rewind),
    accumulated: 0,
    tag: 'Restart cursor',
    selected: rewind === 1 ? 0 : undefined,
    loss: 1,
    skipped: 1 - smooth(clock.elapsed / 0.5),
  };
}

function sixImages(ctx, group, selected, skipped) {
  const x = groupLeft(group);
  const top = 251;
  // Each block contains both replicas at one place in the deterministic sampler order.
  rect(ctx, x + 3, top + 5, groupWidth, 365, '#b3a38c4a');
  rect(ctx, x, top, groupWidth, 365, sheet);
  const cursor = run.saved + group * run.perRound;
  label(ctx, `${format(cursor)} read`, x + 16, top + 53, 43, 'Mono');
  rule(ctx, x + 15, top + 73, groupWidth - 30, lineInk);
  for (const [i, id] of groups[group].entries()) {
    const tile = 115;
    const px = x + 14 + (i % drillRun.sequences) * 121;
    const py = top + 89 + Math.floor(i / drillRun.sequences) * 130;
    photo(ctx, id, px, py, tile);
    if (skipped > 0) {
      ctx.save();
      ctx.globalAlpha = skipped * 0.62;
      rect(ctx, px, py, tile, tile, sheet);
      ctx.restore();
    }
    if (selected && i === 0) {
      ctx.strokeStyle = cursorInk;
      ctx.lineWidth = 5;
      ctx.strokeRect(px - 2, py - 2, tile + 4, tile + 4);
    }
  }
}

function accumulation(ctx, amount, loss) {
  const x = 995;
  label(
    ctx,
    loss === 1 ? 'Worker memory cleared' : 'Gradients in worker memory',
    x,
    749,
    44,
    'Sans',
  );
  const y = 783;
  for (let i = 0; i < drillRun.rounds; i++) {
    const left = x + i * 109;
    const fill = clamp(amount - i);
    rect(ctx, left, y, 99, 48, '#cfc7b9');
    ctx.save();
    ctx.globalAlpha = 1 - loss;
    rect(ctx, left, y, 99 * fill, 48, '#554971');
    if (fill > 0.01) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(left, y, 99 * fill, 48);
      ctx.clip();
      for (let j = -50; j < 101; j += 13)
        stroke(ctx, left + j, y + 49, left + j + 44, y, '#b5a8c0', 2);
      ctx.restore();
    }
    ctx.restore();
  }
  const count = loss === 1 ? 0 : Math.min(drillRun.rounds, Math.floor(amount + 1e-8));
  label(ctx, `${count} / ${drillRun.rounds} groups`, x + 455, y + 38, 40, 'Mono', faintInk);
}

function sampler(ctx, clock) {
  const state = samplerState(clock);
  label(ctx, 'Images in sampler order', 100, 129, 85, 'Serif');
  rule(ctx, 100, 165, 1720, lineInk);
  for (let i = 0; i < groups.length; i++) {
    sixImages(ctx, i, i === state.selected, i < drillRun.finished ? state.skipped : 0);
  }
  if (state.skipped > 0) {
    ctx.save();
    ctx.globalAlpha = state.skipped;
    const left = groupLeft(0);
    const right = groupLeft(drillRun.finished - 1) + groupWidth;
    label(
      ctx,
      `${run.pending} images skipped`,
      (left + right) / 2,
      219,
      36,
      'Sans',
      cursorInk,
      'center',
      600,
    );
    rule(ctx, left + 3, 232, right - left - 6, cursorInk);
    for (const x of [left + 3, right - 3]) stroke(ctx, x, 232, x, 246, cursorInk);
    ctx.restore();
  }

  const marker = groupLeft(state.position) + groupWidth / 2;
  label(ctx, state.tag, marker, 219, 35, 'Sans', cursorInk, 'center', 600);
  ctx.fillStyle = cursorInk;
  ctx.beginPath();
  ctx.moveTo(marker - 10, 228);
  ctx.lineTo(marker + 10, 228);
  ctx.lineTo(marker, 243);
  ctx.fill();

  // The saved bookmark stays attached to the first unread group throughout the crash.
  const anchor = groupLeft(0) + groupWidth / 2;
  stroke(ctx, anchor, 616, anchor, 668, ink, 3);
  stroke(ctx, anchor, 668, 116, 668, ink, 3);
  stroke(ctx, 116, 668, 116, 707, ink, 3);
  rect(ctx, anchor - 6, 614, 12, 7, ink);
  label(ctx, 'Checkpoint on disk', 100, 749, 39, 'Sans');
  label(ctx, `Update ${drillRun.step}  ·  ${format(run.saved)} read`, 100, 825, 53, 'Serif');
  accumulation(ctx, state.accumulated, state.loss ?? 0);
}

function draw(ctx, clock) {
  ctx.save();
  paper(ctx);
  if (clock.beat.id === 'first-image' || clock.beat.id === 'first-group') {
    comparison(ctx, clock, clock.beat.id === 'first-group');
  } else {
    sampler(ctx, clock);
  }
  ctx.restore();
}

function check() {
  assert.deepEqual(
    [run.perRound, run.perUpdate, run.saved, run.pending, run.live],
    [6, 24, 1752, 12, 1764],
  );
  assert.equal(run.live - run.saved, drillRun.finished * run.perRound);
  assert.deepEqual(first, [42, 17, 63, 8, 91, 34]);
  assert.deepEqual(late, [55, 28, 70, 16, 82, 39]);
  assert.equal(first.filter((id, i) => id === late[i]).length, 0);
  const settled = (id) => samplerState({ beat: { id }, elapsed: 10, reveal: () => 1 });
  const read = settled('two-reads');
  assert.equal(read.accumulated, 2);
  assert.equal(run.saved + read.position * run.perRound, run.live);
  assert.equal(settled('power-loss').loss, 1);
  assert.deepEqual(groups[settled('at-the-shoe').selected], late);
  assert.deepEqual(groups[settled('rewind').selected], restored);
  assert.equal(restoredCursor, run.saved);
  assert.equal(matches, run.perRound);
  for (let r = 0; r < drillRun.replicas; r++) {
    const i = r * drillRun.sequences;
    assert.deepEqual(
      restored.slice(i, i + drillRun.sequences),
      first.slice(i, i + drillRun.sequences),
    );
  }
  assert.equal(new Set(groups.flat()).size, run.perUpdate);
  for (const id of groups.flat()) assert.equal(specimen(id).width, 72);
  return true;
}

export default { title: 'Where did that shoe come from?', beats, draw, check };
