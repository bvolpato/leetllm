// Scene 16 (cache-identity): "A similar question can cross the decision boundary"
// 6-dimension glowing cache-key isolation lattice paired with a semantic-proximity vs
// decision-boundary diagram proving 10d/48h and 15d/48h sit on opposite sides of the 14d wall,
// plus separate access-controlled audit archive highlight.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  RULE,
  callerTag,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  heroTitle,
  lumBar,
  runPhase,
  statusPill,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function cacheIdentity(s, c) {
  const phase = s.value(0);
  const keyLit = s.value(0);
  const agesClash = s.value(0);
  const auditLit = s.value(0);

  const title = heroTitle(['A Similar Question Can', 'Cross the Boundary'], {
    x: -855,
    y: -440,
    size: 50,
    lineHeight: 60,
    accent: ROLE.policy,
    eyebrow: 'SEMANTIC CACHE ISOLATION · DECISION-CRITICAL INPUTS',
  });

  const dims = [
    { name: 'Principal / Region', cached: 'Luna / EU', req: 'Luna / EU' },
    { name: 'ACL Revision', cached: 'current grant', req: 'current grant' },
    { name: 'Bundle / Prompt / Model', cached: 'pinned v42', req: 'pinned v42' },
    { name: 'Intent', cached: 'rotation', req: 'rotation' },
    {
      name: 'Stale / Signal Ages',
      cached: `${RULE.requestDays}d / ${RULE.requestHours}h`,
      req: `${RULE.outsideDays}d / ${RULE.requestHours}h`,
      diff: true,
    },
    { name: 'Exact Audit Archive', cached: 'audit vault', req: 'audit vault', audit: true },
  ];

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const kl = keyLit.value;
    const ac = agesClash.value;
    const al = auditLit.value;

    const nodes = [callerTag(1)];

    // Left: 6-dimension cache-key lattice
    nodes.push(
      txt('CACHE KEY DIMENSION', -855, -242, 26, COSMOS.muted, 'mono', 'left'),
      txt('CACHED', -355, -242, 26, ROLE.policy, 'mono', 'center'),
      txt('INCOMING', -115, -242, 26, ROLE.request, 'mono', 'center'),
    );

    dims.forEach((d, i) => {
      const ry = -182 + i * 78;
      const isFail = d.diff && ac > 0.35;
      const isAud = d.audit && al > 0.35;
      const rowCol = isFail
        ? ROLE.danger
        : isAud
          ? ROLE.violet
          : kl > 0.3
            ? ROLE.policy
            : '#2c3d63';
      nodes.push(
        lumBar(-420, ry, 875, 60, {
          color: rowCol,
          fillAlpha: isFail || isAud ? 0.16 : 0.06,
          strokeWidth: isFail || isAud ? 2.4 : 1.7,
          glow: isFail || isAud ? 9 * pulse : 0,
          radius: 10,
        }),
        txt(d.name, -830, ry, 26, COSMOS.ink, 'sans', 'left'),
        txt(d.cached, -355, ry, 26, ROLE.policy, 'mono', 'center'),
        txt(
          d.diff ? (ac > 0.35 ? d.req : d.cached) : d.req,
          -115,
          ry,
          26,
          isFail ? ROLE.danger : ROLE.admitted,
          'mono',
          'center',
        ).glow(isFail ? 8 : 0, ROLE.danger),
      );
    });

    // Right: Semantic proximity vs hard 14-day policy wall
    const boxCx = 460;
    const boxCy = 15;
    const wallX = 485;
    nodes.push(
      lumBar(boxCx, boxCy, 790, 445, {
        color: ac > 0.35 ? ROLE.danger : ROLE.policy,
        fillAlpha: 0.07,
        strokeWidth: 2.2,
        glow: 7,
        radius: 16,
      }),
      txt('SEMANTIC SIMILARITY VS DECISION WALL', boxCx, -172, 26, ROLE.policy, 'mono', 'center'),
      // 14-day hard decision boundary laser wall (stops cleanly above bottom caption)
      line([wallX, -104], [wallX, 132], { stroke: ROLE.focus, width: 5.0 }).glow(
        11 * pulse,
        ROLE.focus,
      ),
      txt('14-DAY LIMIT', wallX, -134, 26, ROLE.focus, 'mono', 'center'),
      // Cached 10d query point (left of wall -> ELIGIBLE)
      glowRing(325, 20, 26, ROLE.admitted, { width: 3.2, glow: 10 }),
      glowDot(325, 20, { radius: 9, color: ROLE.admitted, glow: 12 }),
      txt('10d / 48h', 325, -36, 28, ROLE.admitted, 'mono', 'center'),
      txt('CACHED YES', 325, 76, 26, ROLE.admitted, 'mono', 'center'),
    );

    // Incoming 15d query point (sits cleanly on the right side of the 14d wall, fading in without crossing)
    const x15 = 655;
    if (ac > 0.05) {
      nodes.push(
        line([355, 20], [355 + (x15 - 385) * ac, 20], {
          stroke: ROLE.danger,
          width: 3,
          dash: [8, 6],
        }).opacity(ac),
        glowRing(x15, 20, 26, ROLE.danger, { width: 3.4, glow: 12 * pulse, opacity: ac }),
        glowDot(x15, 20, { radius: 9, color: ROLE.danger, glow: 14, opacity: ac }),
        txt('15d / 48h', x15, -36, 28, ROLE.danger, 'mono', 'center').opacity(ac),
        txt('MUST BE NO', x15, 76, 26, ROLE.danger, 'mono', 'center').opacity(ac),
        statusPill('CACHE HIT REJECTED', boxCx, 178, {
          color: ROLE.danger,
          width: 350,
          height: 48,
          opacity: ac,
        }),
      );
    } else {
      nodes.push(
        txt(
          'Bind principal, ACL, bundle & ages before reuse',
          boxCx,
          178,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );
    }

    // Bottom discrete status
    let footText =
      'Partition cache by principal, ACL revision, region, date, bundle, prompt & model';
    let footCol = COSMOS.muted;
    if (al > 0.5) {
      footText =
        'Keep general traces compact  ·  store exact prompts/replies in restricted audit vault';
      footCol = ROLE.violet;
    } else if (ac > 0.5) {
      footText = '15 stale days CANNOT reuse a cached 10-day yes despite similar wording';
      footCol = ROLE.danger;
    }
    nodes.push(
      txt(footText, -855, 415, 28, footCol, 'mono', 'left').glow(
        footCol !== COSMOS.muted ? 7 : 0,
        footCol,
      ),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.violet), title, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'pr-key', keyLit, 1, { dur: 0.65 });
  tweenCue(s, c, 'pr-ages', agesClash, 1, { dur: 0.8 });
  tweenCue(s, c, 'pr-audit', auditLit, 1, { dur: 0.6 });
}
