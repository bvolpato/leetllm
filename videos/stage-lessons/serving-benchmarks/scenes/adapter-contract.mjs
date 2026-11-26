// Scene 11: adapter-contract - A metric name does not identify its end event
// Luminous 4-frame SSE protocol waterfall showing pinned October vLLM chat/completion adapter
// rules (empty choices advances, usage & [DONE] excluded -> 320 ms) + client-queue span addition.
import { group, line, rect } from 'vizmatic/stage';
import {
  ADAPTER_EVENTS,
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dashedRule,
  driftValue,
  glowDot,
  glowingTrail,
  guardedDynamic,
  spanBracket,
  txt,
} from '../parts.mjs';

export default function adapterContract(s, c) {
  const phase = s.value(0);
  const protoLit = s.value(0.35);
  const vllmRules = s.value(0);
  const choicesHi = s.value(0);
  const endHi = s.value(0);
  const queueSpan = s.value(0);

  const header = cinemaHeader('ADAPTER TELEMETRY RULES', 'A metric name hides', 'its end event', {
    x: -860,
    y: -435,
    accent: ROLE.open,
    size: 50,
  });

  const stageAura = aura(150, 20, 680, '#5ce1e61a', '#ffd16618');

  const waterfallView = guardedDynamic(
    () => 1,
    () => {
      const vr = vllmRules.value;
      const ch = choicesHi.value;
      const eh = endHi.value;
      const qs = queueSpan.value;

      const nodes = [];
      const topY = -170;
      const rowStep = 104;
      const colTime = -760;
      const colRailL = -590;
      const colRailR = 140;
      const colVerdict = 240;

      // Top protocol distinction tags (no boxes!)
      nodes.push(
        txt(
          'TCP READS  !=  SSE FRAMES  !=  TEXT CHUNKS',
          260,
          -375,
          26,
          COSMOS.muted,
          'mono',
        ).opacity(0.65 + 0.35 * protoLit.value),
      );

      // Vertical glowing wire connecting the 4 incoming SSE frames
      nodes.push(
        line([colRailL, topY], [colRailL, topY + 3 * rowStep], {
          stroke: '#2b3e66',
          width: 3.0,
        }),
      );

      ADAPTER_EVENTS.forEach((ev, idx) => {
        const yy = topY + idx * rowStep;
        const included = ev.advances;
        const isEmptyChoices = idx === 0;
        const col =
          vr < 0.1
            ? ROLE.open
            : included
              ? isEmptyChoices && ch > 0.2
                ? ROLE.focus
                : ROLE.open
              : eh > 0.2
                ? ROLE.fail
                : COSMOS.dim;

        // Luminous event pulse bar (no card chrome, sleek signal beam)
        nodes.push(
          txt(`${ev.t} ms`, colTime, yy, 28, col, 'mono', 'right'),
          glowDot(colRailL, yy, { radius: 9, color: col, glow: 10 }),
          glowingTrail(
            [
              [colRailL + 16, yy],
              [colRailR, yy],
            ],
            { color: col, width: included || vr < 0.1 ? 5.0 : 2.6, glow: included ? 9 : 3 },
          ),
          txt(ev.label, colRailL + 36, yy - 32, 28, COSMOS.ink, 'mono', 'left').opacity(
            included || vr < 0.1 ? 1 : 0.62,
          ),
        );

        if (vr > 0.1) {
          const status = included
            ? isEmptyChoices
              ? 'advances clock (empty text!)'
              : 'advances clock  ->  END = 320 ms'
            : 'excluded by chat adapter';
          nodes.push(
            txt(status, colVerdict, yy, 26, col, 'mono', 'left')
              .glow(included ? 5 : 0, col)
              .opacity(vr),
          );
        }
      });

      // Vertical laser span linking the two accepted frames (100 ms -> 320 ms)
      if (vr > 0.2) {
        nodes.push(
          glowingTrail(
            [
              [colVerdict - 36, topY - 12],
              [colVerdict - 36, topY + rowStep + 12],
            ],
            { color: ROLE.open, width: 6.0, glow: 10, opacity: vr },
          ),
        );
      }

      // Beat 2: Additive client-queue bar at bottom
      if (qs > 0.1) {
        const barY = 278;
        const x0 = -760;
        const xQ = -340;
        const xEnd = 520;
        nodes.push(
          txt(
            'FINITE-RATE + CONCURRENCY CAP SUMMARY',
            -760,
            barY - 56,
            26,
            ROLE.focus,
            'mono',
            'left',
          ).opacity(qs),
          rect(xQ - x0 - 4, 42, { fill: '#2a1f0e', stroke: ROLE.focus, width: 2.4, radius: 8 })
            .at((x0 + xQ) * 0.5, barY)
            .opacity(qs),
          txt('client queue', (x0 + xQ) * 0.5, barY, 26, ROLE.focus, 'mono').opacity(qs),
          rect(xEnd - xQ - 4, 42, { fill: '#0d2230', stroke: ROLE.open, width: 2.4, radius: 8 })
            .at((xQ + xEnd) * 0.5, barY)
            .opacity(qs),
          txt(
            'adapter latency (ends 320 ms)',
            (xQ + xEnd) * 0.5,
            barY,
            26,
            ROLE.open,
            'mono',
          ).opacity(qs),
          ...spanBracket(
            x0,
            xEnd,
            barY + 48,
            'e2el_including_client_queue (success only)',
            ROLE.focus,
            {
              labelSize: 26,
              opacity: qs,
            },
          ),
          txt(
            'Record endpoint, event rules, token-count source & installed adapter version',
            0,
            428,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(qs),
        );
      } else {
        nodes.push(
          txt(
            eh > 0.2
              ? 'Responses adapter instead timestamps text & reasoning deltas'
              : 'First byte, first content chunk, server emission & client arrival answer different questions',
            0,
            345,
            26,
            eh > 0.2 ? ROLE.focus : COSMOS.muted,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, waterfallView);
  driftValue(s, c, phase, 7, { startOffset: 0.1, endMargin: 0.5 });

  c.on('adapter-contract-beat-0', () => {
    const t = c.cue('adapter-contract-beat-0').start;
    s.play(protoLit.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.on('adapter-contract-beat-1', () => {
    const t = c.cue('adapter-contract-beat-1').start;
    s.play(vllmRules.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('adapter-choices', () => {
    const t = c.cue('adapter-choices').start;
    s.play(choicesHi.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('adapter-end', () => {
    const t = c.cue('adapter-end').start;
    s.play(endHi.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('adapter-contract-beat-2', () => {
    const t = c.cue('adapter-contract-beat-2').start;
    s.play(queueSpan.to(1, { duration: clampDur(c, t, 0.45) }));
  });
}
