// Scene 12: breaker-contract - "A probe result belongs to one generation"
// Two visual phases: (1) Health scope filter (only documented dependency failures count; tenant +
// dependency + failure class scoped; local event loop vs fleet),
// (2) Single half-open probe slot token (cancel -> release & reopen; non-health -> release & keep
// half-open; stale gen 3 -> return to caller without closing gen 4; job-1 still needs lookup).
import { circle, line } from 'vizmatic/stage';
import {
  BREAKER_RACE,
  COSMOS,
  OP,
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

export default function breakerContract(s, c) {
  const title = heroTitle(['A probe result belongs', 'to one generation'], {
    x: -855,
    y: -440,
    size: 50,
    lineHeight: 58,
    accent: ROLE.mark,
  });

  const amb = ambientClock(s, c);
  const stage = s.value(0); // 0 = scope filter, 1 = single probe slot outcomes
  const showDoc = s.value(0);
  const showOther = s.value(0);
  const showScope = s.value(0);
  const showFleet = s.value(0);

  const showCancel = s.value(0);
  const showNonHealth = s.value(0);
  const showStale = s.value(0);
  const showJobLookup = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        // Stage 1: Scoped failure admission filter
        nodes.push(
          txt(
            'WHICH FAILURES COUNT TOWARD A CIRCUIT BREAKER?',
            0,
            -275,
            28,
            ROLE.agent,
            'mono',
            'center',
          ).opacity(alpha),
        );

        // Left incoming error streams
        nodes.push(
          glowPill('Timeout / 503 (dependency)', -520, -110, ROLE.fail, {
            size: 26,
            alpha: Math.max(0.55, showDoc.value) * alpha,
          }),
          glowArrow(-260, -110, -40, -110, ROLE.fail, { width: 3.5, alpha }),
          glowPill('COUNTS -> BREAKER', 240, -110, ROLE.fail, {
            size: 26,
            alpha: Math.max(0.55, showDoc.value) * alpha,
          }),
          glowPill('Schema / Permission Denial', -520, 45, ROLE.mark, {
            size: 26,
            alpha: Math.max(0.35, showOther.value) * alpha,
          }),
          glowArrow(-260, 45, -40, 45, ROLE.mark, { width: 3, alpha, dash: [8, 6] }),
          glowPill('DIFFERENT BOUNDARY', 240, 45, ROLE.sure, {
            size: 26,
            alpha: Math.max(0.35, showOther.value) * alpha,
          }),
        );

        // Scope key strip (dependency + tenant + failure class)
        const scOp = Math.max(0.35, showScope.value) * alpha;
        nodes.push(
          glowPill('Scope Key: (dependency, tenant, failure_class)', -200, 195, ROLE.agent, {
            size: 27,
            alpha: scOp,
          }),
          glowPill('1 loop != fleet', 485, 195, ROLE.violet, {
            size: 27,
            alpha: Math.max(0.35, showFleet.value) * alpha,
          }),
          txt(
            'One exhausted tenant quota must never trip the circuit for unrelated tenants.',
            0,
            320,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 2: Single half-open probe slot token + 3 outcomes
        const hubX = -510;
        const hubY = 15;
        nodes.push(
          txt(
            'SINGLE HALF-OPEN PROBE SLOT & GENERATION TOKEN',
            0,
            -275,
            28,
            ROLE.mark,
            'mono',
            'center',
          ).opacity(alpha),
          glowRing(hubX, hubY, 105, ROLE.mark, { width: 4.5, glow: 14 }).opacity(alpha),
          circle(16, { fill: ROLE.mark, stroke: null }).at(
            hubX + Math.cos(amb.value * Math.PI * 8) * 105,
            hubY + Math.sin(amb.value * Math.PI * 8) * 105,
          ),
          txt('PROBE', hubX, hubY - 16, 30, ROLE.mark, 'mono', 'center').opacity(alpha),
          txt('SLOT: 1', hubX, hubY + 24, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
        );

        const branches = [
          {
            y: -145,
            title: 'CANCELED',
            res: 'Release slot -> REOPEN + propagate cancel',
            col: ROLE.fail,
            op: Math.max(0.5, showCancel.value),
          },
          {
            y: 15,
            title: 'NON-HEALTH',
            res: 'Release slot -> STAY HALF-OPEN (no verdict)',
            col: ROLE.mark,
            op: Math.max(0.4, showNonHealth.value),
          },
          {
            y: 175,
            title: `STALE GEN ${BREAKER_RACE.olderGeneration}`,
            res: `Return to caller · GEN ${BREAKER_RACE.currentGeneration} STAYS OPEN`,
            col: ROLE.controller,
            op: Math.max(0.4, showStale.value),
          },
        ];

        for (const b of branches) {
          const ba = b.op * alpha;
          nodes.push(
            glowArrow(hubX + 118, hubY, -225, b.y, b.col, { width: 3.2, alpha: ba }),
            glowPill(b.title, -70, b.y, b.col, { size: 26, alpha: ba }),
            txt(b.res, 110, b.y, 26, COSMOS.ink, 'sans', 'left').opacity(ba),
          );
        }

        nodes.push(
          glowPill(
            showJobLookup.value > 0.4
              ? `Controller still holds ${OP.job} -> look up the job to know its state`
              : 'Breaker state reflects dependency health, not whether an earlier write ran',
            0,
            325,
            showJobLookup.value > 0.4 ? ROLE.sure : ROLE.op,
            { size: 27, alpha: alpha * (0.88 + 0.12 * pulse) },
          ),
        );
      }

      nodes.push(
        lowerFooter(
          'SCOPED HEALTH · 1 PROBE SLOT · GENERATION GUARD',
          st === 0
            ? 'DEPENDENCY + TENANT + FAILURE CLASS'
            : 'ALWAYS RELEASE SLOT ON CANCEL / ERROR',
          { accent: ROLE.mark, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.mark, ROLE.fail), title, layer);

  playCue(s, c, 'documented', (d) => s.play(showDoc.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'other-boundary', (d) => s.play(showOther.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'health-scope', (d) => s.play(showScope.to(0.7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'quota', (d) => s.play(showScope.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'local-loop', (d) => s.play(showFleet.to(0.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'fleet', (d) => s.play(showFleet.to(1, { duration: d })), { dur: 0.45 });

  playCue(
    s,
    c,
    'canceled-probe',
    (d) => s.play(stage.to(1, { duration: 0.15 }), showCancel.to(0.7, { duration: d })),
    {
      dur: 0.45,
    },
  );
  playCue(s, c, 'probe-cancel', (d) => s.play(showCancel.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'non-health', (d) => s.play(showNonHealth.to(0.7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'probe-nonhealth', (d) => s.play(showNonHealth.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'old-result', (d) => s.play(showStale.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'not-proof', (d) => s.play(showJobLookup.to(1, { duration: d })), { dur: 0.45 });
}
