import { traceWithQueue } from '../arithmetic.mjs';
import { rectangle, retainedDrawText, text } from '../defaults.mjs';
export function drawCriticalPath(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  if (currentBeat < 3) {
    {
      const { C: themeColors, components: components } = api,
        currentBeat = state.beat ?? 0,
        progress = api.clamp(state.beatP ?? 0, 0, 1);
      const stages = {
        'critical-path': ['overlap-setup', 'handoff-queue', 'end-to-end-request'],
      };
      const phaseForBeat = (i, a = 0.07, z = 0.91) => {
        const fallback = currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z),
          id = stages['critical-path']?.[i];
        return id ? api.focus.progress(id, fallback) : fallback;
      };
      const card = (label, x, y, width, color = themeColors.cyan, opacity = 1, height = 88) =>
        components.card({
          label,
          x,
          y,
          width,
          height,
          fontSize: 30,
          baselineOffset: 30 * (0.34 - 0.7 * (label.split('\n').length - 1)),
          padding: 12,
          fill: themeColors.panel,
          stroke: color,
          textColor: themeColors.ink,
          opacity: state.cues ? (opacity > 0 ? 1 : 0) : opacity,
        });
      {
        const delay = 25 * phaseForBeat(1),
          delayed = traceWithQueue(delay);
        const x0 = 470,
          scale = 2.8,
          map = (value) => x0 + value * scale;
        const rows = [
          {
            label: 'prefill',
            y: 365,
            item: delayed[0],
            color: themeColors.blue,
          },
          {
            label: 'transfer setup',
            y: 465,
            item: delayed[1],
            color: themeColors.cyan,
          },
          {
            label: 'handoff queue',
            y: 565,
            item: delayed[2],
            color: themeColors.pink,
          },
          {
            label: 'KV transfer',
            y: 665,
            item: delayed[3],
            color: themeColors.yellow,
          },
          {
            label: 'decode → token',
            y: 765,
            item: delayed[4],
            color: themeColors.green,
          },
        ];
        api.focus.target('critical-path-early-kv-blocks-become-transferable-at-150-ms', () =>
          retainedDrawText(
            ctx,
            api,
            'Early KV blocks become transferable at 150 ms',
            1010,
            320,
            26,
            themeColors.cyan,
          ),
        );
        rows.forEach(({ label, y, item, color }) => {
          api.focus.target('critical-path-readout', () => card(label, 150, y, 260, color, 1, 70));
          if (item.end > item.start) {
            const start = map(item.start),
              end = map(item.end);
            api.focus.target('request-critical-path', () =>
              api.rect(ctx, start, y + 10, end - start, 50, color, undefined, 12),
            );
            api.focus.target('critical-path-readout-2', () =>
              retainedDrawText(
                ctx,
                api,
                `${Math.round(item.start)}–${Math.round(item.end)} ms`,
                start + (end - start) / 2,
                y + 89,
                23,
                themeColors.muted,
              ),
            );
          }
          if (label === 'handoff queue' && delay > 0)
            api.focus.target('critical-path-readout-3', () =>
              retainedDrawText(
                ctx,
                api,
                `${delay.toFixed(1)} ms`,
                map(item.end) + 18,
                y + 42,
                22,
                themeColors.pink,
                'left',
              ),
            );
        });
        const actual = delayed.at(-1).end;
        const clock = (currentBeat === 0 ? phaseForBeat(0) : 1) * actual,
          active = clock < 150 ? 0 : clock < delayed[3].start ? 2 : clock < delayed[3].end ? 3 : 4;
        const requestY = rows[active].y;
        const requestCard = {
          x: map(clock) - 65,
          y: requestY + 13,
          width: 130,
          height: 44,
        };
        const marker = (x, color, width) => {
          if (x >= requestCard.x - 12 && x <= requestCard.x + requestCard.width + 12) {
            const above = requestCard.y - 12,
              below = requestCard.y + requestCard.height + 12;
            if (above > 335) api.line(ctx, x, 335, x, Math.min(830, above), color, width);
            if (below < 830) api.line(ctx, x, Math.max(335, below), x, 830, color, width);
          } else api.line(ctx, x, 335, x, 830, color, width);
        };
        marker(map(400), themeColors.muted, 2);
        marker(map(actual), themeColors.pink, 3);
        api.components.card({
          label: 'R4219',
          ...requestCard,
          fontSize: 24,
          fill: themeColors.bg,
          stroke: rows[active].color,
          textColor: rows[active].color,
          padding: 6,
        });
        api.focus.target('critical-path-readout-4', () =>
          retainedDrawText(
            ctx,
            api,
            'Request 4219 · ' +
              (active === 0
                ? 'prefill'
                : active === 2
                  ? 'waiting for handoff'
                  : active === 3
                    ? 'KV in transit'
                    : 'decode / first token'),
            960,
            860,
            26,
            rows[active].color,
          ),
        );
        api.focus.target('critical-path-readout-5', () =>
          retainedDrawText(
            ctx,
            api,
            'first token: ' + Math.round(actual) + ' ms',
            960,
            900,
            30,
            themeColors.pink,
          ),
        );
        api.focus.target('critical-path-readout-6', () =>
          retainedDrawText(
            ctx,
            api,
            `Current queue shifts transfer and first token by ${delay.toFixed(1)} ms.`,
            960,
            955,
            29,
            themeColors.muted,
          ),
        );
      }
    }
    return;
  }
  const body = () => {
    const serial = currentBeat === 3 && progress < 0.33,
      queue = currentBeat > 3 ? 25 : currentBeat === 3 ? 25 * api.phase(progress, 0.67, 0.9) : 0,
      start = serial ? 310 : 240 + queue,
      end = start + 107.374 + 28,
      origin = 470,
      scale = 2.8,
      map = (t) => origin + t * scale;
    text(
      ctx,
      api,
      'R4219 · one synthetic clock · prefill ends ' + (310 + queue).toFixed(0) + ' ms',
      960,
      280,
      36,
      themeColors.yellow,
      'center',
    );
    if (queue > 0)
      text(
        ctx,
        api,
        'Preceding admission queue ' + queue.toFixed(1) + ' ms · active-span union375.4 ms',
        960,
        340,
        27,
        themeColors.muted,
        'center',
      );
    const spans = [
      ['prefill', queue, 310 + queue, themeColors.blue],
      ['admission queue', 0, queue, themeColors.pink],
      ['transfer', start, start + 107.374, themeColors.yellow],
      ['commit + decode', start + 107.374, end, themeColors.green],
    ];
    spans.forEach(([name, a, z, color], i) => {
      const y = 420 + i * 135;
      text(ctx, api, name, 380, y + 38, 29, color, 'right');
      if (z > a) rectangle(ctx, api, map(a), y, map(z) - map(a), 60, color, color);
      text(
        ctx,
        api,
        a.toFixed(1) + '–' + z.toFixed(1),
        map(a) + (map(z) - map(a)) / 2,
        y + 100,
        24,
        themeColors.muted,
        'center',
      );
    });
    text(
      ctx,
      api,
      'TTFT ' + end.toFixed(1) + ' ms · request admission to first token',
      960,
      1040,
      34,
      themeColors.green,
      'center',
    );
  };
  if (api.focus)
    api.focus.target('critical-path-construction', () => {
      api.focus.target('critical-path-readout-5', body);
    });
  else body();
}
export default {
  id: 'critical-path',
  draw: drawCriticalPath,
  cues: [
    'overlap-setup',
    'early-kv',
    'handoff-queue',
    'shift-first-token',
    'end-to-end-request',
    'same-event',
    'critical-path-b4',
    'critical-path-b5',
  ],
};
