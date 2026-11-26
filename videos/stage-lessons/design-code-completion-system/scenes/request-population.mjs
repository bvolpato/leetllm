// Scene 16: request-population - Keep the first token inside the edit-to-paint path
// Nested clock intervals (edit -> submit -> first token [TTFT] -> usable span -> paint) so
// TTFT is NEVER double-counted with transport/queue, plus reporting full population (drops/timeouts!).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function requestPopulation(s, c) {
  const phase = s.value(0);
  const popOn = s.value(0);

  const header = cinemaHeader(
    'CLOCK BOUNDARIES & POPULATION',
    'Keep TTFT inside',
    'edit-to-paint',
    {
      x: -860,
      y: -445,
      accent: ROLE.ed,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const pp = popOn.value;
      const nodes = [];

      // Nested timeline bar: Edit -> Submit -> First Token (TTFT) -> Usable Span -> Paint
      const xEd = -740;
      const xSub = -440;
      const xTok1 = 160;
      const xSpan = 560;
      const xPaint = 740;
      const rY = -95;

      nodes.push(
        txt(
          'EDIT-TO-USABLE-SUGGESTION (FULL USER CLOCK)',
          0,
          rY - 92,
          26,
          ROLE.ok,
          'mono',
          'center',
        ),
        line([xEd, rY - 48], [xPaint, rY - 48], { stroke: ROLE.ok, width: 4 }).glow(7, ROLE.ok),
        rect(xSub - xEd - 4, 46, { fill: ROLE.warn, stroke: '#ffffff', width: 1.2, radius: 5 }).at(
          (xEd + xSub) * 0.5,
          rY,
        ),
        txt('LOCAL/DEB', (xEd + xSub) * 0.5, rY, 26, '#070910', 'mono', 'center'),
        rect(xTok1 - xSub - 4, 46, { fill: ROLE.ed, stroke: '#ffffff', width: 1.5, radius: 5 })
          .at((xSub + xTok1) * 0.5, rY)
          .glow(8, ROLE.ed),
        txt(
          'CLIENT TTFT (NET + Q + PREFILL)',
          (xSub + xTok1) * 0.5,
          rY,
          26,
          '#070910',
          'mono',
          'center',
        ),
        rect(xSpan - xTok1 - 4, 46, {
          fill: ROLE.model,
          stroke: '#ffffff',
          width: 1.2,
          radius: 5,
        }).at((xTok1 + xSpan) * 0.5, rY),
        txt('USABLE SPAN', (xTok1 + xSpan) * 0.5, rY, 26, '#070910', 'mono', 'center'),
        rect(xPaint - xSpan - 4, 46, {
          fill: ROLE.ok,
          stroke: '#ffffff',
          width: 1.2,
          radius: 5,
        }).at((xSpan + xPaint) * 0.5, rY),
        txt('PAINT', (xSpan + xPaint) * 0.5, rY, 26, '#070910', 'mono', 'center'),
        txt(
          'NEVER add Client TTFT on top of network & server wait (already inside!)',
          0,
          rY + 62,
          26,
          ROLE.warn,
          'mono',
          'center',
        ),
      );

      // Bottom: Full Offered Population Visibility
      const pAlpha = 0.4 + pp * 0.6;
      const botY = 125;
      nodes.push(
        line([-840, 48], [840, 48], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'REPORT THE ENTIRE OFFERED POPULATION',
          0,
          botY,
          28,
          ROLE.focus,
          'mono',
          'center',
        ).opacity(pAlpha),
        txt(
          'SHOWN  +  STALE DROPS  +  CANCELS  +  TIMEOUTS  +  ERRORS',
          0,
          botY + 56,
          26,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(pAlpha),
        txt(
          'Low p95 on a tiny surviving shown subset hides poor service; keep immediate vs debounced clocks separate',
          0,
          botY + 122,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(pAlpha),
        txt('1 TOKEN != USABLE', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Often need multi-token span to paint', 480, -378, 26, COSMOS.muted, 'mono', 'center'),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.ed,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.0);

  c.on('cc-request-population-1', () => {
    s.play(popOn.to(1, { duration: clampDur(c, c.cue('cc-request-population-1').start, 0.4) }));
  });
}
