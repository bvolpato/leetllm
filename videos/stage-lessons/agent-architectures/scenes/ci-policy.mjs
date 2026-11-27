// Scene 6: ci-policy - A successful lookup can report a failed build
// Dual CI investigation tracks: Track A (migration failed -> read migration -> unguarded column ->
// review semantics, no write) vs Track B (runner unavailable / timeout -> defer after 1 call),
// plus 2-attempt host cap blocking a 3rd dispatch while still allowing a final answer.
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

export default function ciPolicy(s, c) {
  const pulse = s.value(0);
  const ciResOn = s.value(0);
  const fileReadOn = s.value(0);
  const conclOn = s.value(0);
  const runnerOn = s.value(0);
  const deferOn = s.value(0);
  const timeoutOn = s.value(0);
  const cap2On = s.value(0);
  const block3On = s.value(0);

  const header = cinemaHeader(
    'TOOL SUCCESS VS DOMAIN FAILURE',
    'A successful lookup can',
    'report a failed build',
    { accent: ROLE.action, size: 48 },
  );

  const stageAura = aura(140, 40, 640, '#5ce1e61c', '#fb923c1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const cr = ciResOn.value;
      const fr = fileReadOn.value;
      const cn = conclOn.value;
      const rn = runnerOn.value;
      const df = deferOn.value;
      const tm = timeoutOn.value;
      const c2 = cap2On.value;
      const b3 = block3On.value;
      const nodes = [];

      // Track A (y = -115): Migration failure path
      const yA = -115;
      nodes.push(
        txt('PATH A', -840, yA, 26, ROLE.action, 'mono', 'left'),
        orbNode(-620, yA, 'CI', ROLE.ok, {
          radius: 46,
          sub: cr > 0.3 ? 'migration failed' : 'read CI',
        }),
        beamWithPhotons(
          [
            [-568, yA],
            [-215, yA],
          ],
          ROLE.action,
          p * 1.1,
          { alpha: 0.35 + fr * 0.65, width: 3.4 },
        ),
        orbNode(-155, yA, 'FILE', ROLE.action, {
          radius: 46,
          sub: fr > 0.3 ? 'column unguarded' : 'migration file',
          opacity: 0.3 + fr * 0.7,
        }),
        beamWithPhotons(
          [
            [-103, yA],
            [250, yA],
          ],
          ROLE.ok,
          p * 1.1 + 0.5,
          { alpha: 0.25 + cn * 0.75, width: 3.4 },
        ),
        orbNode(310, yA, 'LOG', ROLE.ok, {
          radius: 46,
          sub: cn > 0.3 ? 'Review semantics · 0 writes' : '...',
          opacity: 0.25 + cn * 0.75,
        }),
      );

      // Track B (y = 105): Runner unavailable / timeout -> defer after 1 call
      const yB = 105;
      const aB = 0.25 + rn * 0.75;
      nodes.push(
        txt('PATH B', -840, yB, 26, ROLE.caution, 'mono', 'left').opacity(aB),
        orbNode(-620, yB, 'CI', ROLE.caution, {
          radius: 46,
          sub: tm > 0.3 ? 'timeout -> error receipt' : 'runner unavailable',
          opacity: aB,
        }),
        beamWithPhotons(
          [
            [-568, yB],
            [-215, yB],
          ],
          ROLE.caution,
          p * 1.1 + 0.3,
          { alpha: aB * (0.3 + df * 0.7), width: 3.4 },
        ),
        orbNode(-155, yB, 'DEFER', ROLE.caution, {
          radius: 52,
          sub: df > 0.3 ? 'Insufficient evidence (1 call)' : '...',
          opacity: aB * (0.3 + df * 0.7),
        }),
        txt('[ 2nd read empty ]', 310, yB, 26, COSMOS.dim, 'mono', 'center').opacity(aB),
      );

      // Bottom 2-attempt budget cap bar (y = 315)
      const yC = 315;
      const aC = 0.25 + c2 * 0.75;
      nodes.push(
        line([-840, 235], [840, 235], { stroke: '#26365c', width: 2 }).opacity(0.65),
        txt('HOST ATTEMPT CAP: 2', -840, yC, 26, ROLE.host, 'mono', 'left').opacity(aC),
        orbNode(-360, yC, '#1', ROLE.ok, { radius: 34, opacity: aC }),
        orbNode(-220, yC, '#2', ROLE.ok, { radius: 34, opacity: aC }),
        orbNode(-60, yC, '#3', b3 > 0.3 ? ROLE.fail : COSMOS.dim, {
          radius: 34,
          opacity: aC,
        }),
        txt(
          b3 > 0.3
            ? 'BLOCKED BEFORE 3RD DISPATCH  ·  FINAL ANSWER STILL ALLOWED'
            : 'Keep request, repo, revision & retrieval time',
          20,
          yC,
          26,
          b3 > 0.3 ? ROLE.fail : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(b3 > 0.3 ? 6 : 0, ROLE.fail)
          .opacity(aC),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('aa-ci-policy-0', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('aa-ci-policy-0').start, 0.25) }));
  });
  c.on('ci-request', () => {
    s.play(pulse.to(0.5, { duration: clampDur(c, c.cue('ci-request').start, 0.25) }));
  });
  c.on('ci-first-result', () => {
    s.play(ciResOn.to(1, { duration: clampDur(c, c.cue('ci-first-result').start, 0.35) }));
  });
  c.on('ci-second-read', () => {
    s.play(fileReadOn.to(1, { duration: clampDur(c, c.cue('ci-second-read').start, 0.35) }));
  });
  c.on('ci-conclusion', () => {
    s.play(conclOn.to(1, { duration: clampDur(c, c.cue('ci-conclusion').start, 0.35) }));
  });
  c.on('aa-ci-policy-1', () => {
    s.play(runnerOn.to(0.5, { duration: clampDur(c, c.cue('aa-ci-policy-1').start, 0.25) }));
  });
  c.on('ci-runner', () => {
    s.play(runnerOn.to(1, { duration: clampDur(c, c.cue('ci-runner').start, 0.35) }));
  });
  c.on('ci-defer', () => {
    s.play(deferOn.to(1, { duration: clampDur(c, c.cue('ci-defer').start, 0.35) }));
  });
  c.on('ci-timeout', () => {
    s.play(timeoutOn.to(1, { duration: clampDur(c, c.cue('ci-timeout').start, 0.35) }));
  });
  c.on('aa-ci-policy-2', () => {
    s.play(cap2On.to(0.5, { duration: clampDur(c, c.cue('aa-ci-policy-2').start, 0.25) }));
  });
  c.on('ci-two-attempts', () => {
    s.play(cap2On.to(1, { duration: clampDur(c, c.cue('ci-two-attempts').start, 0.35) }));
  });
  c.on('ci-third-held', () => {
    s.play(block3On.to(1, { duration: clampDur(c, c.cue('ci-third-held').start, 0.35) }));
  });
}
