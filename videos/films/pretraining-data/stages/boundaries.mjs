import { PACKED_WORDS, TOY_TOKEN_IDS } from '../fixtures.mjs';
import { packedMask } from '../arithmetic.mjs';
import { boundarySnapshot } from '../model.mjs';
import {
  drawText,
  legacyText,
  note,
  pill,
  rectangle,
  withPretrainingMainFrame,
} from '../defaults.mjs';
export function paintPretrainingOriginalBoundaries(ctx, scene, state, api, C, c, t, b, p, s) {
  const v = boundarySnapshot(b, p),
    values = v.mask;
  legacyText(
    ctx,
    api,
    C,
    'Two independent documents, one packed block',
    960,
    290,
    40,
    C.ink,
    'center',
  );
  PACKED_WORDS.forEach((word, i) =>
    api.focus.target('packed-tokens', () =>
      c.card({
        label: word,
        x: 230 + i * 245,
        y: 400,
        width: 210,
        height: 75,
        fontSize: 30,
        fill: C.panel,
        stroke: i === v.query ? C.yellow : i < 3 ? C.blue : C.cyan,
        textColor: i === v.query ? C.yellow : C.ink,
      }),
    ),
  );
  if (b > 0 || v.seconds >= 2.95) {
    legacyText(ctx, api, C, 'Toy tokenizer IDs', 960, 355, 24, C.muted, 'center');
    TOY_TOKEN_IDS.forEach((id, i) =>
      legacyText(ctx, api, C, 'ID ' + id, 335 + i * 245, 505, 22, C.muted, 'center'),
    );
  }
  legacyText(ctx, api, C, 'A: positions 0, 1, 2', 560, 535, 28, C.blue, 'center');
  legacyText(ctx, api, C, 'B: positions 0, 1, 2', 1320, 535, 28, C.cyan, 'center');
  if (b > 0) {
    api.focus.target('attention-mask', () =>
      t.grid({
        x: 1270,
        y: 645,
        width: 420,
        height: 300,
        rows: 6,
        columns: 6,
        labels: values.map((row) => row.map((x) => (x ? '•' : ''))),
        fontSize: 23,
        fill: C.panel,
        stroke: C.border,
        textColor: C.cyan,
        highlights: values.flatMap((row, i) =>
          row.flatMap((allowed, j) =>
            i === v.query
              ? [
                  {
                    row: i,
                    column: j,
                    fill: allowed ? C.yellow : j <= i ? C.pink : C.panel,
                    opacity: 0.24,
                  },
                ]
              : [],
          ),
        ),
      }),
    );
    PACKED_WORDS.forEach((word, i) => {
      legacyText(
        ctx,
        api,
        C,
        word,
        1230,
        680 + i * 50,
        19,
        i === v.query ? C.yellow : C.muted,
        'right',
      );
      legacyText(ctx, api, C, word, 1305 + i * 70, 615, 18, C.muted, 'center');
    });
  }
  api.focus.target('query-context', () =>
    legacyText(ctx, api, C, 'Focused query: ' + PACKED_WORDS[v.query], 230, 650, 32, C.yellow),
  );
  api.focus.target('query-context', () =>
    legacyText(
      ctx,
      api,
      C,
      'Allowed context: ' + v.allowed.map((i) => PACKED_WORDS[i]).join(' · '),
      230,
      725,
      29,
      C.green,
    ),
  );
  if (v.blocked)
    legacyText(
      ctx,
      api,
      C,
      'Denied earlier tokens: ' + v.denied.map((i) => PACKED_WORDS[i]).join(' · '),
      230,
      800,
      27,
      C.pink,
    );
  else legacyText(ctx, api, C, 'Choose whether document A may influence B', 230, 800, 27, C.muted);
  if (b === 2) {
    api.focus.target('boundary-target', () =>
      legacyText(
        ctx,
        api,
        C,
        'Shifted target: sat → Birds',
        230,
        905,
        30,
        v.boundaryMasked ? C.muted : C.pink,
      ),
    );
    legacyText(
      ctx,
      api,
      C,
      v.boundaryMasked
        ? 'Loss label −100 · cross-document target excluded'
        : 'Boundary target pending policy',
      230,
      975,
      28,
      v.boundaryMasked ? C.green : C.yellow,
    );
  }
}
export function paintPretrainingMainBoundaries(ctx, scene, state, api, C, c, b, p, cue, P, D, beg) {
  const q = b === 2 ? 2 : D('eos') ? 5 : D('sing') ? 4 : 3,
    allowed = PACKED_WORDS.map((_, i) => i).filter((i) => packedMask(q, i));
  api.focus.target('packed-tokens', () =>
    PACKED_WORDS.forEach((word, i) => {
      rectangle(
        ctx,
        api,
        C,
        210 + i * 250,
        350,
        235,
        65,
        C.panel,
        i === q ? C.yellow : i < 3 ? C.blue : C.cyan,
      );
      drawText(ctx, api, C, word, 327 + i * 250, 393, 30, i === q ? C.yellow : C.ink);
    }),
  );
  drawText(ctx, api, C, 'Document A  ·  block positions 0–2', 560, 510, 31, C.blue);
  drawText(ctx, api, C, 'Document B  ·  block positions 3–5', 1370, 510, 31, C.cyan);
  api.focus.target('query-context', () =>
    drawText(
      ctx,
      api,
      C,
      'Focused query: ' + PACKED_WORDS[q],
      b === 0 ? 960 : 550,
      650,
      38,
      C.yellow,
    ),
  );
  if (b > 0) {
    const values = PACKED_WORDS.map((_, i) => PACKED_WORDS.map((_, j) => Number(packedMask(i, j))));
    api.focus.target('attention-mask', () =>
      api.teaching.grid({
        x: 1160,
        y: 615,
        width: 510,
        height: 330,
        rows: 6,
        columns: 6,
        labels: values.map((row) => row.map((x) => (x ? '•' : ''))),
        fontSize: 25,
        fill: C.panel,
        stroke: C.border,
        textColor: C.cyan,
        highlights: values.flatMap((row, i) =>
          row.flatMap((v, j) =>
            i === q
              ? [
                  {
                    row: i,
                    column: j,
                    fill: v ? C.yellow : j <= i ? C.pink : C.panel,
                    opacity: 0.24,
                  },
                ]
              : [],
          ),
        ),
      }),
    );
    for (let i = 0; i < 6; i++) {
      drawText(ctx, api, C, i, 1202.5 + i * 85, 590, 25, C.muted);
      drawText(ctx, api, C, i, 1125, 653 + i * 55, 25, i === q ? C.yellow : C.muted);
    }
  }
  if ((b > 0 && D('isolate')) || b === 2) {
    allowed.forEach((k, i) => pill(ctx, api, C, PACKED_WORDS[k], 300 + i * 270, 790, 245, C.green));
    drawText(ctx, api, C, 'Same document + no later than query', 550, 905, 29, C.green);
  } else
    drawText(
      ctx,
      api,
      C,
      'Which earlier words can Birds read?',
      b === 0 ? 960 : 550,
      800,
      36,
      C.yellow,
    );
  if (b === 2)
    api.focus.target('boundary-target', () =>
      drawText(
        ctx,
        api,
        C,
        D('target') ? 'sat → Birds: loss label −100' : 'Boundary target: pending policy',
        550,
        970,
        29,
        D('target') ? C.pink : C.yellow,
      ),
    );
  note(ctx, api, C, 'Position reset or EOS alone does not enforce document isolation');
}
export function drawBoundariesStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainBoundaries);
}
export default {
  id: 'boundaries',
  draw: drawBoundariesStage,
  cues: [
    'boundaries-b1-1',
    'boundaries-b1-2',
    'boundaries-b2-1',
    'boundaries-b2-2',
    'pt-boundaries-isolate',
    'pt-boundaries-sing',
    'pt-boundaries-eos',
    'boundaries-b3-1',
    'pt-boundaries-target',
  ],
};
