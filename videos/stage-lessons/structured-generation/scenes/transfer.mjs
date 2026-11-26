// Scene 28: transfer - Which request has time for a retry?
// Dual glowing timeline bars racing against a bright gold 12-second deadline laser!
// Shared checks pass (500/600 tokens, 4+3 = 7/8 cost). Request A (7.0 s spent) vs B (8.5 s spent).
// STRICT prediction withholding during Beat 0 hold (3.4s): outcomes 11 s RETRY vs 12.5 s STOP
// stay hidden until c.after('retry-outcome')!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  RETRY_CASE_A,
  RETRY_CASE_B,
  RETRY_LIMITS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const pulse = s.value(0);
  const factsHi = s.value(0);
  const callExt = s.value(0);
  const valExt = s.value(0);
  const outcomeShow = s.value(0);

  const header = cinemaHeader('RETRY BUDGET TRANSFER', 'Which request has time', 'for a retry?', {
    accent: ROLE.prefix,
    size: 50,
  });

  const stageAura = aura(200, 40, 640, '#ffd1661c', '#5ce1e618');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const fh = factsHi.value;
      const ce = callExt.value;
      const ve = valExt.value;
      const oc = outcomeShow.value;
      const nodes = [];

      const x0 = -560;
      const scale = 92; // 13 s -> 1196 px (-560 to +636)
      const deadlineX = x0 + RETRY_LIMITS.deadline * scale; // +544

      // Top shared-constraints telemetry ribbon
      nodes.push(
        txt(
          'BOTH HIT TOKEN LIMIT  ·  500 / 600 TOKENS OK  ·  COST 4 + 3 = 7 / 8 OK',
          -840,
          -230,
          26,
          ROLE.legal,
          'mono',
          'left',
        ),
        txt('12.0 s DEADLINE', deadlineX, -158, 28, ROLE.prefix, 'mono', 'center').glow(
          fh > 0.3 ? 8 : 4,
          ROLE.prefix,
        ),
        line([deadlineX, -124], [deadlineX, 235], { stroke: ROLE.prefix, width: 4.5 }).glow(
          10,
          ROLE.prefix,
        ),
        glowDot(deadlineX, -124, { radius: 6, color: ROLE.prefix, glow: 12 }),
      );

      // Ruler ticks
      for (const sec of [0, 4, 8, 12]) {
        const tx = x0 + sec * scale;
        nodes.push(
          line([tx, -120], [tx, 225], { stroke: '#223154', width: 1.5, dash: [6, 8] }),
          txt(`${sec} s`, tx, 268, 26, COSMOS.dim, 'mono', 'center'),
        );
      }

      const rows = [
        { name: 'REQUEST A', elapsed: 7, res: RETRY_CASE_A, y: -32 },
        { name: 'REQUEST B', elapsed: 8.5, res: RETRY_CASE_B, y: 128 },
      ];

      rows.forEach(({ name, elapsed, res, y }) => {
        const spentW = elapsed * scale;
        const callW = RETRY_LIMITS.call * scale * ce;
        const valW = RETRY_LIMITS.validation * scale * ve;
        const propX = x0 + spentW;

        nodes.push(
          txt(name, -840, y, 32, COSMOS.ink, 'mono', 'left'),
          rect(spentW, 68, { fill: '#121b33', stroke: '#4d608c', width: 2.4, radius: 8 }).at(
            x0 + spentW * 0.5,
            y,
          ),
          txt(`${elapsed} s spent`, x0 + spentW * 0.5, y, 28, COSMOS.ink, 'mono', 'center'),
        );

        if (callW > 2) {
          nodes.push(
            rect(callW, 68, { fill: '#173766', stroke: ROLE.schema, width: 2.6, radius: 6 })
              .at(propX + callW * 0.5, y)
              .glow(7, ROLE.schema),
          );
          if (ce > 0.65) {
            nodes.push(txt('+3 s', propX + callW * 0.5, y, 26, ROLE.schema, 'mono', 'center'));
          }
        }

        if (valW > 2) {
          const vx = propX + RETRY_LIMITS.call * scale;
          const over = !res.allowed;
          nodes.push(
            rect(valW, 68, {
              fill: over ? '#3b1526' : '#0f363c',
              stroke: over ? ROLE.prune : ROLE.fsm,
              width: 2.6,
              radius: 6,
            })
              .at(vx + valW * 0.5, y)
              .glow(8, over ? ROLE.prune : ROLE.fsm),
          );
          if (ve > 0.7) {
            nodes.push(
              txt('+1', vx + valW * 0.5, y, 26, over ? ROLE.prune : ROLE.fsm, 'mono', 'center'),
            );
          }
        }

        // Strict prediction withholding: outcomes appear ONLY after retry-outcome!
        if (oc > 0.05) {
          const col = res.allowed ? ROLE.legal : ROLE.prune;
          nodes.push(
            txt(`${res.totalTime} s`, 725, y - 16, 30, col, 'mono', 'center').opacity(oc),
            txt(res.allowed ? 'RETRY' : 'STOP', 725, y + 24, 34, col, 'mono', 'center')
              .glow(10, col)
              .opacity(oc),
          );
        } else {
          nodes.push(txt('?', 725, y, 38, fh > 0.3 ? ROLE.prefix : COSMOS.dim, 'mono', 'center'));
        }
      });

      // Bottom legend / prediction prompt
      if (oc < 0.05) {
        nodes.push(
          txt('Retry call: +3 s (blue)', -840, 345, 28, ROLE.schema, 'mono', 'left'),
          txt('Validation: +1 s (cyan)', -380, 345, 28, ROLE.fsm, 'mono', 'left'),
          txt('Which request fits before 12 s?', 160, 345, 34, ROLE.prefix, 'serif', 'left').glow(
            6,
            ROLE.prefix,
          ),
        );
      } else {
        nodes.push(
          txt(
            'ONLY A FITS (7 + 4 = 11 s <= 12 s)  ·  B FINISHES AT 12.5 s -> KEEP INCOMPLETE',
            -840,
            345,
            28,
            ROLE.legal,
            'mono',
            'left',
          )
            .glow(7, ROLE.legal)
            .opacity(oc),
          txt(
            'Note: if the original stop was a refusal, even spare time buys zero retries',
            -840,
            396,
            26,
            COSMOS.muted,
            'serif',
            'left',
          ).opacity(oc),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('retry-facts', () => {
    s.play(factsHi.to(1, { duration: clampDur(c, c.cue('retry-facts').start, 0.4) }));
  });
  c.on('retry-call', () => {
    s.play(callExt.to(1, { duration: clampDur(c, c.cue('retry-call').start, 0.7) }));
  });
  c.on('retry-validate', () => {
    s.play(valExt.to(1, { duration: clampDur(c, c.cue('retry-validate').start, 0.55) }));
  });
  // Strict prediction withholding: reveal 11 s RETRY vs 12.5 s STOP AFTER spoken clause!
  c.after('retry-outcome', () => {
    s.play(outcomeShow.to(1, { duration: clampDur(c, c.cue('retry-outcome').end, 0.45) }));
  });
}
