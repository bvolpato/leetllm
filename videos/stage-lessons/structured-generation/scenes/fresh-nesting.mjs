// Scene 29: fresh-nesting - Which token fits the four open objects?
// 4-frame pushdown stack ({"child":{"child":{"child":{, depth 4) with live trial stack!
// STRICT prediction withholding during Beat 0 hold (3.3s): Candidate A (}}}}) and Candidate B
// (}}}!) sit beside the 4 pending stack plates with verdicts & EOS answers hidden until
// c.after('sg-fresh-a'), c.after('sg-fresh-eos'), c.after('sg-fresh-b'), c.after('sg-fresh-old-eos')!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fsmNode,
  guardedDynamic,
  quadArcPts,
  recursiveConstructionState,
  tokenChip,
  txt,
} from '../parts.mjs';

export default function freshNesting(s, c) {
  const b0Hi = s.value(0);
  const b1Hi = s.value(0);
  const aProg = s.value(0);
  const eosNow = s.value(0);
  const bProg = s.value(0);
  const oldEos = s.value(0);
  const deadEndNote = s.value(0);

  const header = cinemaHeader(
    'FRESH STACK TRIAL (DEPTH 4)',
    'Which token fits the',
    'four open objects?',
    { accent: ROLE.pda, size: 48 },
  );

  const stageAura = aura(200, 40, 650, '#a78bfa22', '#ffd16618');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const b0 = b0Hi.value;
      const b1 = b1Hi.value;
      const ap = aProg.value;
      const en = eosNow.value;
      const bp = bProg.value;
      const oe = oldEos.value;
      const dn = deadEndNote.value;
      const nodes = [];

      const z = recursiveConstructionState(true, ap, bp);

      nodes.push(
        txt(
          `PREFIX: ${z.committedPrefix}`,
          -840,
          -225,
          32,
          z.accepted ? ROLE.legal : ROLE.prefix,
          'mono',
          'left',
        ).glow(z.accepted ? 8 : b0 > 0.3 ? 5 : 0, z.accepted ? ROLE.legal : ROLE.prefix),
      );

      // Left column: Committed 4-frame pushdown stack
      const eosLabel = z.accepted
        ? en > 0.45
          ? 'EOS: ALLOWED'
          : 'EOS: ?'
        : oe > 0.45
          ? 'EOS: BLOCKED'
          : 'EOS: ?';
      const eosCol = z.accepted
        ? en > 0.45
          ? ROLE.legal
          : ROLE.prefix
        : oe > 0.45
          ? ROLE.prune
          : ROLE.prefix;

      nodes.push(
        txt(
          `COMMITTED STACK (${z.committed.frames.length} OPEN)`,
          -580,
          -148,
          26,
          ROLE.prefix,
          'mono',
          'center',
        ),
        txt(eosLabel, -580, -104, 28, eosCol, 'mono', 'center').glow(
          en > 0.45 || oe > 0.45 ? 8 : 0,
          eosCol,
        ),
      );

      if (z.committed.frames.length === 0) {
        nodes.push(
          fsmNode(-580, 75, 84, 'EMPTY', { color: ROLE.legal, accepting: true, size: 30 }),
          txt('Root closed cleanly', -580, 195, 26, ROLE.legal, 'mono', 'center'),
        );
      } else {
        z.committed.frames.forEach((frame, idx) => {
          const fy = 195 - idx * 78;
          nodes.push(
            rect(440, 58, { fill: '#191a33', stroke: ROLE.pda, width: 2.5, radius: 10 })
              .at(-580, fy)
              .glow(7, ROLE.pda),
            txt(
              `frame ${idx + 1}: open@${frame.offset} -> }`,
              -580,
              fy,
              26,
              ROLE.prefix,
              'mono',
              'center',
            ),
          );
        });
      }

      // Right column: Candidate A (}}}}) and Candidate B (}}}!)
      const rows = [
        {
          tag: 'A',
          tok: z.a,
          prog: ap,
          trial: z.aTrial,
          accepted: z.accepted,
          rejected: false,
          isB: false,
          y: -42,
        },
        {
          tag: 'B',
          tok: z.bad,
          prog: bp,
          trial: z.bTrial,
          accepted: false,
          rejected: z.rejected,
          isB: true,
          y: 158,
        },
      ];

      rows.forEach(({ tag, tok, prog, trial, accepted, rejected, isB, y }) => {
        const checked = Math.floor(prog * tok.length);
        const col = accepted ? ROLE.legal : rejected ? ROLE.prune : ROLE.fsm;

        nodes.push(txt(tag, -210, y, 42, col, 'mono', 'center'));

        [...tok].forEach((ch, idx) => {
          const isBad = isB && idx === tok.length - 1 && checked > idx;
          const isGood = idx < checked && !isBad;
          const cCol = isBad ? ROLE.prune : isGood ? ROLE.fsm : COSMOS.muted;
          nodes.push(
            tokenChip(ch, -100 + idx * 96, y, {
              w: 78,
              h: 72,
              color: cCol,
              size: 36,
              glow: isGood || isBad ? 9 : 2,
            }),
          );
        });

        const status = accepted
          ? '0 LEFT -> ACCEPT'
          : rejected
            ? '1 LEFT + ! -> REJECT'
            : prog > 0.05
              ? `${trial.frames.length} left`
              : '?';
        nodes.push(
          beamWithPhotons(quadArcPts([250, y], [365, y], 0), col, 0, {
            alpha: prog > 0.05 ? 0.92 : 0.35,
            width: 3,
            photonCount: prog > 0.1 ? 1 : 0,
          }),
          txt(status, 385, y, 30, prog > 0.05 ? col : ROLE.prefix, 'mono', 'left').glow(
            accepted || rejected ? 9 : 0,
            col,
          ),
        );
      });

      if (oe > 0.45) {
        nodes.push(
          txt(
            'BEFORE EITHER TOKEN: 4 OPEN -> EOS BLOCKED',
            -210,
            250,
            26,
            ROLE.prefix,
            'mono',
            'left',
          ).opacity(oe),
        );
      }

      // Bottom guidance / prediction prompt
      nodes.push(line([-840, 295], [840, 295], { stroke: '#25355a', width: 2 }));

      if (b1 < 0.05 && ap < 0.05) {
        nodes.push(
          txt(
            'Which whole token can be accepted? Before either is sampled, may the decoder end?',
            -840,
            365,
            30,
            ROLE.prefix,
            'serif',
            'left',
          ).glow(6, ROLE.prefix),
        );
      } else if (dn > 0.35) {
        nodes.push(
          txt(
            'BUDGET END -> INCOMPLETE  ·  EMPTY LEGAL SET -> DEAD END  (NEVER DROP MASK)',
            -840,
            365,
            28,
            ROLE.prune,
            'mono',
            'left',
          )
            .glow(8, ROLE.prune)
            .opacity(dn),
        );
      } else {
        nodes.push(
          txt(
            'A pops all 4 frames to allow EOS; B replays from the original 4-frame stack and fails at !',
            -840,
            365,
            28,
            COSMOS.muted,
            'serif',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);

  c.on('sg-fresh-nesting-0', () => {
    s.play(b0Hi.to(1, { duration: clampDur(c, c.cue('sg-fresh-nesting-0').start, 0.35) }));
  });
  c.on('sg-fresh-nesting-1', () => {
    s.play(b1Hi.to(1, { duration: clampDur(c, c.cue('sg-fresh-nesting-1').start, 0.3) }));
  });
  // Strict prediction withholding: reveal A accept, EOS allow, B reject, original EOS blocked AFTER spoken clauses!
  c.after('sg-fresh-a', () => {
    s.play(aProg.to(1, { duration: clampDur(c, c.cue('sg-fresh-a').end, 0.7) }));
  });
  c.after('sg-fresh-eos', () => {
    s.play(eosNow.to(1, { duration: clampDur(c, c.cue('sg-fresh-eos').end, 0.35) }));
  });
  c.after('sg-fresh-b', () => {
    s.play(bProg.to(1, { duration: clampDur(c, c.cue('sg-fresh-b').end, 0.7) }));
  });
  c.after('sg-fresh-old-eos', () => {
    s.play(oldEos.to(1, { duration: clampDur(c, c.cue('sg-fresh-old-eos').end, 0.35) }));
  });
  c.on('sg-fresh-nesting-2', () => {
    s.play(deadEndNote.to(1, { duration: clampDur(c, c.cue('sg-fresh-nesting-2').start, 0.4) }));
  });
}
