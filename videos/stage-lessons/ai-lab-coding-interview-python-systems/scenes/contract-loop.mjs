// Scene 2: contract-loop - "What should the test count?"
// Local fetch stub harness comparing 1-worker PASS vs 2-worker race FAIL on calls.count("/guide") == 1,
// then spotlighting the isolated regression loop for admission vs queue debugging.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowCross,
  glowDot,
  glowPill,
  guardedDynamic,
  hexAlpha,
  lowerFooter,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function contractLoop(s, c) {
  const title = sceneHeading(['What should the test count?'], { accent: ROLE.ok });

  const singleDone = s.value(0);
  const singlePass = s.value(0);
  const raceSeen = s.value(0);
  const raceDouble = s.value(0);
  const raceFail = s.value(0);
  const showIsolate = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const nodes = [];

      // Floating assertion centerpiece (no box chrome, glowing capsule)
      nodes.push(
        txt('LOCAL FETCH STUB ASSERTION', 0, -295, 26, COSMOS.muted, 'mono', 'center').opacity(
          alpha,
        ),
        glowPill('assert calls.count("/guide") == 1', 0, -225, ROLE.focus, {
          size: 32,
          fixedW: 790,
          alpha,
          glow: 10,
        }),
      );

      // Column headers
      const colX = { workers: -660, seen: -270, calls: 210, verdict: 690 };
      const headY = -110;
      nodes.push(
        txt('RUN CASE', colX.workers, headY, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('FINAL SET', colX.seen, headY, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('FETCH CALL LOG', colX.calls, headY, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('ASSERTION', colX.verdict, headY, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        line([-850, headY + 34], [850, headY + 34], { stroke: '#2c3a5e', width: 2 }).opacity(alpha),
      );

      // Row 1: Single worker
      const y1 = -5;
      const r1Seen = singleDone.value > 0.5;
      const r1Pass = singlePass.value > 0.5;
      nodes.push(
        glowPill('1 worker', colX.workers, y1, ROLE.workerA, {
          size: 27,
          fixedW: 280,
          alpha,
          glow: 6,
        }),
        glowPill(r1Seen ? '{"/guide"}' : '...', colX.seen, y1, r1Seen ? ROLE.ok : COSMOS.dim, {
          size: 27,
          fixedW: 290,
          alpha: r1Seen ? alpha : 0.55 * alpha,
          glow: r1Seen ? 7 : 0,
        }),
        glowPill(
          r1Seen ? '["/guide"]' : '...',
          colX.calls,
          y1,
          r1Seen ? ROLE.workerB : COSMOS.dim,
          {
            size: 27,
            fixedW: 480,
            alpha: r1Seen ? alpha : 0.55 * alpha,
            glow: r1Seen ? 7 : 0,
          },
        ),
        glowPill(
          r1Pass ? 'PASS (1 == 1)' : 'pending',
          colX.verdict,
          y1,
          r1Pass ? ROLE.ok : COSMOS.dim,
          {
            size: 26,
            fixedW: 270,
            alpha: r1Pass ? alpha : 0.55 * alpha,
            glow: r1Pass ? 11 : 0,
          },
        ),
      );

      // Row 2: Two workers paused after empty check
      const y2 = 120;
      const r2Seen = raceSeen.value > 0.5;
      const r2Dup = raceDouble.value > 0.5;
      const r2Fail = raceFail.value > 0.5;
      const iso = showIsolate.value > 0.5;

      nodes.push(
        line([-850, 58], [850, 58], { stroke: hexAlpha('#2c3a5e', 0.55 * alpha), width: 1.6 }),
        glowPill('2 workers (race)', colX.workers, y2, ROLE.workerB, {
          size: 27,
          fixedW: 310,
          alpha,
          glow: r2Seen ? 9 : 4,
        }),
        glowPill(r2Seen ? '{"/guide"}' : '...', colX.seen, y2, r2Seen ? ROLE.ok : COSMOS.dim, {
          size: 27,
          fixedW: 290,
          alpha: r2Seen ? alpha : 0.45 * alpha,
          glow: r2Seen ? 7 : 0,
        }),
        glowPill(
          r2Dup ? '["/guide", "/guide"]' : '...',
          colX.calls,
          y2,
          r2Dup ? ROLE.fail : COSMOS.dim,
          {
            size: 27,
            fixedW: 480,
            alpha: r2Dup ? alpha : 0.45 * alpha,
            glow: iso ? 15 : r2Dup ? 11 : 0,
          },
        ),
        glowPill(
          r2Fail ? 'FAIL (2 != 1)' : 'pending',
          colX.verdict,
          y2,
          r2Fail ? ROLE.fail : COSMOS.dim,
          {
            size: 26,
            fixedW: 270,
            alpha: r2Fail ? alpha : 0.45 * alpha,
            glow: r2Fail ? 12 : 0,
          },
        ),
      );

      if (r2Fail) {
        nodes.push(glowCross(colX.verdict + 160, y2, 26, ROLE.fail, alpha));
      }
      if (iso) {
        nodes.push(
          glowDot(colX.calls - 262, y2, {
            radius: 8,
            color: ROLE.focus,
            glow: 12,
            opacity: alpha,
          }),
        );
      }

      // Debugging compass / takeaway below rows
      const capY = 275;
      if (iso) {
        nodes.push(
          glowPill('Missing pages -> Admission', -430, capY, ROLE.workerA, {
            size: 26,
            fixedW: 470,
            alpha,
          }),
          glowPill('Wrong order -> Queue', 430, capY, ROLE.workerB, {
            size: 26,
            fixedW: 440,
            alpha,
          }),
          txt(
            'Keep this local regression running while you refactor.',
            0,
            352,
            28,
            ROLE.focus,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (r2Fail) {
        nodes.push(
          txt(
            'The final set still looks clean, but the call list catches the extra fetch.',
            0,
            capY + 45,
            28,
            ROLE.fail,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        nodes.push(
          txt(
            'A local stand-in appends each requested URL to a list with zero network calls.',
            0,
            capY + 45,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'LOCAL FETCH STUB  ·  NO NETWORK',
          r2Fail
            ? 'CALL LOG CATCHES DUPLICATE FETCH'
            : r1Pass
              ? 'SINGLE WORKER PASS'
              : 'HARNESS READY',
          { accent: r2Fail ? ROLE.fail : ROLE.ok, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.ok, ROLE.fail), title, layer);

  playCue(s, c, 'contract-single', (d) => s.play(singleDone.to(1, { duration: d })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'contract-pass', (d) => s.play(singlePass.to(1, { duration: d })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'contract-race', (d) => s.play(raceSeen.to(1, { duration: d })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'contract-double', (d) => s.play(raceDouble.to(1, { duration: d })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'contract-fail', (d) => s.play(raceFail.to(1, { duration: d })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'contract-isolate', (d) => s.play(showIsolate.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
}
