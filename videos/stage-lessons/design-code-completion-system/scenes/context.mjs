// Scene 09: context - Reserve the suffix inside the whole prompt budget
// Exact 8,000-token budget allocation from promptParts(): Framing 200 + Prefix 4,500 +
// Reserved Suffix 1,000 + Definitions 1,800 + Remaining Snippet Slice 500 = 8,000 tokens!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PROMPT_FULL,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function context(s, c) {
  const snipOn = s.value(0);

  const header = cinemaHeader(
    'PROMPT BUDGET RESERVATION',
    'Reserve the suffix',
    'inside 8,000 tokens',
    {
      x: -860,
      y: -445,
      accent: ROLE.focus,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#ffd1661a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const sn = snipOn.value;
      const nodes = [];

      // Horizontal 8,000-token stacked bar across x = [-760 .. +760] (width = 1520)
      const x0 = -760;
      const totalW = 1520;
      const bY = -30;
      const colors = [ROLE.model, ROLE.ed, ROLE.focus, ROLE.ok, ROLE.warn];

      let cx = x0;
      PROMPT_FULL.forEach((part, idx) => {
        const w = (part.value / 8000) * totalW;
        const col = colors[idx];
        const alpha = idx === 4 ? 0.25 + sn * 0.75 : 0.92;
        nodes.push(
          rect(w - 4, 72, { fill: col, stroke: '#ffffff', width: 1.5, radius: 6 })
            .at(cx + w * 0.5, bY)
            .glow(idx === 2 ? 10 : 5, col)
            .opacity(alpha),
          txt(
            idx === 0 ? '' : idx === 4 ? '500' : `${part.value}`,
            cx + w * 0.5,
            bY,
            26,
            '#070910',
            'mono',
            'center',
          ).opacity(alpha),
          txt(
            idx === 0
              ? 'Frame (200)'
              : idx === 1
                ? 'Prefix (4,500)'
                : idx === 2
                  ? 'SUFFIX (1,000)'
                  : idx === 3
                    ? 'Defs (1,800)'
                    : 'Extra (500)',
            cx + w * 0.5,
            bY + (idx % 2 === 0 ? -64 : 66),
            26,
            col,
            'mono',
            'center',
          ).opacity(alpha),
        );
        cx += w;
      });

      nodes.push(
        txt(
          'PROMPT BUDGET = 8,000 TOKENS (OUTPUT BUDGET SEPARATE!)',
          0,
          -175,
          28,
          ROLE.ed,
          'mono',
          'center',
        ),
        txt('AUTHORIZE FIRST', 480, -425, 26, ROLE.ok, 'mono', 'center'),
        txt(
          'Filter permitted files before assembly',
          480,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        line([-840, 175], [840, 175], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          sn > 0.4
            ? 'EXTRA SNIPPET TAKES ONLY REMAINING 500 TOKENS: NEVER DROP THE RESERVED SUFFIX!'
            : 'Reserve framing & suffix first, then allocate prefix and permitted definitions',
          0,
          255,
          26,
          sn > 0.4 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          'Extra context shifts transfer & prefill latency; evaluate full policy under real SLO & privacy rules',
          0,
          312,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('context-additional-snippet', () => {
    s.play(snipOn.to(1, { duration: clampDur(c, c.cue('context-additional-snippet').start, 0.4) }));
  });
}
