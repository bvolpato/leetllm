// Scene 19: repeated-proposal - A new call ID cannot repair the same rejected action
// Canonical Fingerprint Condenser stripping transport `call_id` and sorting JSON keys so two
// repeated invalid proposals collide at the breaker while Dual Gauges track 2 Proposals vs 0 Dispatches.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  driftValue,
  energyRail,
  glowMeter,
  guardedDynamic,
  hexGate,
  proposalFingerprint,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function repeatedProposal(s, c) {
  const pulse = s.value(0);
  const fpOn = s.value(0);
  const noIdOn = s.value(0);
  const sortedOn = s.value(0);
  const countsOn = s.value(0);
  const twoZeroOn = s.value(0);
  const changedOn = s.value(0);

  const fp1 = proposalFingerprint({
    id: 'call-1',
    name: 'get_release_status',
    args: { run_id: 'reranker-v16' },
  });
  const fp2 = proposalFingerprint({
    id: 'call-2',
    name: 'get_release_status',
    args: { run_id: 'reranker-v16' },
  });

  const header = cinemaHeader(
    'CANONICAL LOOP BREAKER',
    'A new call ID cannot repair',
    'the same rejected action',
    { accent: ROLE.denied, size: 46 },
  );

  const stageAura = aura(120, 40, 620, '#ff6b8b1c', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const fp = fpOn.value;
      const ni = noIdOn.value;
      const sr = sortedOn.value;
      const ct = countsOn.value;
      const tz = twoZeroOn.value;
      const ch = changedOn.value;
      const nodes = [];

      // Left: Two proposals with different call_ids converging on one canonical hash
      const y1 = -160;
      const y2 = 15;
      nodes.push(
        energyRail(-855, y1 - 38, y1 + 42, ROLE.proposal),
        txt('TURN 1  ·  id: "call-1"', -825, y1 - 16, 26, ROLE.proposal, 'mono', 'left'),
        txt('get_release_status({run_id: "v16"})', -825, y1 + 28, 26, COSMOS.ink, 'mono', 'left'),
        energyRail(-855, y2 - 38, y2 + 42, ROLE.denied),
        txt(
          ni > 0.35 ? 'TURN 2  ·  id: "call-2"  (IGNORED!)' : 'TURN 2  ·  id: "call-2"',
          -825,
          y2 - 16,
          26,
          ROLE.denied,
          'mono',
          'left',
        ),
        txt(
          sr > 0.35
            ? 'Sorted keys -> IDENTICAL canonical JSON'
            : 'get_release_status({run_id: "v16"})',
          -825,
          y2 + 28,
          26,
          sr > 0.35 ? ROLE.focus : COSMOS.ink,
          'mono',
          'left',
        ),
      );

      // Center Condenser Gate + Breaker
      const cx = 30;
      const cy = -72;
      nodes.push(
        beamWithPhotons(quadArcPts([-220, y1], [cx - 86, cy - 22], -18), ROLE.proposal, p * 1.1, {
          alpha: 0.5 + fp * 0.5,
          width: 3.4,
        }),
        beamWithPhotons(
          quadArcPts([-220, y2], [cx - 86, cy + 22], 18),
          ROLE.denied,
          p * 1.1 + 0.5,
          {
            alpha: 0.5 + ni * 0.5,
            width: 3.4,
          },
        ),
        hexGate(cx, cy, 78, ROLE.runtime, { label: 'HASH', sub: 'name + sorted args', glow: 12 }),
        beamWithPhotons(
          [
            [cx + 88, cy],
            [270, cy],
          ],
          ROLE.denied,
          p * 1.3,
          { alpha: 0.45 + ni * 0.55, width: 3.6 },
        ),
        circuitBreaker(360, cy, 110, 1, ROLE.ok),
        txt(
          fp1 === fp2 ? 'DUPLICATE -> HALT' : 'UNIQUE',
          465,
          cy - 18,
          28,
          ROLE.denied,
          'mono',
          'left',
        ).glow(8, ROLE.denied),
        txt('Excludes call_id · Ignores key order', 465, cy + 32, 26, COSMOS.muted, 'sans', 'left'),
      );

      // Middle Dual Counters: Model Proposals (2) vs Service Dispatches (0)
      const gY = 175;
      const cOp = 0.4 + Math.max(ct, tz) * 0.6;
      nodes.push(
        line([-855, 100], [840, 100], { stroke: '#25355a', width: 2 }),
        txt('MODEL PROPOSALS SPENT:  2 / 3', -855, gY - 22, 28, ROLE.caution, 'mono', 'left')
          .glow(tz > 0.35 ? 7 : 0, ROLE.caution)
          .opacity(cOp),
        glowMeter(-855, gY + 32, 740, 28, tz > 0.35 ? 2 / 3 : 1 / 3, {
          fill: ROLE.caution,
          opacity: cOp,
        }),
        txt('SERVICE DISPATCHES:  0', 60, gY - 22, 28, ROLE.ok, 'mono', 'left')
          .glow(tz > 0.35 ? 7 : 0, ROLE.ok)
          .opacity(cOp),
        glowMeter(60, gY + 32, 740, 28, 0.0, {
          fill: ROLE.ok,
          opacity: cOp,
        }),
        txt(
          'A tool log alone misses generation spend · Enforce turn, call, time & cost caps outside the prompt',
          0,
          gY + 98,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(cOp),
      );

      // Bottom Beat 2 rule
      const chOp = 0.35 + ch * 0.65;
      nodes.push(
        txt(
          'Changed call gets 1 bounded validation attempt (never widens permissions) · Stop cleanly if catalog lacks capability',
          0,
          388,
          26,
          ch > 0.35 ? ROLE.ok : COSMOS.dim,
          'serif',
          'center',
        )
          .glow(ch > 0.35 ? 5 : 0, ROLE.ok)
          .opacity(chOp),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('tu-repeated-proposal-1', () => {
    s.play(fpOn.to(1, { duration: clampDur(c, c.cue('tu-repeated-proposal-1').start, 0.3) }));
  });
  c.on('tu-repeat-no-id', () => {
    s.play(noIdOn.to(1, { duration: clampDur(c, c.cue('tu-repeat-no-id').start, 0.35) }));
  });
  c.on('tu-repeat-sorted', () => {
    s.play(sortedOn.to(1, { duration: clampDur(c, c.cue('tu-repeat-sorted').start, 0.35) }));
  });
  c.on('tu-repeated-proposal-2', () => {
    s.play(countsOn.to(1, { duration: clampDur(c, c.cue('tu-repeated-proposal-2').start, 0.35) }));
  });
  c.on('tu-repeat-two-zero', () => {
    s.play(twoZeroOn.to(1, { duration: clampDur(c, c.cue('tu-repeat-two-zero').start, 0.35) }));
  });
  c.on('tu-repeated-proposal-3', () => {
    s.play(changedOn.to(1, { duration: clampDur(c, c.cue('tu-repeated-proposal-3').start, 0.35) }));
  });
}
