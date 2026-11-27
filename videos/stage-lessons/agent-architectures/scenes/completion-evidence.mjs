// Scene 7: completion-evidence - When has the investigation earned an answer?
// Facing evidence slots for R1842 (3 required reads + 4th answer turn) vs R1843 (1 read) ->
// Turn-1 uncited claim audit (prediction pause!) -> host rejects empty observed list ->
// 2-turn budget wall stopping before replay.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  orbNode,
  txt,
} from '../parts.mjs';

export default function completionEvidence(s, c) {
  const pulse = s.value(0);
  const aStep = s.value(0); // 1=CI, 2=file, 3=replay, 4=schema done
  const bOn = s.value(0);
  const claimMode = s.value(0); // 0=R1842/R1843, 1=unverified claim audit, 2=turn budget
  const rejectReveal = s.value(0);
  const turnStep = s.value(0); // 1=3 reads, 2=4th answer, 3=2-turn wall

  const header = cinemaHeader(
    'CLAIM-SPECIFIC EVIDENCE GATES',
    'When has an investigation',
    'earned its answer?',
    { accent: ROLE.ok, size: 48 },
  );

  const stageAura = aura(140, 40, 620, '#6ee7b71c', '#ff6b8b1a');

  // Mode 0: R1842 (3 reads) vs R1843 (1 read)
  const mode0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, claimMode.value)),
    (a) => {
      const p = 0;
      const st = aStep.value;
      const bo = bOn.value;
      const nodes = [];

      const yA = -90;
      const yB = 165;
      const xs = [-560, -140, 280, 660];

      nodes.push(
        txt('R1842 · SCHEMA BUG (3 READS)', -840, yA - 95, 26, ROLE.action, 'mono', 'left').opacity(
          a,
        ),
        orbNode(xs[0], yA, 'CI', ROLE.ok, { radius: 48, sub: 'migration failed', opacity: a }),
        beamWithPhotons(
          [
            [xs[0] + 54, yA],
            [xs[1] - 54, yA],
          ],
          ROLE.action,
          p * 1.1,
          { alpha: a * (st >= 1.5 ? 1 : 0.25), width: 3.4 },
        ),
        orbNode(xs[1], yA, 'FILE', ROLE.action, {
          radius: 48,
          sub: 'read migration',
          opacity: a * (st >= 1.5 ? 1 : 0.25),
        }),
        beamWithPhotons(
          [
            [xs[1] + 54, yA],
            [xs[2] - 54, yA],
          ],
          ROLE.action,
          p * 1.1 + 0.35,
          { alpha: a * (st >= 2.5 ? 1 : 0.25), width: 3.4 },
        ),
        orbNode(xs[2], yA, 'REPLAY', ROLE.action, {
          radius: 48,
          sub: 'throwaway DB',
          opacity: a * (st >= 2.5 ? 1 : 0.25),
        }),
        orbNode(xs[3], yA, 'PASS', ROLE.ok, {
          radius: 48,
          sub: 'all 3 observed',
          opacity: a * (st >= 3.5 ? 1 : 0.25),
        }),
      );

      // R1843 (1 read sufficient)
      const ab = a * (0.25 + bo * 0.75);
      nodes.push(
        txt(
          'R1843 · RUNNER OUTAGE (1 READ)',
          -840,
          yB - 95,
          26,
          ROLE.caution,
          'mono',
          'left',
        ).opacity(ab),
        orbNode(xs[0], yB, 'CI', ROLE.caution, { radius: 48, sub: 'runner down', opacity: ab }),
        beamWithPhotons(
          [
            [xs[0] + 54, yB],
            [xs[3] - 54, yB],
          ],
          ROLE.ok,
          p * 1.1 + 0.6,
          { alpha: ab, width: 3.4 },
        ),
        orbNode(xs[3], yB, 'PASS', ROLE.ok, { radius: 48, sub: '1 read suffices', opacity: ab }),
      );

      return group(...nodes);
    },
  );

  // Mode 1: Unverified Turn-1 Claim Audit (prediction pause!)
  const mode1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, claimMode.value)) * fadeOutHalf(Math.max(0, claimMode.value - 1)),
    (a) => {
      const rj = rejectReveal.value;
      const nodes = [];

      nodes.push(
        txt('MODEL TURN-1 CLAIM', -740, -140, 26, ROLE.policy, 'mono', 'left').opacity(a),
        txt(
          '“Schema bug confirmed: citing CI, File, Replay”',
          -740,
          -82,
          30,
          COSMOS.ink,
          'serif',
          'left',
        ).opacity(a),
        line([-740, 15], [740, 15], { stroke: '#2c3d66', width: 2.2 }).opacity(a),
        txt('HOST OBSERVED RECEIPTS LIST', -740, 80, 26, ROLE.host, 'mono', 'left').opacity(a),
        orbNode(-420, 185, 'EMPTY', ROLE.fail, { radius: 58, sub: 'CI slot: empty', opacity: a }),
        orbNode(0, 185, 'EMPTY', ROLE.fail, { radius: 58, sub: 'File slot: empty', opacity: a }),
        orbNode(420, 185, 'EMPTY', ROLE.fail, {
          radius: 58,
          sub: 'Replay slot: empty',
          opacity: a,
        }),
      );

      if (rj < 0.05) {
        nodes.push(
          txt('Can the host accept this answer?', 0, 355, 36, ROLE.focus, 'serif', 'center')
            .glow(6, ROLE.focus)
            .opacity(a),
        );
      } else {
        nodes.push(
          txt(
            'HOST REJECTS  ·  CITING A TOOL CANNOT FILL ITS RECEIPT SLOT',
            0,
            355,
            28,
            ROLE.fail,
            'mono',
            'center',
          )
            .glow(8, ROLE.fail)
            .opacity(a * rj),
        );
      }
      return group(...nodes);
    },
  );

  // Mode 2: Turn Budget Wall (4 turns vs 2-turn wall stopping before replay)
  const mode2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, claimMode.value - 1)),
    (a) => {
      const ts = turnStep.value;
      const xs = [-600, -200, 200, 600];
      const labels = ['T1: CI', 'T2: FILE', 'T3: REPLAY', 'T4: ANSWER'];
      const nodes = [
        txt(
          'TURN BUDGET COUNTER (HOST-ADMITTED TURNS)',
          -840,
          -165,
          26,
          ROLE.host,
          'mono',
          'left',
        ).opacity(a),
      ];

      xs.forEach((x, i) => {
        const blocked = ts >= 2.5 && i >= 2;
        const col = blocked ? ROLE.fail : i === 3 ? ROLE.ok : ROLE.action;
        nodes.push(
          orbNode(x, 30, `T${i + 1}`, col, {
            radius: 52,
            sub: labels[i],
            opacity: a * (blocked ? 0.45 : 1),
          }),
        );
      });

      if (ts >= 2.5) {
        nodes.push(
          line([0, -90], [0, 175], { stroke: ROLE.fail, width: 5, dash: [10, 8] })
            .glow(10, ROLE.fail)
            .opacity(a),
          txt('2-TURN LIMIT: STOPS BEFORE REPLAY', 0, 265, 30, ROLE.fail, 'mono', 'center')
            .glow(8, ROLE.fail)
            .opacity(a),
        );
      } else {
        nodes.push(
          txt(
            '3 tool-read turns + 1 answer turn = 4 admitted turns',
            0,
            265,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(a),
        );
      }
      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1, mode2);

  c.on('invest-ci', () => {
    s.play(aStep.to(1, { duration: clampDur(c, c.cue('invest-ci').start, 0.3) }));
  });
  c.on('invest-fact', () => {
    s.play(aStep.to(1.2, { duration: 0.15 }));
  });
  c.on('invest-file', () => {
    s.play(aStep.to(2, { duration: clampDur(c, c.cue('invest-file').start, 0.3) }));
  });
  c.on('invest-replay', () => {
    s.play(aStep.to(3, { duration: clampDur(c, c.cue('invest-replay').start, 0.3) }));
  });
  c.on('invest-schema', () => {
    s.play(aStep.to(4, { duration: clampDur(c, c.cue('invest-schema').start, 0.3) }));
  });
  c.on('invest-runner', () => {
    s.play(bOn.to(0.6, { duration: clampDur(c, c.cue('invest-runner').start, 0.3) }));
  });
  c.on('invest-outage', () => {
    s.play(bOn.to(1, { duration: clampDur(c, c.cue('invest-outage').start, 0.3) }));
  });
  c.on('invest-cites', () => {
    s.play(claimMode.to(1, { duration: clampDur(c, c.cue('invest-cites').start, 0.35) }));
  });
  c.on('invest-question', () => {
    s.play(claimMode.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding!
  c.after('invest-reject', () => {
    s.play(rejectReveal.to(1, { duration: clampDur(c, c.cue('invest-reject').end, 0.35) }));
  });
  c.on('invest-three', () => {
    const t = c.cue('invest-three').start;
    s.play(claimMode.to(2, { duration: clampDur(c, t, 0.35) }));
    s.play(turnStep.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('invest-fourth', () => {
    s.play(turnStep.to(2, { duration: clampDur(c, c.cue('invest-fourth').start, 0.3) }));
  });
  c.on('invest-limit', () => {
    s.play(turnStep.to(3, { duration: clampDur(c, c.cue('invest-limit').start, 0.3) }));
  });
  c.on('invest-stop', () => {
    s.play(turnStep.to(3, { duration: 0.12 }));
  });
}
