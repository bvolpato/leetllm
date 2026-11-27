// Scene 12: phase-latency - Where did this reader wait?
// Client-side token timestamps at 200, 210, 220, 500 ms -> STRICT prediction pause before
// revealing 280 ms ITL stall (T3->T4) vs 100 ms average TPOT (300 ms / 3 gaps)!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function phaseLatency(s, c) {
  const tokensOn = s.value(0);
  const longReveal = s.value(0); // STRICT after phase-long!
  const meanReveal = s.value(0); // STRICT after phase-mean!

  const header = cinemaHeader('TTFT, ITL & TPOT', 'Where did this', 'reader wait?', {
    x: -860,
    y: -445,
    accent: ROLE.req,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const tk = tokensOn.value;
      const lg = longReveal.value;
      const mn = meanReveal.value;
      const nodes = [];

      // Client timestamp ruler: 0 .. 550 ms across x = [-760 .. +760]
      const x0 = -760;
      const x1 = 760;
      const mapMs = (ms) => x0 + (ms / 550) * (x1 - x0);
      const rY = 10;

      const x200 = mapMs(200);
      const x210 = mapMs(210);
      const x220 = mapMs(220);
      const x500 = mapMs(500);

      // Axis + TTFT span (0 -> 200 ms)
      nodes.push(
        line([x0, rY], [x1, rY], { stroke: '#344770', width: 5 }),
        line([x0, rY], [x200, rY], { stroke: ROLE.req, width: 10 }).glow(8, ROLE.req),
        txt(
          'TTFT = 200 ms (queue + prefill + trip)',
          (x0 + x200) * 0.5,
          rY - 62,
          26,
          ROLE.req,
          'mono',
          'center',
        ),
      );

      // 4 arriving tokens at 200, 210, 220, 500 ms
      const pts = [
        { x: x200, t: '200', tag: 'T1', dy: 52 },
        { x: x210, t: '210', tag: 'T2', dy: -115 },
        { x: x220, t: '220', tag: 'T3', dy: 102 },
        { x: x500, t: '500', tag: 'T4', dy: 52 },
      ];
      pts.forEach((pt) => {
        nodes.push(
          glowDot(pt.x, rY, { radius: 9, color: ROLE.ok, glow: 10, opacity: 0.4 + tk * 0.6 }),
          txt(`${pt.tag} (${pt.t})`, pt.x, rY + pt.dy, 26, ROLE.ok, 'mono', 'center').opacity(
            0.4 + tk * 0.6,
          ),
        );
      });

      // STRICT withholding of 280 ms ITL stall highlight until phase-long!
      if (lg > 0.35) {
        nodes.push(
          line([x220 + 12, rY], [x500 - 12, rY], { stroke: ROLE.fail, width: 10 })
            .glow(10, ROLE.fail)
            .opacity(lg),
          txt(
            'ITL STALL: 280 ms (T3 -> T4)',
            (x220 + x500) * 0.5,
            rY - 62,
            28,
            ROLE.fail,
            'mono',
            'center',
          )
            .glow(8, ROLE.fail)
            .opacity(lg),
        );
      }

      // Top-right goodput note
      nodes.push(
        txt('FLEET GOODPUT DEFINITION', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Successful req/s meeting ALL SLOs', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
        txt('Report rejections separately!', 480, -334, 26, COSMOS.muted, 'mono', 'center'),
      );

      // Bottom prediction prompt -> ITL vs TPOT reveal
      const botY = 265;
      if (mn > 0.35) {
        nodes.push(
          txt(
            'TPOT = (500 - 200) / 3 = 100 ms/gap  (HIDES THE 280 ms FREEZE!)',
            0,
            botY,
            28,
            ROLE.warn,
            'mono',
            'center',
          ).glow(8, ROLE.warn),
          txt(
            'Gaps: 10 ms, 10 ms, 280 ms · Track p99 ITL alongside mean TPOT (1-token reply has 0 gaps)',
            0,
            botY + 54,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      } else if (lg > 0.35) {
        nodes.push(
          txt(
            'T3 -> T4 STALLED FOR 280 ms (WHILE T1->T2 & T2->T3 TOOK ONLY 10 ms EACH)',
            0,
            botY,
            26,
            ROLE.fail,
            'mono',
            'center',
          ).glow(8, ROLE.fail),
        );
      } else {
        nodes.push(
          txt(
            'Tokens at 200, 210, 220, 500 ms: which pair left the reader staring longest?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('phase-first', () => {
    s.play(tokensOn.to(1, { duration: clampDur(c, c.cue('phase-first').start, 0.45) }));
  });
  c.after('phase-long', () => {
    s.play(longReveal.to(1, { duration: clampDur(c, c.cue('phase-long').end, 0.4) }));
  });
  c.after('phase-mean', () => {
    s.play(meanReveal.to(1, { duration: clampDur(c, c.cue('phase-mean').end, 0.4) }));
  });
}
