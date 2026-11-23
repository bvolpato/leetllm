import { fmt, vec } from './arithmetic.mjs';
import { circle, line, rect, text } from './defaults.mjs';

const left = 249;
const pitch = 112;
const top = 373;
const lane = 118;
const cellWidth = 94;
const cellHeight = 68;

function seat(ctx, api, token, x, y, tracked, overflow) {
  const { C } = api;
  const paper = tracked ? C.yellow : C.panel;
  const stroke = overflow ? C.red : tracked ? C.yellow : C.muted;
  rect(ctx, api, x, y, cellWidth, cellHeight, paper, stroke, 9);
  text(
    ctx,
    api,
    't' + token,
    x + cellWidth / 2,
    y + 47,
    34,
    tracked ? C.bg : C.ink,
    'center',
    'mono',
  );
  if (overflow)
    line(ctx, api, x + 8, y + cellHeight - 5, x + cellWidth - 8, y + cellHeight - 5, C.red, 6);
}

// Leave the front of every queue at the same x, including during a buffer resize.
export function drawQueues(
  ctx,
  api,
  model,
  {
    arrivals = 1,
    boundary,
    markOverflow = false,
    labelOverflow = false,
    showLoads = false,
    boundaryLabel,
    previous,
    move = 1,
    workRows,
  } = {},
) {
  const { C } = api;
  const colors = [C.blue, C.pink, C.yellow, C.green];
  api.focus.target('queue-rows', () => {
    text(ctx, api, 'Arrival order', left, 300, 31, C.muted);
    api.arrow(ctx, left + 223, 290, left + 388, 290, C.muted, 3);
    model.groups.forEach((members, expert) => {
      const y = top + expert * lane;
      text(
        ctx,
        api,
        'E' + (expert + 1),
        122,
        y + (showLoads ? 29 : 46),
        38,
        colors[expert],
        'left',
        'mono',
      );
      members.forEach((token, j) => {
        const entry = api.clamp(arrivals * model.tokens - token, 0, 1);
        if (!entry) return;
        let x = left + j * pitch;
        if (previous && move < 1) {
          const old = previous.groups[expert].indexOf(token);
          if (old < 0) return;
          const shift = expert === 0 ? api.phase(move, 0.4, 0.75) : api.phase(move, 0, 0.32);
          x = left + api.lerp(old, j, shift) * pitch;
        }
        seat(
          ctx,
          api,
          token,
          x,
          y - (1 - entry) * 25,
          token === model.token,
          markOverflow && j >= model.slots,
        );
      });
      if (showLoads) {
        const arrived = members.filter((token) => token < arrivals * model.tokens).length;
        text(ctx, api, 'load ' + arrived, 122, y + 65, 30, C.muted);
      }
      if (markOverflow && labelOverflow && model.overflow[expert] > 0) {
        const first = left + model.slots * pitch;
        const last = left + (members.length - 1) * pitch + cellWidth;
        text(
          ctx,
          api,
          model.overflow[expert] + ' overflow',
          (first + last) / 2,
          y - 18,
          33,
          C.red,
          'center',
        );
      }
    });
    if (previous && move < 1) {
      const token = model.token;
      const old = previous.terms.find((term) => !model.groups[term.expert].includes(token));
      const next = model.terms.find((term) => !previous.groups[term.expert].includes(token));
      const x = left + (api.lerp(old.slot, next.slot, api.phase(move, 0.57, 0.82)) - 1) * pitch;
      const outside = top + (model.experts - 1) * lane + cellHeight + 36;
      const y =
        move < 0.57
          ? api.lerp(top + old.expert * lane, outside, api.phase(move, 0.04, 0.57))
          : api.lerp(outside, top + next.expert * lane, api.phase(move, 0.82, 1));
      seat(ctx, api, token, x, y, true, false);
    }
  });
  if (boundary !== undefined) {
    const x = left + pitch * boundary - (pitch - cellWidth) / 2;
    api.focus.target('queue-cutoff', () => {
      if (Number.isInteger(boundary)) {
        line(ctx, api, x, top - 29, x, top + 3 * lane + cellHeight + 25, C.pink, 4);
      } else {
        // A moving limit crosses occupied seats. Keep its guide in the gutters.
        for (let e = 0; e < model.experts; e++) {
          line(ctx, api, x, top + e * lane - 30, x, top + e * lane - 7, C.pink, 4);
        }
        line(
          ctx,
          api,
          x,
          top + 3 * lane + cellHeight + 5,
          x,
          top + 3 * lane + cellHeight + 25,
          C.pink,
          4,
        );
      }
      circle(ctx, api, x, top - 29, 7, C.pink);
      text(ctx, api, boundaryLabel, x, 889, 30, C.pink, 'center');
    });
  }
  if (workRows) {
    api.focus.target('queue-rows', () => {
      workRows.forEach((rows, e) => {
        const y = top + e * lane + cellHeight + 13;
        line(ctx, api, left, y, left + rows * pitch - (pitch - cellWidth), y, C.green, 5);
      });
      text(ctx, api, 'Expert work in rows', left, 915, 30, C.green);
    });
  }
}

export function drawReturn(
  ctx,
  api,
  model,
  { resolved = false, showOutput = resolved, previousOutput } = {},
) {
  const { C } = api;
  api.focus.target('token-return', () => {
    text(ctx, api, 'Token ' + model.token + '  /  routed branch', 1230, 300, 36, C.yellow);
    model.terms.forEach((term, i) => {
      const y = 372 + i * 170;
      const color = resolved ? (term.runs ? C.green : C.red) : C.muted;
      line(ctx, api, 1232, y, 1800, y, C.muted, 2);
      text(ctx, api, 'E' + (term.expert + 1), 1230, y + 54, 39, C.ink, 'left', 'mono');
      text(
        ctx,
        api,
        resolved ? (term.runs ? 'returns' : 'dropped') : 'selected',
        1785,
        y + 51,
        31,
        color,
        'right',
      );
      text(
        ctx,
        api,
        fmt(term.gate) + ' × ' + vec(term.vector),
        1230,
        y + 114,
        39,
        color,
        'left',
        'mono',
      );
    });
    line(ctx, api, 1232, 705, 1800, 705, C.muted, 2);
    text(ctx, api, 'Routed output', 1230, 765, 33, C.ink);
    text(
      ctx,
      api,
      showOutput ? vec(model.output) : '?',
      1230,
      850,
      62,
      showOutput ? C.cyan : C.ink,
      'left',
      'mono',
    );
    if (previousOutput)
      text(ctx, api, 'Previously  ' + vec(previousOutput), 1230, 925, 30, C.muted);
  });
}

export function queueCaption(ctx, api, formula, question) {
  api.focus.target('queue-budget', () => {
    text(ctx, api, formula, 120, 233, 39, api.C.ink);
  });
  if (question) text(ctx, api, question, 120, 1002, 36, api.C.yellow);
}
