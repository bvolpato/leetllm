// Scene 14: coverage - Show what happened to every attempt
// Live 10-attempt intake sorter (J01..J10 from records): 1 routes to rose unresolved,
// 1 to amber review, 8 stream into emerald resolved (8/10 = 80% coverage, 6/8 = 75%
// conditional agreement) -> then an 11th rose parse_error arrives, dropping coverage
// to 8/11 ~ 72.7% while keeping conditional agreement locked at 6/8 = 75%!
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  EXTRA_PARSE_REPORT,
  ROLE,
  attempts,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  glowMeter,
  guardedDynamic,
  matches,
  quadArcPts,
  records,
  resolved,
  txt,
} from '../parts.mjs';

export default function coverage(s, c) {
  const pulse = s.value(0);
  const unresOn = s.value(0);
  const revOn = s.value(0);
  const resOn = s.value(0);
  const covOn = s.value(0);
  const agrOn = s.value(0);
  const diffHi = s.value(0);
  const parse11 = s.value(0);
  const cov11 = s.value(0);
  const agrHold = s.value(0);

  const header = cinemaHeader(
    'COVERAGE VS AGREEMENT',
    'Show what happened to',
    'every single attempt',
    {
      accent: ROLE.ok,
      size: 50,
    },
  );

  const stageAura = aura(240, 40, 620, '#6ee7b71c', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const un = unresOn.value;
      const rv = revOn.value;
      const rs = resOn.value;
      const cv = covOn.value;
      const ag = agrOn.value;
      const df = diffHi.value;
      const p11 = parse11.value;
      const c11 = cov11.value;
      const ah = agrHold.value;
      const nodes = [];

      // Top intake row: 10 (or 11) glowing attempt orbs J01..J10 (+ J11 parse error)
      const count = p11 > 0.35 ? attempts + 1 : attempts;
      const startX = -750;
      const stepX = 148;
      const orbY = -140;

      nodes.push(
        txt(
          p11 > 0.35 ? 'ATTEMPTED PAIRS: 11  (+1 PARSE FAILURE)' : 'ATTEMPTED PAIRS: 10',
          -840,
          -228,
          26,
          p11 > 0.35 ? ROLE.conflict : ROLE.policy,
          'mono',
          'left',
        ),
      );

      for (let i = 0; i < count; i++) {
        const x = startX + i * stepX;
        let col = ROLE.policy;
        let tag = `J${String(i + 1).padStart(2, '0')}`;
        if (i < 8 && rs > 0.35) {
          col = ag > 0.35 && records[i].human !== records[i].outcome ? ROLE.verdict : ROLE.ok;
        } else if (i === 8 && un > 0.35) {
          col = ROLE.conflict;
        } else if (i === 9 && rv > 0.35) {
          col = ROLE.review;
        } else if (i === 10) {
          col = ROLE.conflict;
          tag = 'ERR';
        }
        nodes.push(
          circle(40, { fill: '#0b1224', stroke: col, width: 3.4 })
            .at(x, orbY)
            .glow(col !== ROLE.policy ? 9 : 4, col),
          txt(tag, x, orbY, 26, col, 'mono', 'center'),
        );
      }

      // 3 (or 4) Outcome Lanes below orbs
      const laneY = 48;
      const lanes = [
        {
          x: -580,
          title: 'RESOLVED',
          val: rs > 0.35 ? '8' : '?',
          col: ROLE.ok,
          on: 0.3 + rs * 0.7,
        },
        {
          x: -160,
          title: 'UNRESOLVED',
          val: un > 0.35 ? '1' : '0',
          col: ROLE.conflict,
          on: 0.3 + un * 0.7,
        },
        {
          x: 240,
          title: 'REVIEW',
          val: rv > 0.35 ? '1' : '0',
          col: ROLE.review,
          on: 0.3 + rv * 0.7,
        },
        {
          x: 640,
          title: 'PARSE ERR',
          val: p11 > 0.35 ? '1' : '0',
          col: ROLE.conflict,
          on: p11 > 0.35 ? 1 : 0.28,
        },
      ];

      // Flowing beams from orbs into outcome lanes
      if (rs > 0.35) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([startX + 3.5 * stepX, orbY + 44], [lanes[0].x, laneY - 52], 18),
            ROLE.ok,
            p * 1.1,
            {
              alpha: rs,
              width: 3.4,
            },
          ),
        );
      }
      if (un > 0.35) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([startX + 8 * stepX, orbY + 44], [lanes[1].x, laneY - 52], 18),
            ROLE.conflict,
            p * 1.1 + 0.3,
            {
              alpha: un,
              width: 3.4,
            },
          ),
        );
      }
      if (rv > 0.35) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([startX + 9 * stepX, orbY + 44], [lanes[2].x, laneY - 52], 18),
            ROLE.review,
            p * 1.1 + 0.6,
            {
              alpha: rv,
              width: 3.4,
            },
          ),
        );
      }
      if (p11 > 0.35) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([startX + 10 * stepX, orbY + 44], [lanes[3].x, laneY - 52], 18),
            ROLE.conflict,
            p * 1.3,
            {
              alpha: p11,
              width: 3.8,
            },
          ),
        );
      }

      lanes.forEach((ln) => {
        const hi = df > 0.35 && ln.title !== 'RESOLVED';
        nodes.push(
          txt(ln.title, ln.x, laneY - 22, 26, ln.col, 'mono', 'center').opacity(ln.on),
          txt(ln.val, ln.x, laneY + 34, 54, ln.col, 'mono', 'center')
            .glow(hi || ln.on > 0.8 ? 9 : 0, ln.col)
            .opacity(ln.on),
        );
      });

      // Bottom dual denominator meters: Coverage (left) vs Conditional Agreement (right)
      const mY = 230;
      const curCovFrac = c11 > 0.4 ? EXTRA_PARSE_REPORT.coverage : resolved / attempts;
      const curCovLabel =
        c11 > 0.4
          ? `COVERAGE: 8 / 11 = ${(EXTRA_PARSE_REPORT.coverage * 100).toFixed(1)}%`
          : `COVERAGE: ${resolved} / ${attempts} = 80%`;

      if (cv > 0.05) {
        nodes.push(
          txt(curCovLabel, -840, mY, 30, c11 > 0.4 ? ROLE.verdict : ROLE.ok, 'mono', 'left')
            .glow(7, c11 > 0.4 ? ROLE.verdict : ROLE.ok)
            .opacity(cv),
          glowMeter(-840, mY + 52, 740, 28, curCovFrac, {
            fill: c11 > 0.4 ? ROLE.verdict : ROLE.ok,
            opacity: cv,
          }),
          txt(
            'denominator = ALL attempts (incl. ties, parse errors)',
            -840,
            mY + 102,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(cv),
        );
      }

      if (ag > 0.05) {
        nodes.push(
          txt(
            `CONDITIONAL AGREEMENT: ${matches} / ${resolved} = 75%`,
            80,
            mY,
            30,
            ah > 0.4 ? ROLE.stepwise : ROLE.verdict,
            'mono',
            'left',
          )
            .glow(7, ah > 0.4 ? ROLE.stepwise : ROLE.verdict)
            .opacity(ag),
          glowMeter(80, mY + 52, 740, 28, matches / resolved, {
            fill: ah > 0.4 ? ROLE.stepwise : ROLE.verdict,
            opacity: ag,
          }),
          txt(
            ah > 0.4
              ? 'UNCHANGED: 8 comparable pairs, 6 match'
              : 'denominator = comparable resolved pairs only',
            80,
            mY + 102,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(ag),
        );
      }

      // Subtle horizon line separating intake from denominators
      nodes.push(line([-840, 150], [840, 150], { stroke: '#233154', width: 2 }).opacity(0.6));

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('all-attempts', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('all-attempts').start, 0.25) }));
  });
  c.on('unresolved-attempts', () => {
    s.play(unresOn.to(1, { duration: clampDur(c, c.cue('unresolved-attempts').start, 0.35) }));
  });
  c.on('review-attempt', () => {
    s.play(revOn.to(1, { duration: clampDur(c, c.cue('review-attempt').start, 0.35) }));
  });
  c.on('resolve-rest', () => {
    s.play(resOn.to(1, { duration: clampDur(c, c.cue('resolve-rest').start, 0.35) }));
  });
  c.on('resolved-denominator', () => {
    s.play(covOn.to(1, { duration: clampDur(c, c.cue('resolved-denominator').start, 0.35) }));
  });
  c.on('human-denominator', () => {
    s.play(agrOn.to(1, { duration: clampDur(c, c.cue('human-denominator').start, 0.35) }));
  });
  c.on('difficult-cases', () => {
    s.play(diffHi.to(1, { duration: clampDur(c, c.cue('difficult-cases').start, 0.35) }));
  });
  c.on('extra-parse', () => {
    s.play(parse11.to(1, { duration: clampDur(c, c.cue('extra-parse').start, 0.35) }));
  });
  c.on('extra-coverage', () => {
    s.play(cov11.to(1, { duration: clampDur(c, c.cue('extra-coverage').start, 0.35) }));
  });
  c.on('unchanged-agreement', () => {
    s.play(agrHold.to(1, { duration: clampDur(c, c.cue('unchanged-agreement').start, 0.35) }));
  });
}
