import { cueProgress, fieldDrawing } from '../field-drawing.mjs';

const modelCardDate = 'Model cards · September 2026';
const gemmaCounts = [
  { name: 'E2B', effective: 2.3, total: 5.1 },
  { name: 'E4B', effective: 4.5, total: 8 },
];

function drawContext(p, longer) {
  const { C, text, rect, target } = p;
  target('model-spec', () => {
    text('Phi-4-mini-instruct', 150, 275, 46);
    text('128K', 140, 552, 164, C.cyan);
    text('tokens of supported context', 150, 623, 41);
    text('3.8B parameters  ·  GQA', 150, 732, 33, C.muted);
    text('Shared input and output embeddings', 150, 784, 33, C.muted);
  });
  target('prompt-trial', () => {
    text('Prompt lengths to test on the handheld', 925, 365, 41);
    [4000, 8000].forEach((length, i) => {
      if (i === 1 && longer === 0) return;
      const y = 464 + i * 172;
      text(length.toLocaleString('en-US') + ' tokens', 925, y, 42);
      rect(925, y + 28, (length / 8000) * 790 * (i === 0 ? 1 : longer), 38, C.blue);
    });
    if (longer === 1) text('Record peak RAM for each run.', 925, 809, 39, C.yellow);
  });
}

function drawCounts(p, effective, tables, large) {
  const { C, text, rect, target } = p;
  text('Gemma 4', 150, 265, 46);
  text('Parameter count', 450, 365, 38, C.muted);
  const scale = 140;
  gemmaCounts.forEach(({ name, effective: base, total }, i) => {
    const y = 440 + i * 216;
    const baseProgress = i === 0 ? effective : large;
    const tableProgress = i === 0 ? tables : large;
    target(i === 0 ? 'gemma-small' : 'gemma-large', () => {
      text(name, 150, y + 52, 58);
      rect(450, y, 8 * scale, 68, C.panel);
      if (baseProgress > 0) rect(450, y, base * scale * baseProgress, 68, C.blue);
      if (tableProgress > 0)
        rect(
          450 + base * scale * baseProgress,
          y,
          (total - base) * scale * tableProgress,
          68,
          C.green,
        );
      if (baseProgress === 1) text(base + 'B effective', 450, y + 133, 38, C.blue);
      if (tableProgress === 1)
        text(total + 'B including embeddings', 450 + total * scale, y + 133, 38, C.green, 'right');
    });
  });
  if (tables === 1)
    text('The bundle carries the whole lookup table.', 960, 932, 42, C.ink, 'center');
}

function drawGeneration(p, { thinking, remaining, cut, direct, fits }) {
  const { C, text, rect, line, target } = p;
  const start = 480;
  const step = 246;
  const cap = 4;
  const hidden = 3;
  text('Qwen3-1.7B', 150, 268, 46);
  text('28 layers  ·  16 query / 8 KV heads  ·  32,768 context', 1760, 264, 32, C.muted, 'right');
  target('token-cap', () => {
    text('Example output cap: ' + cap + ' tokens', start, 385, 42);
    const boundary = start + cap * step - 8;
    line(boundary, 413, boundary, 819, C.yellow, 4);
  });
  const lane = (id, name, y, thinkingMode) =>
    target(id, () => {
      text(name, 145, y + 63, 41);
      for (let i = 0; i < cap; i++) {
        const inside = thinkingMode ? i < Math.ceil(hidden * thinking) : false;
        const answer = thinkingMode ? i === hidden && remaining : i < 2 && fits;
        const color = inside ? C.blue : answer ? C.green : C.muted;
        rect(start + i * step, y, step - 23, 105, C.panel, color, 10);
        if (inside || answer) {
          const label = inside ? 'thinking' : 'answer ' + (thinkingMode ? 1 : i + 1);
          text(label, start + i * step + (step - 23) / 2, y + 65, 37, color, 'center');
        }
      }
      if (thinkingMode && cut) {
        text('answer 2', 1590, y + 47, 36, C.muted, 'center');
        text('cut off', 1590, y + 92, 31, C.pink, 'center');
      }
    });
  lane('thinking-lane', 'Thinking on', 467, true);
  if (direct) lane('direct-lane', 'Thinking off', 687, false);
  text('Requested answer: two visible tokens', start, 919, 40);
}

export function drawDatedModels(ctx, scene, state, api) {
  const p = fieldDrawing(ctx, api);
  const b = state.beat ?? 0;
  const cue = (id, beat, from, to) => cueProgress(state, id, beat, from, to);
  if (b === 0) drawContext(p, cue('long-prompt', 0, 0.5, 0.6));
  else if (b === 1)
    drawCounts(
      p,
      cue('gemma-effective', 1, 0.1, 0.19),
      cue('gemma-tables', 1, 0.33, 0.47),
      cue('gemma-large', 1, 0.49, 0.59),
    );
  else
    drawGeneration(p, {
      thinking: cue('thinking-tokens', 2, 0.57, 0.72),
      remaining: cue('one-token', 3, 0.01, 0.07) === 1,
      cut: cue('answer-cut', 3, 0.13, 0.32) === 1,
      direct: cue('direct-mode', 3, 0.34, 0.54) > 0,
      fits: cue('both-fit', 3, 0.55, 0.63) === 1,
    });
  p.text(modelCardDate, 1760, 1010, 27, p.C.muted, 'right');
}

export default {
  id: 'dated-models',
  draw: drawDatedModels,
  cues: [
    'phi-spec',
    'long-prompt',
    'gemma-effective',
    'gemma-tables',
    'gemma-large',
    'qwen-cap',
    'thinking-tokens',
    'one-token',
    'answer-cut',
    'direct-mode',
    'both-fit',
  ],
};
