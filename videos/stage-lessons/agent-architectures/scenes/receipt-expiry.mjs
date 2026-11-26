// Scene 19: receipt-expiry - One second later
// Glowing vertical time-sweep across 4 receipt lifetime bars (CI 1200, Diff 1200,
// Health 1100, Decision 1200 inheriting Health's 1100 cutoff!): clock ticks 1099 -> 1100
// (prediction pause!) -> Health expires, Decision inherits invalidation -> fresh Health
// recomputes Decision -> switching revision invalidates ALL 3 reads!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function receiptExpiry(s, c) {
  const pulse = s.value(0);
  const clockSec = s.value(1099); // ticks 1099 -> 1100
  const readyReveal = s.value(0);
  const followCutoff = s.value(0);
  const blockEffect = s.value(0);
  const refreshOn = s.value(0);
  const revReset = s.value(0);

  const header = cinemaHeader(
    'EXCLUSIVE EXPIRY PROPAGATION',
    'One second later:',
    't = 1099 -> 1100',
    {
      accent: ROLE.clock,
      size: 48,
    },
  );

  const stageAura = aura(160, 40, 620, '#ffd1661c', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const tNow = clockSec.value;
      const rd = readyReveal.value;
      const fc = followCutoff.value;
      const be = blockEffect.value;
      const rf = refreshOn.value;
      const rv = revReset.value;
      const nodes = [];

      // Time axis: 950..1250s mapped to x in [-460..+720]
      const x0 = -460;
      const x1 = 720;
      const mapX = (sec) => x0 + ((sec - 950) / 300) * (x1 - x0);
      const x1100 = mapX(1100);
      const x1200 = mapX(1200);
      const curX = mapX(tNow);

      const rows = [
        { id: 'CI (c1842)', until: 1200, y: -150, expired: rv > 0.45 },
        { id: 'DIFF (c1842)', until: 1200, y: -55, expired: rv > 0.45 },
        {
          id: rf > 0.45 ? 'HEALTH (fresh)' : 'HEALTH (c1842)',
          until: rf > 0.45 ? 1200 : 1100,
          y: 40,
          expired: (tNow >= 1099.8 && rd > 0.35 && rf < 0.45) || rv > 0.45,
        },
        {
          id: rf > 0.45 ? 'DECISION (new)' : 'DECISION (old)',
          until: 1200,
          effUntil: rf > 0.45 ? 1200 : 1100,
          y: 135,
          expired: (tNow >= 1099.8 && fc > 0.35 && rf < 0.45) || rv > 0.45,
        },
      ];

      // Axis ticks
      nodes.push(
        txt('1000s', mapX(1000), 215, 26, COSMOS.dim, 'mono', 'center'),
        txt('1100s', x1100, 215, 26, ROLE.focus, 'mono', 'center'),
        txt('1200s', x1200, 215, 26, COSMOS.dim, 'mono', 'center'),
      );

      rows.forEach((row) => {
        const w = mapX(row.until) - x0;
        const col = row.expired ? ROLE.fail : ROLE.ok;
        nodes.push(
          txt(row.id, -840, row.y, 26, col, 'mono', 'left'),
          rect(w, 42, { fill: '#10182d', stroke: col, width: 2.2, radius: 7 })
            .at(x0 + w * 0.5, row.y)
            .opacity(0.9),
        );
        // Show inherited 1100s effective cutoff on Decision row!
        if (row.effUntil && fc > 0.35 && rf < 0.45 && rv < 0.45) {
          const effW = mapX(row.effUntil) - x0;
          nodes.push(
            rect(effW, 34, { fill: ROLE.fail, stroke: null, radius: 5 })
              .at(x0 + effW * 0.5, row.y)
              .glow(8, ROLE.fail)
              .opacity(0.65),
          );
        } else if (!row.expired) {
          const liveW = Math.max(12, curX - x0);
          nodes.push(
            rect(liveW, 34, { fill: ROLE.ok, stroke: null, radius: 5 })
              .at(x0 + liveW * 0.5, row.y)
              .opacity(0.55),
          );
        }
      });

      // Live vertical clock laser at curX
      nodes.push(
        line([curX, -195], [curX, 185], { stroke: ROLE.clock, width: 4 }).glow(10, ROLE.clock),
        txt(`t = ${Math.round(tNow)}s`, curX, -225, 28, ROLE.clock, 'mono', 'center').glow(
          7,
          ROLE.clock,
        ),
      );

      // Bottom status (strict prediction withholding when clock hits 1100!)
      let msg = 'Rule: valid strictly while now < expiry  (at 1099s all 4 are valid)';
      let mCol = COSMOS.muted;
      if (rv > 0.45) {
        msg = 'NEW REVISION c1843 -> RESTART ALL 3 READS (CLOCK FRESHNESS != RIGHT RELEASE)';
        mCol = ROLE.fail;
      } else if (rf > 0.45) {
        msg = 'FRESH HEALTH ARRIVES -> DISCARD OLD DECISION & RECOMPUTE FROM ALL 3 READS';
        mCol = ROLE.ok;
      } else if (be > 0.35) {
        msg = 'RERUN HEALTH · DECISION STALE · EFFECT WAITS';
        mCol = ROLE.fail;
      } else if (rd > 0.35) {
        msg = 'RERUN HEALTH (1100 < 1100 IS FALSE) · CI & DIFF STILL VALID';
        mCol = ROLE.focus;
      } else if (tNow >= 1099.5) {
        msg = 't = 1100s! Which read must rerun, and is the old decision still valid?';
        mCol = ROLE.focus;
      }
      nodes.push(
        txt(msg, 0, 325, 28, mCol, tNow >= 1099.5 && rd < 0.35 ? 'serif' : 'mono', 'center').glow(
          6,
          mCol,
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('expiry-health-row', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('expiry-health-row').start, 0.25) }));
  });
  c.on('expiry-decision-row', () => {
    s.play(pulse.to(0.6, { duration: clampDur(c, c.cue('expiry-decision-row').start, 0.25) }));
  });
  c.on('expiry-clock', () => {
    s.play(clockSec.to(1100, { duration: clampDur(c, c.cue('expiry-clock').start, 0.45) }));
  });
  c.on('expiry-predict', () => {
    s.play(clockSec.to(1100, { duration: 0.12 }));
  });
  // Strict prediction withholding!
  c.after('expiry-ready', () => {
    s.play(readyReveal.to(1, { duration: clampDur(c, c.cue('expiry-ready').end, 0.35) }));
  });
  c.on('expiry-follow', () => {
    s.play(followCutoff.to(1, { duration: clampDur(c, c.cue('expiry-follow').start, 0.35) }));
  });
  c.on('expiry-block', () => {
    s.play(blockEffect.to(1, { duration: clampDur(c, c.cue('expiry-block').start, 0.35) }));
  });
  c.on('expiry-refresh', () => {
    s.play(refreshOn.to(1, { duration: clampDur(c, c.cue('expiry-refresh').start, 0.35) }));
  });
  c.on('expiry-recompute', () => {
    s.play(refreshOn.to(1, { duration: 0.12 }));
  });
  c.on('expiry-revision', () => {
    s.play(revReset.to(1, { duration: clampDur(c, c.cue('expiry-revision').start, 0.35) }));
  });
  c.on('expiry-reset', () => {
    s.play(revReset.to(1, { duration: 0.12 }));
  });
}
