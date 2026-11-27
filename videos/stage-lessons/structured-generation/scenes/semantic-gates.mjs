// Scene 17: semantic-gates - Which run does the evidence describe?
// Act 0 (Beat 0): Opening log compared against both valid status records (passed contradicts vs failed agrees).
// Act 1 (Beats 1-2): Citation identity bridge linking Record (RUN-842, failed) to Cited Log
// (RUN-842 -> flips to RUN-843, both failed!), then join-check lights crimson identity mismatch!
import { group, line } from 'vizmatic/stage';
import {
  CI_RUN,
  COSMOS,
  LANGUAGE,
  ROLE,
  RUN_LOG,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  fsmNode,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function semanticGates(s, c) {
  const valuesChecked = s.value(0);
  const act = s.value(0); // 0 = status comparison, 1 = citation run_id join
  const runSwitched = s.value(0);
  const idChecked = s.value(0);

  const header = cinemaHeader(
    'SEMANTIC IDENTITY JOIN',
    'Which run does the',
    'evidence describe?',
    { accent: ROLE.prefix, size: 50 },
  );

  const stageAura = aura(200, 40, 640, '#ffd1661c', '#6ee7b716');

  // Persistent opening log beacon at top
  const logBeacon = guardedDynamic(
    () => 1,
    () =>
      group(
        opticalRail(-840, -260, -160, ROLE.prefix),
        txt('RUNNER LOG (OPENING EVIDENCE)', -805, -242, 26, ROLE.prefix, 'mono', 'left'),
        txt(RUN_LOG, -805, -184, 34, COSMOS.ink, 'sans', 'left'),
        line([-840, -125], [840, -125], { stroke: '#25355a', width: 2 }),
      ),
  );

  // Act 0: Both valid records vs runner log
  const act0 = guardedDynamic(
    () => fadeOutHalf(act.value),
    (a) => {
      const vc = valuesChecked.value;
      const nodes = [];

      nodes.push(
        txt('TWO SCHEMA-VALID STATUS RECORDS', -840, -72, 26, COSMOS.muted, 'mono', 'left').opacity(
          a,
        ),
      );

      LANGUAGE.forEach((rec, i) => {
        const y = 38 + i * 165;
        const matches = JSON.parse(rec).status === CI_RUN.status;
        nodes.push(
          opticalRail(
            -840,
            y - 48,
            y + 48,
            vc > 0.4 ? (matches ? ROLE.legal : ROLE.prune) : ROLE.fsm,
            {
              opacity: a,
            },
          ),
          txt(rec, -805, y, 44, COSMOS.ink, 'mono', 'left').opacity(a),
          txt(
            vc > 0.4
              ? matches
                ? 'AGREES WITH LOG'
                : 'CONTRADICTS LOG'
              : 'valid JSON + valid enum',
            180,
            y,
            32,
            vc > 0.4 ? (matches ? ROLE.legal : ROLE.prune) : COSMOS.muted,
            'mono',
            'left',
          )
            .glow(vc > 0.4 ? 8 : 0, matches ? ROLE.legal : ROLE.prune)
            .opacity(a),
        );
      });

      nodes.push(
        txt(
          'Both shapes obey the grammar; only one describes what actually happened',
          -840,
          360,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: Citation Identity Join (RUN-842 vs RUN-843, both failed!)
  const act1 = guardedDynamic(
    () => fadeInHalf(act.value),
    (a) => {
      const sw = runSwitched.value;
      const ic = idChecked.value;
      const nodes = [];

      const citedRun = sw > 0.45 ? 'RUN-843' : CI_RUN.run_id;
      const idMatch = citedRun === CI_RUN.run_id;

      // Left pillar: Record to verify
      nodes.push(
        opticalRail(-840, -55, 190, ROLE.fsm, { opacity: a }),
        txt('RECORD TO VERIFY', -805, -35, 26, ROLE.fsm, 'mono', 'left').opacity(a),
        txt(CI_RUN.run_id, -805, 48, 68, COSMOS.ink, 'mono', 'left').opacity(a),
        txt('status: "failed"', -805, 138, 36, ROLE.legal, 'mono', 'left').opacity(a),
      );

      // Right pillar: Cited Log
      const rCol = sw > 0.45 ? ROLE.prune : ROLE.fsm;
      nodes.push(
        opticalRail(170, -55, 190, rCol, { opacity: a }),
        txt('RUN IN CITED LOG', 205, -35, 26, rCol, 'mono', 'left').opacity(a),
        txt(citedRun, 205, 48, 68, sw > 0.45 ? ROLE.prefix : COSMOS.ink, 'mono', 'left')
          .glow(sw > 0.45 ? 9 : 0, ROLE.prefix)
          .opacity(a),
        txt('status: "failed"', 205, 138, 36, ROLE.legal, 'mono', 'left').opacity(a),
      );

      // Center identity join bridge (status matches, run_id mismatches!)
      const topBeam = quadArcPts([-220, 48], [135, 48], -34);
      const botBeam = quadArcPts([-220, 138], [135, 138], 34);
      nodes.push(
        beamWithPhotons(topBeam, idMatch ? ROLE.legal : ROLE.prune, 0, {
          alpha: a,
          width: 3.6,
        }),
        beamWithPhotons(botBeam, ROLE.legal, 0, { alpha: a * 0.8, width: 2.8 }),
        fsmNode(-42, 48, 52, idMatch ? '=' : '!=', {
          color: idMatch ? ROLE.legal : ROLE.prune,
          size: 36,
          opacity: a,
        }),
        txt('STATUS AGREES', -42, 205, 26, ROLE.legal, 'mono', 'center').opacity(a),
      );

      // Bottom verdict
      if (ic > 0.35) {
        nodes.push(
          txt(
            'IDENTITY MISMATCH (842 != 843)  ·  REQUEST EVIDENCE FOR RUN-842',
            -840,
            345,
            32,
            ROLE.prune,
            'mono',
            'left',
          )
            .glow(10, ROLE.prune)
            .opacity(a * ic),
        );
      } else {
        nodes.push(
          txt(
            sw > 0.45
              ? 'The cited log exists and also says failed, yet it describes RUN-843!'
              : 'Verify that cited evidence actually identifies the same run',
            -840,
            345,
            30,
            sw > 0.45 ? ROLE.prefix : COSMOS.muted,
            'serif',
            'left',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, logBeacon, act0, act1);

  c.on('join-values', () => {
    s.play(valuesChecked.to(1, { duration: clampDur(c, c.cue('join-values').start, 0.4) }));
  });
  c.onBeat(1, () => {
    s.play(act.to(1, { duration: clampDur(c, c.beats[1].start, 0.35) }));
  });
  c.on('join-change', () => {
    s.play(runSwitched.to(1, { duration: clampDur(c, c.cue('join-change').start, 0.45) }));
  });
  c.on('join-check', () => {
    s.play(idChecked.to(1, { duration: clampDur(c, c.cue('join-check').start, 0.45) }));
  });
}
