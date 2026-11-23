import { corpus, extractionFixture } from '../fixtures.mjs';
import { documentCard, legacyText, withPretrainingMainFrame } from '../defaults.mjs';
export function paintPretrainingOriginalIntro(ctx, scene, state, api, C, c, t, b, p, s) {
  legacyText(
    ctx,
    api,
    C,
    'Excerpts shown; lengths belong to an authored corpus inventory',
    960,
    680,
    29,
    C.muted,
    'center',
  );
  corpus
    .slice(0, 4)
    .forEach((r, i) =>
      api.focus.target('corpus-records', () => documentCard(ctx, api, C, c, r, 270 + i * 360, 400)),
    );
  api.focus.target('preparation-path', () =>
    t.flowGraph({
      nodes: [
        {
          id: 'extract',
          label: 'Extract',
          x: 270,
          y: 745,
          width: 270,
          height: 95,
        },
        {
          id: 'filter',
          label: 'Filter',
          x: 630,
          y: 745,
          width: 270,
          height: 95,
        },
        {
          id: 'dedup',
          label: 'Deduplicate',
          x: 990,
          y: 745,
          width: 270,
          height: 95,
        },
        {
          id: 'mix',
          label: 'Sample',
          x: 1350,
          y: 745,
          width: 270,
          height: 95,
        },
      ],
      edges: [
        {
          from: 'extract',
          to: 'filter',
          gap: 14,
          progress: s(0),
        },
        {
          from: 'filter',
          to: 'dedup',
          gap: 14,
          progress: s(1),
        },
        {
          from: 'dedup',
          to: 'mix',
          gap: 14,
          progress: s(2),
        },
      ],
      textColor: C.ink,
    }),
  );
}
export function paintPretrainingMainIntro(ctx, scene, state, api, C, c, b, p, cue, P, D, beg) {
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const code = corpus.find((r) => r.id === 'C');
  const menu = corpus.find((r) => r.id === 'D');
  const scoreX = (score) => 270 + 1440 * score;
  const railY = 660;
  const cutoff = D('first') ? (50 + Math.round(35 * P('raise'))) / 100 : null;
  api.line(ctx, scoreX(0), railY, scoreX(1), railY, C.muted, 5);
  if (cutoff !== null) {
    api.line(ctx, scoreX(cutoff), railY, scoreX(1), railY, C.green, 12);
  }
  for (const value of [0, 1]) {
    api.text(ctx, String(value), scoreX(value), railY + 55, 35, C.muted, 'center');
  }

  for (const record of [menu, code]) {
    const program = record === code;
    const color = program ? C.pink : C.blue;
    const removed = cutoff !== null && record.score < cutoff;
    const ink = removed ? C.muted : color;
    const center = scoreX(record.score);
    const width = program ? 700 : 600;
    const left = center - width / 2;
    const flight = api.clamp((state.t + 0.15) / (program ? 1.05 : 0.8), 0, 1);
    const top = 322 - 120 * (1 - flight) ** 2;
    api.rect(ctx, left, top, width, 250, C.panel, ink, 13);
    api.text(ctx, program ? 'Python excerpt' : 'Menu excerpt', left + 32, top + 51, 34, ink);
    api.text(ctx, record.tokens + ' tokens total', left + width - 32, top + 51, 30, C.muted, 'right');
    api.line(ctx, left + 2, top + 75, left + width - 2, top + 75, ink, 2);
    if (program) {
      const lines = extractionFixture.filter((span) => span.code);
      lines.forEach((span, i) =>
        api.text(
          ctx,
          span.text,
          left + 40,
          top + 145 + i * 68,
          49,
          i ? ink : C.ink,
          'left',
          'mono',
        ),
      );
    } else {
      record.text.split(' ').forEach((word, i) => {
        const x = left + 48 + (i % 2) * 280;
        const y = top + 145 + Math.floor(i / 2) * 69;
        api.line(ctx, x, y + 7, x + 106, y + 7, ink, 2);
        api.text(ctx, word, x, y, 43, ink);
      });
    }
    api.line(ctx, center, top + 251, center, top + 269, ink, 4);
    api.text(ctx, record.score.toFixed(2), center, top + 316, 48, ink, 'center');
    const radius =
      !program && cue('menu')?.phase === 'during' ? 12 + 8 * Math.sin(Math.PI * P('menu')) : 12;
    api.circle(ctx, center, railY, radius, ink);
    if (cutoff !== null) {
      api.text(
        ctx,
        removed ? 'Drop' : 'Keep',
        center,
        railY + 66,
        39,
        removed ? C.muted : C.green,
        'center',
      );
    }
  }

  for (const value of cutoff === null ? [0.5, 0.85] : [cutoff]) {
    const x = scoreX(value);
    if (cutoff !== null) api.line(ctx, x, railY - 13, x, railY + 14, C.yellow, 5);
    api.line(
      ctx,
      x,
      railY + (cutoff === null ? 12 : 82),
      x,
      railY + 103,
      C.yellow,
      beg('choose') ? 7 : 4,
    );
    api.text(ctx, value.toFixed(2), x, railY + 157, 53, C.yellow, 'center');
  }
  const prompt =
    cutoff === null
      ? 'Which cutoff keeps the function and drops the menu?'
      : 'Keep every record at or above the cutoff.';
  api.text(ctx, prompt, 960, 963, 45, C.ink, 'center');
}
export function drawIntroStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainIntro);
}
export default {
  id: 'intro',
  draw: drawIntroStage,
  cues: ['pt-intro-menu', 'pt-intro-choose', 'pt-intro-first', 'pt-intro-raise'],
};
