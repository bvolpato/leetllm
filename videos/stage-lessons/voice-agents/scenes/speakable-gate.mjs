// Scene 11: speakable-gate - What can the hotline say by the deadline?
// 400 ms commit-to-audio budget split at 200 ms decision deadline, showing 3 tool outcomes
// (pending -> closed -> failed) and separation of Executor vs Speech Formatter.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function speakableGate(s, c) {
  const phase = s.value(0);
  const splitOn = s.value(0);
  const stateMode = s.value(0); // 0=pending, 1=closed, 2=failed
  const authOn = s.value(0);

  const header = cinemaHeader('SPEAKABLE DECISION GATE', 'What can the hotline', 'say by 200 ms?', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const sp = splitOn.value;
      const sm = stateMode.value;
      const au = authOn.value;
      const nodes = [];

      // Top 400 ms budget bar split cleanly at 200 ms
      const x0 = -740;
      const xMid = 0;
      const x1 = 740;
      const bY = -145;

      nodes.push(
        txt(
          '400 ms TURN-ACCEPT TO FIRST-SOUND BUDGET',
          0,
          bY - 64,
          26,
          ROLE.audio,
          'mono',
          'center',
        ),
        rect(xMid - x0 - 6, 48, { fill: ROLE.focus, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((x0 + xMid) * 0.5 - 3, bY)
          .glow(8, ROLE.focus)
          .opacity(0.9),
        txt('DECIDE WORDS: 200 ms', (x0 + xMid) * 0.5, bY, 26, '#070910', 'mono', 'center'),
        rect(x1 - xMid - 6, 48, { fill: ROLE.audio, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((xMid + x1) * 0.5 + 3, bY)
          .opacity(0.5 + sp * 0.4),
        txt('TTS + NET + PLAY: 200 ms', (xMid + x1) * 0.5, bY, 26, '#070910', 'mono', 'center'),
      );

      // 3 Tool-State Outcomes evaluated at the 200 ms deadline
      const rows = [
        {
          state: 'PENDING',
          say: '"I’m checking the request."',
          col: ROLE.audio,
          active: sm < 0.5,
          y: 5,
        },
        {
          state: 'CLOSED',
          say: '"Incident 4219 is closed."',
          col: ROLE.ok,
          active: sm >= 0.5 && sm < 1.5,
          y: 95,
        },
        {
          state: 'FAILED',
          say: '"Change is unconfirmed."',
          col: ROLE.fail,
          active: sm >= 1.5,
          y: 185,
        },
      ];

      rows.forEach((r) => {
        const alpha = r.active ? 1 : 0.42;
        nodes.push(
          line([-760, r.y], [-640, r.y], { stroke: r.col, width: r.active ? 5 : 2.5 })
            .glow(r.active ? 8 : 0, r.col)
            .opacity(alpha),
          txt(r.state, -600, r.y, 28, r.col, 'mono', 'left').opacity(alpha),
          txt('->', -360, r.y, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
          txt(r.say, -280, r.y, 28, r.active ? COSMOS.ink : COSMOS.muted, 'mono', 'left').opacity(
            alpha,
          ),
        );
      });

      // Top-right authority rule
      nodes.push(
        txt('EXECUTOR VS FORMATTER', 480, -425, 26, ROLE.policy, 'mono', 'center'),
        txt('Executor runs authorized action', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
        txt('Formatter speaks ONLY verified result', 480, -334, 26, ROLE.ok, 'mono', 'center'),
      );

      // Bottom authority & spoken-clarity rule
      nodes.push(
        line([-840, 265], [840, 265], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          au > 0.4
            ? 'Paging, closing, or texting links require capability + permission + confirmation'
            : 'Read verified tool state into speech; never invent an unconfirmed outcome',
          0,
          330,
          26,
          au > 0.4 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          'Test spoken digits ("four two one nine") and severity over real phone audio',
          0,
          380,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.ok,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.2);

  c.on('va-speakable-gate-0-1', () => {
    s.play(splitOn.to(1, { duration: clampDur(c, c.cue('va-speakable-gate-0-1').start, 0.35) }));
  });
  c.on('va-speakable-gate-1-1', () => {
    s.play(stateMode.to(1, { duration: clampDur(c, c.cue('va-speakable-gate-1-1').start, 0.35) }));
  });
  c.on('va-speakable-gate-1-2', () => {
    s.play(stateMode.to(2, { duration: clampDur(c, c.cue('va-speakable-gate-1-2').start, 0.35) }));
  });
  c.on('va-speakable-gate-1-3', () => {
    s.play(authOn.to(1, { duration: clampDur(c, c.cue('va-speakable-gate-1-3').start, 0.35) }));
  });
}
