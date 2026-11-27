// Scene 8: expiry - "Two reads, one millisecond apart"
// Precision injected-clock ruler zooming onto 14.999 s vs 15.000 s, physical memory row staying
// resident until read-time cleanup, MathJax boundary rule, and strict prediction withholding!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  expiryState,
  glowCross,
  glowDot,
  glowPill,
  glowTex,
  guardedDynamic,
  hexAlpha,
  lowerFooter,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function expiry(s, c) {
  const title = sceneHeading(['Two reads, one', 'millisecond apart'], { accent: ROLE.focus });

  const written = s.value(0);
  const hasDeadline = s.value(0);
  const clockShown = s.value(0);
  const read1Done = s.value(0);
  const clockPos = s.value(0); // 0 = 14.999 s, 1 = 15.000 s
  const stepDone = s.value(0);
  const showQuestion = s.value(0);
  const revealMiss = s.value(0); // STRICTLY AFTER 'expiry-miss'!
  const showRule = s.value(0);

  const before = expiryState(14.999);
  const at = expiryState(15);

  const eqRule = glowTex(
    't_{\\text{expires}} \\le t_{\\text{now}} \\;\\Longrightarrow\\; \\text{expired}',
    {
      x: 410,
      y: -415,
      size: 32,
      color: COSMOS.rose,
      glow: 7,
    },
  );

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const isWritten = written.value > 0.5;
      const isDl = hasDeadline.value > 0.5;
      const isMiss = revealMiss.value > 0.5;
      const isStep = stepDone.value > 0.5;
      const isQ = showQuestion.value > 0.5 && !isMiss;
      const nodes = [];

      // Top arithmetic banner (floating mono capsule)
      nodes.push(
        glowPill(
          isDl
            ? `write at 10 s  +  TTL 5 s  =  deadline ${at.expiresAt.toFixed(3)} s`
            : 'write("task:1", "running", ttl=5) at t = 10 s',
          0,
          -272,
          isDl ? ROLE.focus : ROLE.workerB,
          { size: 28, fixedW: 940, alpha, glow: 8 },
        ),
      );

      // Left: Physical Memory Row (STAYS in memory during prediction hold until expiry-miss!)
      const lx = -450;
      nodes.push(
        txt('PHYSICAL MEMORY ROW', lx, -172, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
      if (!isWritten) {
        nodes.push(
          glowPill('store: empty', lx, -82, COSMOS.dim, {
            size: 27,
            fixedW: 580,
            alpha: 0.6 * alpha,
            glow: 0,
            textColor: COSMOS.muted,
          }),
        );
      } else if (isMiss) {
        nodes.push(
          glowPill('task:1  [DELETED ON READ]', lx, -82, ROLE.fail, {
            size: 27,
            fixedW: 620,
            alpha,
            glow: 11,
          }),
          glowCross(lx - 340, -82, 28, ROLE.fail, alpha),
        );
      } else {
        nodes.push(
          glowPill(
            `task:1  ->  "running"  |  exp: ${isDl ? '15.000' : '?'}`,
            lx,
            -82,
            isStep ? ROLE.warn : ROLE.ok,
            { size: 27, fixedW: 650, alpha, glow: 10 },
          ),
        );
        if (isStep) {
          nodes.push(
            txt(
              'still resident in memory before get()',
              lx,
              -18,
              26,
              ROLE.warn,
              'mono',
              'center',
            ).opacity(alpha),
          );
        }
      }

      // Right: Observed get("task:1") Results
      const rx = 445;
      nodes.push(
        txt('OBSERVED get("task:1")', rx, -172, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        glowPill(
          read1Done.value > 0.5 ? `t = 14.999 s  ->  "${before.value}"` : 't = 14.999 s  ->  ...',
          rx,
          -102,
          read1Done.value > 0.5 ? ROLE.ok : COSMOS.dim,
          {
            size: 27,
            fixedW: 590,
            alpha: read1Done.value > 0.5 ? alpha : 0.55 * alpha,
            glow: read1Done.value > 0.5 ? 10 : 0,
          },
        ),
        glowPill(
          isMiss
            ? 't = 15.000 s  ->  None'
            : isStep
              ? 't = 15.000 s  ->  ?'
              : 't = 15.000 s  ->  ...',
          rx,
          -14,
          isMiss ? ROLE.fail : isStep ? ROLE.focus : COSMOS.dim,
          {
            size: 27,
            fixedW: 590,
            alpha: isMiss || isStep ? alpha : 0.45 * alpha,
            glow: isMiss || isStep ? 12 : 0,
          },
        ),
      );

      // Precision 1ms Clock Ruler (y = 140)
      if (clockShown.value > 0.1) {
        const ca = clockShown.value * alpha;
        const xLeft = -680;
        const xRight = 680;
        const x14999 = -340;
        const x15000 = 340;
        const curX = x14999 + (x15000 - x14999) * clockPos.value;
        const rulerY = 135;

        nodes.push(
          line([xLeft, rulerY], [xRight, rulerY], { stroke: '#34476e', width: 5 }).opacity(ca),
          // Tick at 14.999 s
          line([x14999, rulerY - 26], [x14999, rulerY + 26], {
            stroke: ROLE.ok,
            width: 4.5,
          }).opacity(ca),
          txt('14.999 s', x14999, rulerY + 62, 28, ROLE.ok, 'mono', 'center').opacity(ca),
          // Tick at 15.000 s (deadline laser)
          line([x15000, rulerY - 42], [x15000, rulerY + 32], {
            stroke: ROLE.fail,
            width: 5,
          })
            .glow(10, ROLE.fail)
            .opacity(ca),
          txt('15.000 s (deadline)', x15000, rulerY + 62, 28, ROLE.fail, 'mono', 'center').opacity(
            ca,
          ),
          // Moving clock cursor photon
          glowDot(curX, rulerY, {
            radius: 14,
            color: clockPos.value > 0.5 ? ROLE.fail : ROLE.focus,
            glow: 16,
            opacity: ca,
          }),
          txt(
            clockPos.value > 0.5 ? 'now = 15.000 s' : 'now = 14.999 s',
            curX,
            rulerY - 62,
            26,
            clockPos.value > 0.5 ? ROLE.fail : ROLE.focus,
            'mono',
            'center',
          ).opacity(ca),
          // +1 ms gap indicator
          txt('+0.001 s', 0, rulerY + 62, 26, COSMOS.muted, 'mono', 'center').opacity(
            hexAlpha('#ffffff', 0.8) ? 0.85 * ca : ca,
          ),
        );
      }

      // Bottom prompt / takeaway
      const capY = 335;
      if (showRule.value > 0.5) {
        nodes.push(
          txt(
            'Lazy expiry: get() checks expires_at <= now, deletes the row, and returns None.',
            0,
            capY,
            28,
            ROLE.fail,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (isMiss) {
        nodes.push(
          txt(
            'At t = 15.000 s, equality counts as expired: get() returns None and removes the row.',
            0,
            capY,
            28,
            ROLE.fail,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (isQ) {
        nodes.push(
          txt(
            'The old row is still in memory. At exactly 15.000 s, what does get() return?',
            0,
            capY,
            30,
            ROLE.focus,
            'serif',
            'center',
          )
            .glow(7, ROLE.focus)
            .opacity(alpha),
        );
      } else {
        nodes.push(
          txt(
            'An injected clock lets tests jump straight to the last millisecond before expiry.',
            0,
            capY,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'INJECTED CLOCK BOUNDARY  ·  TTL = 5 s',
          isMiss ? 't = 15.000 s -> None (CLEANED ON READ)' : '14.999 s LIVE  ·  15.000 s ?',
          { accent: isMiss ? ROLE.fail : ROLE.focus, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.focus, ROLE.fail), title, layer);

  playCue(s, c, 'expiry-write', () => s.play(written.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'expiry-deadline', () => s.play(hasDeadline.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'expiry-before', (d) => s.play(clockShown.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'expiry-first-read', () => s.play(read1Done.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(
    s,
    c,
    'expiry-step',
    (d) => s.play(clockPos.to(1, { duration: d }), stepDone.to(1, { duration: 0.05 })),
    { dur: 0.65 },
  );
  playCue(s, c, 'expiry-question', () => s.play(showQuestion.to(1, { duration: 0.05 })), {
    dur: 0.1,
  });
  // Strict prediction reveal ONLY AFTER 'expiry-miss'!
  playCue(s, c, 'expiry-miss', () => s.play(revealMiss.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  c.show('expiry-remove', eqRule, { after: true });
  playCue(s, c, 'expiry-remove', () => s.play(showRule.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
}
