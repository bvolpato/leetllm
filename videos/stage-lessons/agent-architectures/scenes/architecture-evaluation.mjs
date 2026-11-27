// Scene 32: architecture-evaluation - Two policies on the same release
// Facing execution tracks for Fixed Checklist vs Early-Exit Policy on the SAME host & 4-turn
// budget: Migration failure (both 3 reads + 4th answer) -> Runner outage (prediction pause!) ->
// Early-exit answers cleanly after 1 CI read while Fixed Checklist gets denied on migration!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  orbNode,
  txt,
} from '../parts.mjs';

export default function architectureEvaluation(s, c) {
  const pulse = s.value(0);
  const migOn = s.value(0);
  const outageMode = s.value(0);
  const firstReadOn = s.value(0);
  const ansReveal = s.value(0);
  const denReveal = s.value(0);
  const countOn = s.value(0);
  const matchedOn = s.value(0);

  const header = cinemaHeader(
    'CONTROLLED ARCHITECTURE BENCHMARK',
    'Two policies on',
    'the same release',
    { accent: ROLE.policy, size: 48 },
  );

  const stageAura = aura(160, 40, 620, '#a78bfa1e', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const mg = migOn.value;
      const ot = outageMode.value;
      const fr = firstReadOn.value;
      const an = ansReveal.value;
      const dn = denReveal.value;
      const ct = countOn.value;
      const mt = matchedOn.value;
      const nodes = [];

      const isOutage = ot > 0.45;
      const xs = [-540, -140, 260, 640];
      const yFixed = -105;
      const yEarly = 128;

      nodes.push(
        txt(
          isOutage
            ? 'FIXTURE 2: RUNNER OUTAGE  (ONLY CI READ PERMITTED · 4-TURN BUDGET)'
            : 'FIXTURE 1: MIGRATION FAILURE  (SAME HOST · 4-TURN BUDGET)',
          0,
          -205,
          26,
          isOutage ? ROLE.caution : ROLE.action,
          'mono',
          'center',
        ),
      );

      // Top Track: Fixed 3-Read Checklist
      nodes.push(
        txt('FIXED', -820, yFixed, 26, ROLE.host, 'mono', 'left'),
        orbNode(xs[0], yFixed, 'CI', ROLE.ok, {
          radius: 46,
          sub: isOutage ? 'runner down' : 'read #1',
        }),
      );
      if (!isOutage) {
        nodes.push(
          beamWithPhotons(
            [
              [xs[0] + 52, yFixed],
              [xs[1] - 52, yFixed],
            ],
            ROLE.action,
            p * 1.1,
            { alpha: 0.4 + mg * 0.6, width: 3.2 },
          ),
          orbNode(xs[1], yFixed, 'FILE', ROLE.action, {
            radius: 46,
            sub: 'read #2',
            opacity: 0.4 + mg * 0.6,
          }),
          orbNode(xs[2], yFixed, 'REPLAY', ROLE.action, {
            radius: 46,
            sub: 'read #3',
            opacity: 0.4 + mg * 0.6,
          }),
          orbNode(xs[3], yFixed, 'ANS', ROLE.ok, {
            radius: 46,
            sub: 'turn 4',
            opacity: 0.4 + mg * 0.6,
          }),
        );
      } else {
        nodes.push(
          beamWithPhotons(
            [
              [xs[0] + 52, yFixed],
              [xs[1] - 56, yFixed],
            ],
            dn > 0.35 ? ROLE.fail : '#2d3f6b',
            p * 1.1,
            { alpha: dn > 0.35 ? 1 : 0.35, width: 3.4 },
          ),
          orbNode(xs[1], yFixed, dn > 0.35 ? 'DENIED' : '?', dn > 0.35 ? ROLE.fail : ROLE.focus, {
            radius: 52,
            sub: dn > 0.35 ? 'Asks for migration!' : 'Next move?',
          }),
          txt(
            ct > 0.35 ? '1 completed read -> FAILED' : '',
            310,
            yFixed,
            26,
            ROLE.fail,
            'mono',
            'left',
          ),
        );
      }

      // Bottom Track: Early-Exit Policy
      nodes.push(
        txt('EARLY', -820, yEarly, 26, ROLE.policy, 'mono', 'left'),
        orbNode(xs[0], yEarly, 'CI', ROLE.ok, {
          radius: 46,
          sub: isOutage ? 'runner down' : 'read #1',
        }),
      );
      if (!isOutage) {
        nodes.push(
          beamWithPhotons(
            [
              [xs[0] + 52, yEarly],
              [xs[1] - 52, yEarly],
            ],
            ROLE.action,
            p * 1.1 + 0.5,
            { alpha: 0.4 + mg * 0.6, width: 3.2 },
          ),
          orbNode(xs[1], yEarly, 'FILE', ROLE.action, {
            radius: 46,
            sub: 'read #2',
            opacity: 0.4 + mg * 0.6,
          }),
          orbNode(xs[2], yEarly, 'REPLAY', ROLE.action, {
            radius: 46,
            sub: 'read #3',
            opacity: 0.4 + mg * 0.6,
          }),
          orbNode(xs[3], yEarly, 'ANS', ROLE.ok, {
            radius: 46,
            sub: 'turn 4',
            opacity: 0.4 + mg * 0.6,
          }),
        );
      } else {
        nodes.push(
          beamWithPhotons(
            [
              [xs[0] + 52, yEarly],
              [xs[1] - 56, yEarly],
            ],
            an > 0.35 ? ROLE.ok : '#2d3f6b',
            p * 1.1 + 0.5,
            { alpha: an > 0.35 ? 1 : 0.35, width: 3.4 },
          ),
          orbNode(xs[1], yEarly, an > 0.35 ? 'OUTAGE' : '?', an > 0.35 ? ROLE.ok : ROLE.focus, {
            radius: 52,
            sub: an > 0.35 ? 'Answers cleanly!' : 'Next move?',
          }),
          txt(
            ct > 0.35 ? '1 completed read -> SOLVED!' : '',
            310,
            yEarly,
            26,
            ROLE.ok,
            'mono',
            'left',
          ),
        );
      }

      // Bottom prediction / benchmark discipline banner
      nodes.push(line([-840, 305], [840, 305], { stroke: '#25355a', width: 2 }).opacity(0.65));
      if (isOutage && fr > 0.3 && an < 0.05) {
        nodes.push(
          txt(
            'Both received the CI outage read. Which policy finishes the task?',
            0,
            365,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (mt > 0.35) {
        nodes.push(
          txt(
            'HOLD TASKS, TOOLS, PERMISSIONS & BUDGET FIXED · ADD COMPLEXITY ONLY WHEN EARNED',
            0,
            365,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).glow(6, ROLE.ok),
        );
      } else if (an > 0.35) {
        nodes.push(
          txt(
            'SAME READ COUNT (1 EACH), OPPOSITE OUTCOMES',
            0,
            365,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).glow(6, ROLE.ok),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('eval-policies', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('eval-policies').start, 0.25) }));
  });
  c.on('eval-three', () => {
    s.play(migOn.to(1, { duration: clampDur(c, c.cue('eval-three').start, 0.35) }));
  });
  c.on('eval-migration-answer', () => {
    s.play(migOn.to(1, { duration: 0.12 }));
  });
  c.on('eval-outage', () => {
    s.play(outageMode.to(1, { duration: clampDur(c, c.cue('eval-outage').start, 0.35) }));
  });
  c.on('eval-first-read', () => {
    s.play(firstReadOn.to(1, { duration: clampDur(c, c.cue('eval-first-read').start, 0.3) }));
  });
  c.on('eval-ask', () => {
    s.play(firstReadOn.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding!
  c.after('eval-answer', () => {
    s.play(ansReveal.to(1, { duration: clampDur(c, c.cue('eval-answer').end, 0.35) }));
  });
  c.after('eval-denied', () => {
    s.play(denReveal.to(1, { duration: clampDur(c, c.cue('eval-denied').end, 0.35) }));
  });
  c.on('eval-count', () => {
    s.play(countOn.to(1, { duration: clampDur(c, c.cue('eval-count').start, 0.35) }));
  });
  c.on('eval-matched', () => {
    s.play(matchedOn.to(1, { duration: clampDur(c, c.cue('eval-matched').start, 0.35) }));
  });
}
