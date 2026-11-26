// Scene 2: separate-checks - What did the check establish?
// Dual-gate optical prism: deterministic exact field match passes both records cleanly,
// while a keyword scanner on free prose rings BOTH "Run rollback" and "Do not run rollback"
// (prediction withheld until `keyword-hits`), exposing the negation reversal.
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  exactFields,
  glowDot,
  guardedDynamic,
  policy,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function separateChecks(s, c) {
  const pulse = s.value(0);
  const exactOn = s.value(0);
  const proseOn = s.value(0);
  const oppOn = s.value(0);
  const scanOn = s.value(0);
  const hitsOn = s.value(0);
  const negOn = s.value(0);

  const exactOk = exactFields({
    policyVersion: policy.version,
    actions: policy.actions,
  });

  const header = cinemaHeader(
    'DETERMINISTIC VS SEMANTIC',
    'What did the check',
    'actually establish?',
    {
      accent: ROLE.policy,
      size: 50,
    },
  );

  const prismAura = aura(120, 60, 640, '#60a5fa20', '#ff6b8b16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ex = exactOn.value;
      const pr = proseOn.value;
      const op = oppOn.value;
      const sc = scanOn.value;
      const ht = hitsOn.value;
      const ng = negOn.value;
      const nodes = [];

      // Policy source beacon on left
      nodes.push(
        txt('POLICY  DEP-27', -840, -170, 26, ROLE.policy, 'mono', 'left'),
        txt('action == run_rollback', -840, -124, 28, COSMOS.ink, 'mono', 'left'),
        circle(10, { fill: ROLE.policy, stroke: '#ffffff', width: 1.5 })
          .at(-430, -124)
          .glow(10, ROLE.policy),
      );

      // Two structured records flowing horizontally into the Exact Field Gate
      const r1Y = -170;
      const r2Y = -70;
      const gateX = 110;
      const path1 = [
        [-380, r1Y],
        [gateX, r1Y],
      ];
      const path2 = [
        [-380, r2Y],
        [gateX, r2Y],
      ];
      nodes.push(
        beamWithPhotons(path1, ROLE.policy, p * 0.9, { alpha: 0.55 + ex * 0.45, width: 3 }),
        beamWithPhotons(path2, ROLE.policy, p * 0.9 + 0.45, { alpha: 0.55 + ex * 0.45, width: 3 }),
        txt('REC A  DEP-27 · rollback', -360, r1Y - 30, 26, COSMOS.muted, 'mono', 'left'),
        txt('REC B  DEP-27 · rollback', -360, r2Y + 34, 26, COSMOS.muted, 'mono', 'left'),
        // Exact field gate aperture (vertical glowing pillar, not a prose card)
        line([gateX, -225], [gateX, -15], {
          stroke: ex > 0.4 ? ROLE.ok : ROLE.policy,
          width: 6,
        }).glow(10, ex > 0.4 ? ROLE.ok : ROLE.policy),
        txt('EXACT CODE GATE', gateX, -258, 26, ROLE.policy, 'mono', 'center'),
      );

      if (ex > 0.05) {
        const out1 = [
          [gateX, r1Y],
          [560, r1Y],
        ];
        const out2 = [
          [gateX, r2Y],
          [560, r2Y],
        ];
        nodes.push(
          beamWithPhotons(out1, ROLE.ok, p * 1.1, { alpha: ex, width: 3.4 }),
          beamWithPhotons(out2, ROLE.ok, p * 1.1 + 0.5, { alpha: ex, width: 3.4 }),
          txt(exactOk ? 'PASS (EXACT)' : 'FAIL', 590, r1Y, 28, ROLE.ok, 'mono', 'left')
            .glow(6, ROLE.ok)
            .opacity(ex),
          txt(exactOk ? 'PASS (EXACT)' : 'FAIL', 590, r2Y, 28, ROLE.ok, 'mono', 'left')
            .glow(6, ROLE.ok)
            .opacity(ex),
        );
      }

      // Lower Prose Channel: two opposite sentences
      const p1Y = 140;
      const p2Y = 275;
      nodes.push(
        txt('PROSE CHANNEL', -840, 82, 26, ROLE.stepwise, 'mono', 'left').opacity(0.35 + pr * 0.65),
        line([-840, p1Y - 24], [-840, p2Y + 32], { stroke: ROLE.stepwise, width: 4 })
          .glow(6, ROLE.stepwise)
          .opacity(0.35 + pr * 0.65),
      );

      if (pr > 0.05) {
        nodes.push(
          txt('Reply 1:  “Run the rollback.”', -805, p1Y, 34, COSMOS.ink, 'serif', 'left').opacity(
            pr,
          ),
        );
      }
      if (op > 0.05) {
        nodes.push(
          txt(
            'Reply 2:  “Do not run the rollback.”',
            -805,
            p2Y,
            34,
            COSMOS.ink,
            'serif',
            'left',
          ).opacity(op),
        );
      }

      // Keyword scanner beam sweeping across "rollback"
      if (sc > 0.05) {
        const scanX = gateX + Math.sin(p * Math.PI * 2.4) * 18;
        nodes.push(
          line([scanX, 95], [scanX, 325], { stroke: ROLE.verdict, width: 4, dash: [8, 8] })
            .glow(9, ROLE.verdict)
            .opacity(sc),
          txt('KEYWORD: "rollback"', scanX, 62, 26, ROLE.verdict, 'mono', 'center').opacity(sc),
        );
        // Before `keyword-hits`, withhold answer!
        if (ht < 0.05) {
          nodes.push(
            txt(
              'Which replies pass the keyword search?',
              205,
              205,
              28,
              ROLE.verdict,
              'serif',
              'left',
            )
              .glow(6, ROLE.verdict)
              .opacity(sc),
          );
        }
      }

      // Reveal: BOTH pass keyword search (2/2 hits), then rose negation reveals contradiction
      if (ht > 0.05) {
        const k1 = quadArcPts([gateX, p1Y], [540, p1Y], -22);
        const k2 = quadArcPts([gateX, p2Y], [540, p2Y], 22);
        nodes.push(
          beamWithPhotons(k1, ROLE.verdict, p * 1.3, { alpha: ht, width: 3.2 }),
          beamWithPhotons(k2, ROLE.verdict, p * 1.3 + 0.5, { alpha: ht, width: 3.2 }),
          txt('HIT 1/2 · PASS', 575, p1Y, 28, ROLE.verdict, 'mono', 'left')
            .glow(6, ROLE.verdict)
            .opacity(ht),
          txt('HIT 2/2 · PASS', 575, p2Y, 28, ROLE.verdict, 'mono', 'left')
            .glow(6, ROLE.verdict)
            .opacity(ht),
        );
      }

      if (ng > 0.05) {
        // Rose highlight bar beneath "Do not" + semantic verdict warning
        nodes.push(
          line([-650, p2Y + 42], [-525, p2Y + 42], { stroke: ROLE.conflict, width: 5 })
            .glow(10, ROLE.conflict)
            .opacity(ng),
          glowDot(-588, p2Y + 42, { radius: 6, color: ROLE.conflict, glow: 12, opacity: ng }),
          txt(
            'NEGATION REVERSES MEANING  ·  JUDGE PROSE, HOST KEEPS PERMISSIONS',
            -840,
            405,
            26,
            ROLE.conflict,
            'mono',
            'left',
          )
            .glow(6, ROLE.conflict)
            .opacity(ng),
        );
      }

      return group(...nodes);
    },
  );

  s.add(prismAura, header, view);
  driftValue(s, c, pulse, 3.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('exact-fields', () => {
    s.play(exactOn.to(1, { duration: clampDur(c, c.cue('exact-fields').start, 0.4) }));
  });
  c.on('two-sentences', () => {
    s.play(proseOn.to(1, { duration: clampDur(c, c.cue('two-sentences').start, 0.35) }));
  });
  c.on('opposite-meaning', () => {
    s.play(oppOn.to(1, { duration: clampDur(c, c.cue('opposite-meaning').start, 0.35) }));
  });
  c.on('search-word', () => {
    s.play(scanOn.to(1, { duration: clampDur(c, c.cue('search-word').start, 0.4) }));
  });
  // Strict prediction withholding: reveal "Both pass" AFTER its spoken phrase!
  c.after('keyword-hits', () => {
    s.play(hitsOn.to(1, { duration: clampDur(c, c.cue('keyword-hits').end, 0.4) }));
  });
  c.on('negation', () => {
    s.play(negOn.to(1, { duration: clampDur(c, c.cue('negation').start, 0.4) }));
  });
}
