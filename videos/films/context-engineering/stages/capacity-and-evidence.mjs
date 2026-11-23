import { sources } from '../fixtures.mjs';
import { casePage, caseClock } from '../case-file.mjs';
import { contextDone } from '../arithmetic.mjs';
import {
  drawCompleteEquation,
  drawCompleteFocus,
  drawCompleteFooter,
  drawCompleteHeading,
  drawCompleteRectangle,
  drawCompleteText,
} from '../defaults.mjs';
export function drawCapacityAndEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const resultComplete = (id, beat = currentBeat, end = 0.88) => contextDone(state, id, beat, end);
  drawCompleteFocus(ctx, api, 'ce-capacity-and-evidence-mechanism', () => {
    if (currentBeat < 3) {
      const page = casePage(ctx, api),
        { text, rule, box, C } = page;
      const clock = caseClock(scene, state);
      const railStart = 520,
        railWidth = 1120;
      const synth = clock.started('probe-combine');
      const move = clock.progress('ce-position-move');
      const depth = synth || currentBeat < 2 ? 0.2 : move;
      const xAt = (d) => railStart + d * railWidth;
      text(
        currentBeat === 0
          ? 'Input limit     /     128,000 tokens in this example'
          : synth
            ? 'Could the scope change explain this callback failure?'
            : 'Where in the input does the decisive record sit?',
        150,
        283,
        37,
      );
      text('Position in the input', railStart, 385, 30, C.muted);
      const rail = (label, d, y, color) => {
        text(label, 150, y + 10, 37, color);
        rule(railStart, y, railStart + railWidth, y, C.muted, 3);
        box(xAt(d) - 7, y - 21, 14, 42, color);
        text(Math.round(d * 100) + '%', xAt(d), y - 40, 32, color, 'center');
      };
      rail('trace-17', depth, 529, C.blue);
      if (synth) rail('deploy-record', 0.6, 697, C.yellow);
      if (!synth) {
        ['Beginning', 'Middle', 'End'].forEach((v, i) =>
          text(v, xAt(i / 2), 604, 29, C.muted, 'center'),
        );
        const line =
          currentBeat === 0
            ? 'Next question     /     Why did the callback fail?'
            : currentBeat === 1
              ? 'Same question, answer key and source text in each position'
              : 'Extraction     /     What status did the callback return?';
        text(line, 150, 800, 39);
        text(
          currentBeat === 1
            ? 'Historical probes: multi-document QA, key-value retrieval, length and distractors'
            : 'trace-17     /     R17 returned HTTP ' + sources['trace-17'].status,
          150,
          936,
          32,
          C.blue,
        );
      } else {
        text('Callback returned HTTP ' + sources['trace-17'].status, 150, 850, 39, C.blue);
        text('The deployment changed an OAuth scope', 890, 850, 36, C.yellow);
        if (clock.done('probe-next'))
          text('Next check     /     Did the callback require the changed scope?', 150, 964, 38);
      }
    } else {
      drawCompleteHeading(ctx, api, 'Supplied twelve-case probe · one outcome per fixed case');
      const rows = [
        {
          label: 'beginning',
          ok: 10,
          reveal: resultComplete('ce-position-ten', 3),
          color: themeColors.blue,
        },
        {
          label: 'middle',
          ok: 7,
          reveal: resultComplete('ce-position-seven', 3),
          color: themeColors.cyan,
        },
      ];
      rows.forEach((r, j) => {
        const y = 440 + j * 200;
        drawCompleteText(ctx, api, r.label, 150, y + 45, 30, r.color);
        for (let i = 0; i < 12; i++) {
          drawCompleteRectangle(
            ctx,
            api,
            430 + i * 100,
            y,
            78,
            72,
            themeColors.panel,
            r.reveal ? (i < r.ok ? r.color : themeColors.pink) : themeColors.muted,
            2,
          );
          drawCompleteText(
            ctx,
            api,
            'C' + (i + 1),
            469 + i * 100,
            y + 45,
            23,
            themeColors.ink,
            'center',
          );
          if (r.reveal)
            drawCompleteText(
              ctx,
              api,
              i < r.ok ? '✓' : '×',
              469 + i * 100,
              y + 113,
              28,
              i < r.ok ? r.color : themeColors.pink,
              'center',
            );
        }
        drawCompleteText(
          ctx,
          api,
          r.reveal ? `${r.ok}/12 = ${((100 * r.ok) / 12).toFixed(2)}%` : 'success fraction: ?',
          430,
          y + 155,
          30,
          r.color,
        );
      });
      drawCompleteEquation(
        ctx,
        api,
        resultComplete('ce-position-ten', 3) && resultComplete('ce-position-seven', 3)
          ? String.raw`\Delta_{\mathrm{pp}}=100\left({10\over12}-{7\over12}\right)`
          : String.raw`\Delta_{\mathrm{pp}}=100\left(p_{\mathrm{beginning}}-p_{\mathrm{middle}}\right)`,
        960,
        895,
        43,
      );
      if (resultComplete('ce-position-difference', 3))
        drawCompleteText(
          ctx,
          api,
          '25 percentage points',
          960,
          975,
          35,
          themeColors.green,
          'center',
        );
    }
    if (currentBeat === 3)
      drawCompleteFooter(ctx, api, 'Invented probe results for these twelve cases.');
  });
}
export default {
  id: 'capacity-and-evidence',
  draw: drawCapacityAndEvidence,
  cues: [
    'ce-position-move',
    'probe-combine',
    'probe-next',
    'ce-capacity-and-evidence-4',
    'ce-position-ten',
    'ce-position-seven',
    'ce-position-difference',
  ],
};
