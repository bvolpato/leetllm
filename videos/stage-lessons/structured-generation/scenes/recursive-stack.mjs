// Scene 9: recursive-stack - Follow each unresolved object
// Act 0 (Beat 0): Contrasts a circular 2-node DFA loop for flat lists [{},{},{}] against a
// rising glowing pushdown stack of open return frames for nested {"child":{"child":{...
// Act 1 (Beats 1-2): 3-frame accepted stack tested against trial A (}}} -> pops 3 -> empty,
// accepted!) and trial B (}}] -> starts from original 3 frames, pops 2, fails at ] leaving
// original prefix intact!).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  fsmNode,
  guardedDynamic,
  quadArcPts,
  recursiveConstructionState,
  recursivePrefix,
  tokenChip,
  txt,
} from '../parts.mjs';

export default function recursiveStack(s, c) {
  const pulse = s.value(0);
  const beat0Prog = s.value(0);
  const act = s.value(0); // 0 = DFA loop vs stack, 1 = 3-frame trial A & B
  const aProg = s.value(0);
  const bAct = s.value(0);
  const bProg = s.value(0);

  const header = cinemaHeader('REGULAR DFA VS PUSHDOWN STACK', 'Follow each', 'unresolved object', {
    accent: ROLE.pda,
    size: 50,
  });

  const stageAura = aura(200, 40, 650, '#a78bfa22', '#ffd16618');

  // Act 0: Flat list DFA cycle vs Nested pushdown stack
  const act0 = guardedDynamic(
    () => fadeOutHalf(act.value),
    (a) => {
      const p = pulse.value;
      const b0 = beat0Prog.value;
      const nodes = [];

      const flatN = 1 + Math.min(4, Math.floor(b0 * 6));
      const nestN = 1 + Math.min(3, Math.floor(Math.max(0, b0 - 0.35) * 5.5));
      const flatStr = '[' + Array.from({ length: flatN }, () => '{}').join(',') + ']';
      const nestStr = '{"child":'.repeat(nestN - 1) + '{';
      const nestFrames = recursivePrefix(nestStr).frames;

      // Left side: Flat list fixed-state DFA loop
      nodes.push(
        txt('FLAT LIST  ·  FIXED DFA LOOP', -840, -210, 26, ROLE.fsm, 'mono', 'left').opacity(a),
        txt(flatStr, -840, -152, 34, COSMOS.ink, 'mono', 'left').opacity(a),
      );

      const n1 = [-630, 55];
      const n2 = [-260, 55];
      const topArc = quadArcPts([n1[0] + 74, n1[1] - 28], [n2[0] - 74, n2[1] - 28], -68);
      const botArc = quadArcPts([n2[0] - 74, n2[1] + 28], [n1[0] + 74, n1[1] + 28], 68);
      nodes.push(
        beamWithPhotons(topArc, ROLE.fsm, p * 1.1, { alpha: a, width: 3.4 }),
        beamWithPhotons(botArc, ROLE.schema, p * 1.1 + 0.5, { alpha: a, width: 3.4 }),
        fsmNode(n1[0], n1[1], 68, 'item {}', { color: ROLE.fsm, size: 26, opacity: a }),
        fsmNode(n2[0], n2[1], 68, ', / ]', {
          color: ROLE.schema,
          accepting: true,
          size: 26,
          opacity: a,
        }),
        txt('ANY LENGTH  ·  CONSTANT STATES', -445, 220, 26, ROLE.fsm, 'mono', 'center').opacity(a),
      );

      // Center vertical divider
      nodes.push(
        line([0, -210], [0, 310], { stroke: '#25355a', width: 2, dash: [8, 8] }).opacity(a),
      );

      // Right side: Nested child -> growing pushdown stack of return frames
      nodes.push(
        txt('NESTED CHILD  ·  PUSHDOWN STACK', 80, -210, 26, ROLE.prefix, 'mono', 'left').opacity(
          a,
        ),
        txt(nestStr, 80, -152, 28, ROLE.prefix, 'mono', 'left').opacity(a),
      );

      nestFrames.forEach((frame, idx) => {
        const fy = 215 - idx * 82;
        const fx = 460;
        const plate = rect(560, 62, {
          fill: '#1b1a33',
          stroke: ROLE.pda,
          width: 2.6,
          radius: 10,
        })
          .at(fx, fy)
          .glow(7, ROLE.pda)
          .opacity(a);
        nodes.push(
          plate,
          txt(
            `frame ${idx + 1}: open@${frame.offset} -> expects }`,
            fx,
            fy,
            26,
            ROLE.prefix,
            'mono',
            'center',
          ).opacity(a),
        );
      });

      nodes.push(
        txt(
          'UNBOUNDED DEPTH REQUIRES A RETURN STACK',
          460,
          300,
          26,
          ROLE.pda,
          'mono',
          'center',
        ).opacity(a),
        txt(
          'Each opening brace pushes another unfinished object onto the parser stack',
          -840,
          380,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: 3-frame accepted stack + Trial A (}}}) and Trial B (}}])
  const act1 = guardedDynamic(
    () => fadeInHalf(act.value),
    (a) => {
      const p = pulse.value;
      const ap = aProg.value;
      const ba = bAct.value;
      const bp = bProg.value;
      const nodes = [];

      const z = recursiveConstructionState(false, ap, bp);

      nodes.push(
        txt('TINY RECURSIVE GRAMMAR  ·  DEPTH 3', -840, -230, 26, ROLE.pda, 'mono', 'left').opacity(
          a,
        ),
        txt(
          `PREFIX: ${z.committedPrefix}`,
          -840,
          -166,
          36,
          z.accepted ? ROLE.legal : ROLE.prefix,
          'mono',
          'left',
        )
          .glow(7, z.accepted ? ROLE.legal : ROLE.prefix)
          .opacity(a),
      );

      // Left column: Committed parser stack
      nodes.push(
        txt('COMMITTED STACK', -580, -78, 26, ROLE.prefix, 'mono', 'center').opacity(a),
        txt(
          `PENDING: ${z.committed.frames.length}  ·  EOS: ${z.accepted ? 'ALLOWED' : 'BLOCKED'}`,
          -580,
          -32,
          26,
          z.accepted ? ROLE.legal : ROLE.prefix,
          'mono',
          'center',
        ).opacity(a),
      );

      if (z.committed.frames.length === 0) {
        nodes.push(
          fsmNode(-580, 125, 76, 'EMPTY', {
            color: ROLE.legal,
            accepting: true,
            size: 28,
            opacity: a,
          }),
        );
      } else {
        z.committed.frames.forEach((frame, idx) => {
          const fy = 220 - idx * 80;
          nodes.push(
            rect(440, 62, { fill: '#191a30', stroke: ROLE.prefix, width: 2.5, radius: 10 })
              .at(-580, fy)
              .glow(7, ROLE.prefix)
              .opacity(a),
            txt(`open@${frame.offset} -> }`, -580, fy, 26, ROLE.prefix, 'mono', 'center').opacity(
              a,
            ),
          );
        });
      }

      // Right column: Candidate A (}}}) & Candidate B (}}]) with isolated trial stacks
      const trials = [
        { tag: 'A', tok: z.a, prog: ap, trial: z.aTrial, accepted: z.accepted, isB: false, y: -25 },
        {
          tag: 'B',
          tok: z.bad,
          prog: bp,
          trial: z.bTrial,
          accepted: false,
          rejected: z.rejected,
          isB: true,
          y: 195,
        },
      ];

      trials.forEach(({ tag, tok, prog, trial, accepted, rejected, isB, y }) => {
        const rowAlpha = isB ? a * (0.35 + 0.65 * ba) : a;
        const checked = Math.floor(prog * tok.length);
        const rowCol = accepted ? ROLE.legal : rejected ? ROLE.prune : ROLE.fsm;

        nodes.push(txt(`TRIAL ${tag}`, -180, y, 32, rowCol, 'mono', 'center').opacity(rowAlpha));

        [...tok].forEach((ch, idx) => {
          const isErr = isB && idx === tok.length - 1 && checked > idx;
          const isOk = idx < checked && !isErr;
          const cCol = isErr ? ROLE.prune : isOk ? ROLE.fsm : COSMOS.muted;
          nodes.push(
            tokenChip(ch, -45 + idx * 96, y, {
              w: 78,
              h: 72,
              color: cCol,
              size: 36,
              glow: isOk || isErr ? 8 : 2,
              opacity: rowAlpha,
            }),
          );
        });

        // Trial stack meter readout on far right
        const rem = trial.frames.length;
        const statusStr = accepted
          ? 'EMPTY -> ACCEPT'
          : rejected
            ? 'FAIL AT ] -> REJECT'
            : `${rem} frames left`;
        nodes.push(
          beamWithPhotons(quadArcPts([215, y], [355, y], 0), rowCol, p * 1.1, {
            alpha: rowAlpha * (prog > 0.05 ? 0.9 : 0.35),
            width: 3,
            photonCount: prog > 0.1 ? 1 : 0,
          }),
          txt(statusStr, 375, y, 28, rowCol, 'mono', 'left')
            .glow(accepted || rejected ? 8 : 0, rowCol)
            .opacity(rowAlpha),
        );
      });

      nodes.push(
        txt(
          bp > 0.7
            ? 'Trial pops belong to B alone · Rejecting B leaves the original 3-frame prefix intact'
            : 'Candidate A pops all 3 frames to close the root; B starts fresh from the original 3 frames',
          -840,
          368,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1);
  driftValue(s, c, pulse, 5.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('sg-recursive-stack-0', () => {
    s.play(beat0Prog.to(1, { duration: clampDur(c, c.cue('sg-recursive-stack-0').start, 3.2) }));
  });
  c.on('sg-recursive-stack-1', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('sg-recursive-stack-1').start, 0.45) }));
  });
  c.on('sg-stack-three', () => {
    s.play(aProg.to(1, { duration: clampDur(c, c.cue('sg-stack-three').start, 1.1) }));
  });
  c.on('sg-recursive-stack-2', () => {
    s.play(bAct.to(1, { duration: clampDur(c, c.cue('sg-recursive-stack-2').start, 0.35) }));
  });
  c.on('sg-stack-reject', () => {
    s.play(bProg.to(1, { duration: clampDur(c, c.cue('sg-stack-reject').start, 1.1) }));
  });
}
