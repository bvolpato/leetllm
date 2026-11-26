// Scene 05 (authorized-retrieval): "Filter the corpus before ranking candidates"
// 5-lane optical ACL laser-gate chamber: K2, K1, US, S1, ADM pass through Date, Region, and ACL
// glowing laser curtains before similarity scoring. Restricted ADM near-match deflects hard at ACL!
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  RUN,
  callerTag,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  heroTitle,
  lumBar,
  playCue,
  runPhase,
  seq,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function authorizedRetrieval(s, c) {
  const phase = s.value(0);
  const callerPulse = s.value(0);
  const stagePos = s.value(0); // 0=corpus, 1=Date gate, 2=Region gate, 3=ACL gate, 4=Rank prism
  const aclGlow = s.value(0);
  const admSpotlight = s.value(0);
  const showResult = s.value(0);

  const title = heroTitle(['Filter the Corpus', 'Before Ranking'], {
    x: -855,
    y: -440,
    size: 54,
    lineHeight: 64,
    accent: ROLE.admitted,
    eyebrow: 'PRE-FILTER AUTHORIZATION · LASER GATE CHAMBER',
  });

  // 5 corpus records and their exact gate stop columns
  const records = [
    { id: 'K2', desc: 'EU key v2', stopAt: 4, reason: 'score 7', color: ROLE.policy },
    { id: 'K1', desc: 'EU key v1', stopAt: 1, reason: 'EXPIRED', color: ROLE.session },
    { id: 'US', desc: 'US key v4', stopAt: 2, reason: 'WRONG REGION', color: ROLE.warn },
    { id: 'S1', desc: 'EU session v1', stopAt: 4, reason: 'score 2', color: ROLE.session },
    { id: 'ADM', desc: 'Admin override', stopAt: 3, reason: 'ACL DENIED', color: ROLE.danger },
  ];

  const colXs = [-520, -190, 140, 470, 770];
  const rowYs = [-180, -78, 24, 126, 228];

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const cp = callerPulse.value;
    const sp = stagePos.value;
    const ag = aclGlow.value;
    const admS = admSpotlight.value;
    const sr = showResult.value;

    const nodes = [callerTag(1)];

    if (cp > 0.05) {
      nodes.push(
        lumBar(600, -445, 570, 54, {
          color: ROLE.request,
          fillAlpha: 0.14 * cp,
          strokeWidth: 2.4,
          glow: 10 * cp,
          radius: 12,
          opacity: cp,
        }),
      );
    }

    // Column headers
    const headers = [
      { x: colXs[0], label: 'CORPUS', col: COSMOS.muted },
      { x: colXs[1], label: 'DATE GATE', col: ROLE.policy },
      { x: colXs[2], label: 'REGION: EU', col: ROLE.request },
      { x: colXs[3], label: 'ACL: support:eu', col: ag > 0.3 ? ROLE.focus : ROLE.admitted },
      { x: colXs[4], label: 'RANK', col: ROLE.admitted },
    ];
    headers.forEach(({ x, label, col }) => {
      nodes.push(
        txt(label, x, -268, 26, col, 'mono', 'center').glow(col === ROLE.focus ? 8 : 0, col),
      );
    });

    // Vertical laser gate beams for Date, Region, ACL
    [1, 2, 3].forEach((idx) => {
      const gx = colXs[idx];
      const isAcl = idx === 3;
      const col = isAcl && ag > 0.3 ? ROLE.focus : isAcl ? ROLE.admitted : ROLE.policy;
      nodes.push(
        line([gx, -228], [gx, 282], {
          stroke: col,
          width: isAcl ? 4.5 + ag * 2.5 : 3.0,
        })
          .glow((isAcl ? 11 + ag * 6 : 7) * pulse, col)
          .opacity(0.85),
      );
    });

    // Optical conduit lanes + moving record photons
    records.forEach((rec, i) => {
      const ry = rowYs[i];
      const progress = Math.min(sp, rec.stopAt);
      const i0 = Math.floor(Math.min(3.999, progress));
      const frac = progress - i0;
      const curX = colXs[i0] + (colXs[Math.min(4, i0 + 1)] - colXs[i0]) * frac;
      const stopped = sp >= rec.stopAt - 0.05 && rec.stopAt < 4;
      const ranked = sp >= 3.85 && rec.stopAt === 4;
      const isAdm = rec.id === 'ADM';

      // Conduit rail stops at rejection gate once rejected
      const railEnd = stopped ? colXs[rec.stopAt] : colXs[4];
      nodes.push(
        line([colXs[0], ry], [railEnd, ry], {
          stroke: ranked ? ROLE.admitted : stopped ? '#422536' : '#263455',
          width: ranked ? 4.0 : 2.6,
        }),
        txt(rec.id, -855, ry - 12, 32, rec.color, 'mono', 'left').glow(
          isAdm && admS > 0.3 ? 11 : 4,
          rec.color,
        ),
        txt(rec.desc, -855, ry + 26, 26, COSMOS.muted, 'sans', 'left'),
      );

      // Moving photon node
      const dotCol = stopped ? ROLE.danger : ranked ? ROLE.admitted : rec.color;
      nodes.push(
        glowRing(curX, ry, isAdm && admS > 0.3 ? 25 : 19, dotCol, {
          width: 3.2,
          glow: (isAdm && admS > 0.3 ? 14 : 9) * pulse,
          fillAlpha: stopped ? 0.22 : 0.12,
        }),
        glowDot(curX, ry, { radius: 8.5, color: dotCol, glow: 12 }),
      );

      if (stopped) {
        nodes.push(
          txt(rec.reason, colXs[rec.stopAt] + 46, ry, 26, ROLE.danger, 'mono', 'left').glow(
            isAdm && admS > 0.3 ? 10 : 5,
            ROLE.danger,
          ),
        );
      }

      if (ranked) {
        nodes.push(
          txt(rec.reason, colXs[4] + 34, ry, 28, ROLE.focus, 'mono', 'left').glow(7, ROLE.focus),
        );
      }
    });

    // Bottom readout (non-overlapping swap between legend and final permitted count)
    const legOp = Math.max(0, 1 - sr * 2.6);
    const resOp = Math.max(0, (sr - 0.45) / 0.55);
    if (legOp > 0.02) {
      nodes.push(
        txt(
          'Trusted caller identity forms the allowed evidence set before scoring',
          -855,
          385,
          30,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(legOp),
      );
    }
    if (resOp > 0.02) {
      nodes.push(
        txt(
          `Only ${RUN.allowedCount} permitted records enter reranking  ·  ADM held out`,
          -855,
          385,
          32,
          ROLE.admitted,
          'mono',
          'left',
        )
          .glow(8, ROLE.admitted)
          .opacity(resOp),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.admitted, ROLE.policy), title, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'trusted-request', callerPulse, 1, { dur: 0.6 });
  playCue(
    s,
    c,
    'form-evidence-set',
    (d) =>
      s.play(
        seq(
          stagePos.to(1, { duration: d * 0.33 }),
          stagePos.to(2, { duration: d * 0.33 }),
          stagePos.to(3, { duration: d * 0.34 }),
        ),
      ),
    { dur: 2.2 },
  );
  tweenCue(s, c, 'rank-allowed', stagePos, 4, { dur: 0.9 });
  tweenCue(s, c, 'preserve-permission', aclGlow, 1, { dur: 0.5 });
  tweenCue(s, c, 'deny-near-match', admSpotlight, 1, { dur: 0.55 });
  tweenCue(s, c, 'permitted-only', showResult, 1, { after: true, dur: 0.55 });
}
