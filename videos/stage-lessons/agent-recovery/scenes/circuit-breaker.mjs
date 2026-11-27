// Scene 7: circuit-breaker - "A circuit breaker limits calls to an unhealthy dependency"
// Glowing rotary circuit breaker switch with concentric generation rings (gen 1 -> gen 2 open ->
// half-open single probe -> gen 3 closed), then gen 3 stale success racing against gen 4 OPEN.
import { circle, line } from 'vizmatic/stage';
import {
  BREAKER_LIFE,
  BREAKER_RACE,
  COSMOS,
  ROLE,
  ambientClock,
  cinemaAtmosphere,
  glowArrow,
  glowDot,
  glowPill,
  glowRing,
  guardedDynamic,
  heroTitle,
  hexAlpha,
  lowerFooter,
  playCue,
  txt,
} from '../parts.mjs';

export default function circuitBreaker(s, c) {
  const title = heroTitle(['A circuit breaker limits calls', 'to an unhealthy dependency'], {
    x: -855,
    y: -440,
    size: 48,
    lineHeight: 56,
    accent: ROLE.fail,
  });

  const amb = ambientClock(s, c);
  const armLift = s.value(0); // 0 = closed, 1 = open, 0.5 = half-open
  const failCount = s.value(0);
  const breakerMode = s.value(0); // 0 = closed (gen 1), 1 = open (gen 2), 2 = half-open, 3 = closed (gen 3)
  const showCooldown = s.value(0);
  const showCancelNote = s.value(0);
  const raceMode = s.value(0);
  const staleReturn = s.value(0);
  const genGuard = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const nodes = [];
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 12);

      if (raceMode.value < 0.5) {
        // Main rotary switch center at (0, -48)
        const sx = 0;
        const sy = -48;
        const gap = 196;
        const leftX = sx - gap / 2;
        const rightX = sx + gap / 2;
        const modeIdx = Math.round(breakerMode.value);
        const stateName = ['CLOSED', 'OPEN', 'HALF-OPEN', 'CLOSED'][modeIdx] || 'CLOSED';
        const genNum =
          modeIdx === 0
            ? 1
            : modeIdx === 3
              ? BREAKER_LIFE.recovered.generation
              : BREAKER_LIFE.opened.generation;
        const stateCol = [ROLE.sure, ROLE.fail, ROLE.mark, ROLE.sure][modeIdx] || ROLE.sure;

        // Concentric generation halo rings (cleanly separated from top badge & lower gauges)
        nodes.push(
          glowRing(sx, sy, 140, stateCol, { width: 3, glow: 8 }).opacity(0.45 * alpha),
          glowRing(sx, sy, 172, stateCol, { width: 1.8, glow: 4 }).opacity(0.25 * alpha),
        );

        // Input and output power conduits
        nodes.push(
          line([-720, sy], [leftX, sy], { stroke: ROLE.agent, width: 4.5 }).glow(5, ROLE.agent),
          glowArrow(rightX, sy, 720, sy, stateCol, { width: 4.5, alpha, glow: 6 }),
          txt('CALLERS', -760, sy - 42, 26, ROLE.agent, 'mono', 'left').opacity(alpha),
          txt('DEPENDENCY', 760, sy - 42, 26, stateCol, 'mono', 'right').opacity(alpha),
        );

        // Rotating switch arm
        const angle = armLift.value * 0.85;
        const tipX = leftX + gap * Math.cos(angle);
        const tipY = sy - gap * Math.sin(angle);
        nodes.push(
          line([leftX, sy], [tipX, tipY], { stroke: stateCol, width: 9 }).glow(14, stateCol),
          circle(14, { fill: COSMOS.bg, stroke: COSMOS.ink, width: 3.5 }).at(leftX, sy),
          circle(14, { fill: COSMOS.bg, stroke: COSMOS.ink, width: 3.5 }).at(rightX, sy),
        );

        // State + Generation readout above switch
        nodes.push(
          glowPill(`${stateName}  ·  gen ${genNum}`, sx, -280, stateCol, { size: 30, alpha }),
        );

        // Failure threshold & probe slot status below switch (y = 215)
        const fCount = Math.round(failCount.value);
        nodes.push(
          txt('FAILURES', -460, 182, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          glowPill(
            `${fCount} / ${BREAKER_LIFE.opened.threshold}`,
            -460,
            242,
            fCount >= 2 ? ROLE.fail : ROLE.agent,
            {
              size: 28,
              alpha,
            },
          ),
          txt('PROBE SLOT', 0, 182, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          glowPill(
            modeIdx === 2
              ? '1 LIMITED PROBE'
              : showCancelNote.value > 0.5
                ? 'CANCEL RELEASES SLOT'
                : 'IDLE',
            0,
            242,
            modeIdx === 2 ? ROLE.mark : ROLE.sure,
            { size: 26, alpha },
          ),
          txt('COOLDOWN', 460, 182, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          glowPill(
            showCooldown.value > 0.5 ? (modeIdx >= 2 ? 'ELAPSED' : 'ACTIVE') : 'STANDBY',
            460,
            242,
            modeIdx === 1 ? ROLE.fail : ROLE.controller,
            { size: 26, alpha },
          ),
        );

        nodes.push(
          txt(
            showCancelNote.value > 0.5
              ? 'Healthy probe closes; failure reopens; cancellation must release the probe slot.'
              : 'Open breaker fails fast during cooldown instead of overloading a failing service.',
            0,
            345,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Beat 3: Generation Race (stale gen 3 success vs newer gen 4 OPEN)
        const ra = raceMode.value * alpha;
        const topY = -125;
        const botY = 125;

        nodes.push(
          txt(
            'GENERATION GUARD: STALE REPLY CANNOT CLOSE A NEWER OUTAGE',
            0,
            -270,
            27,
            ROLE.mark,
            'mono',
            'center',
          ).opacity(ra),
        );

        // Upper track: Older in-flight request (gen 3) returns data to caller
        const oldX = 560 - 820 * staleReturn.value;
        nodes.push(
          glowArrow(580, topY, -270, topY, hexAlpha(ROLE.controller, 0.55 * ra), {
            width: 3.5,
            alpha: ra,
          }),
          glowPill(
            `gen ${BREAKER_RACE.olderGeneration} · slow OK reply`,
            Math.max(-60, Math.min(240, oldX)),
            topY - 62,
            ROLE.controller,
            {
              size: 26,
              alpha: ra,
            },
          ),
          glowDot(oldX, topY, { radius: 11, color: ROLE.controller, glow: 14, opacity: ra }),
          glowPill('CALLER RECEIVES RESULT', -580, topY, ROLE.sure, {
            size: 26,
            alpha: staleReturn.value * ra,
          }),
        );

        // Lower track: Current breaker state stays OPEN at gen 4
        nodes.push(
          glowRing(0, botY, 96, ROLE.fail, { width: 4.5, glow: 14 }).opacity(ra),
          txt('OPEN', 0, botY - 14, 30, ROLE.fail, 'mono', 'center').opacity(ra),
          txt(
            `gen ${BREAKER_RACE.currentGeneration}`,
            0,
            botY + 24,
            28,
            COSMOS.ink,
            'mono',
            'center',
          ).opacity(ra),
          glowPill(
            `gen ${BREAKER_RACE.olderGeneration} != gen ${BREAKER_RACE.currentGeneration} -> IGNORE FOR HEALTH`,
            0,
            botY + 148,
            ROLE.mark,
            { size: 28, alpha: Math.max(0.4, genGuard.value) * ra * (0.85 + 0.15 * pulse) },
          ),
        );

        nodes.push(
          txt(
            'Valid data for its waiting caller is not proof the dependency is healthy now.',
            0,
            345,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(ra),
        );
      }

      nodes.push(
        lowerFooter(
          'CLOSED -> OPEN -> HALF-OPEN PROBE',
          raceMode.value > 0.5
            ? `STALE GEN ${BREAKER_RACE.olderGeneration} != CURRENT GEN ${BREAKER_RACE.currentGeneration}`
            : 'GENERATION-SCOPED BREAKER',
          { accent: raceMode.value > 0.5 ? ROLE.fail : ROLE.sure, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.fail, ROLE.sure), title, layer);

  playCue(s, c, 'closed-calls', (d) => s.play(armLift.to(0, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'failure-threshold', (d) => s.play(failCount.to(2, { duration: d })), {
    dur: 0.55,
  });
  playCue(
    s,
    c,
    'open-breaker',
    (d) => s.play(armLift.to(1, { duration: d }), breakerMode.to(1, { duration: 0.1 })),
    { dur: 0.55 },
  );
  playCue(s, c, 'cooldown', (d) => s.play(showCooldown.to(1, { duration: d })), { dur: 0.45 });
  playCue(
    s,
    c,
    'half-open-probe',
    (d) => s.play(armLift.to(0.5, { duration: d }), breakerMode.to(2, { duration: 0.1 })),
    { dur: 0.55 },
  );
  playCue(
    s,
    c,
    'healthy-probe',
    (d) => s.play(armLift.to(0, { duration: d }), breakerMode.to(3, { duration: 0.1 })),
    { dur: 0.55 },
  );
  playCue(s, c, 'reopen', (d) => s.play(showCancelNote.to(0.5, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'cancel-probe', (d) => s.play(showCancelNote.to(0.8, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'cancel-release', (d) => s.play(showCancelNote.to(1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'older-success', (d) => s.play(raceMode.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'caller-result', (d) => s.play(staleReturn.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'newer-generation', (d) => s.play(genGuard.to(0.7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'generation-check', (d) => s.play(genGuard.to(1, { duration: d })), { dur: 0.45 });
}
