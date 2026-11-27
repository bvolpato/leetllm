// Scene 3: prefix-language - Two ways to finish the same prefix
// Glowing FSM prefix-language lattice showing the accepted buffer streaming character by
// character across both allowed strings {"status":"passed"} and {"status":"failed"},
// then branching at "fa" where "passed" dims out and "failed" illuminates as the sole survivor.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  FAIL_PREFIX,
  LANGUAGE,
  ROLE,
  VALUE_PREFIX,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fsmNode,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function prefixLanguage(s, c) {
  const keyProg = s.value(0);
  const faProg = s.value(0);

  const header = cinemaHeader('PREFIX-CLOSED GRAMMAR', 'Two ways to finish', 'the same prefix', {
    accent: ROLE.fsm,
    size: 50,
  });

  const stageAura = aura(180, 60, 650, '#ffd1661b', '#5ce1e61a');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const kp = keyProg.value;
      const fp = faProg.value;
      const nodes = [];

      const sharedChars = Math.round(kp * VALUE_PREFIX.length);
      const branchChars = Math.round(fp * 2);
      const prefix =
        fp > 0.05
          ? FAIL_PREFIX.slice(0, VALUE_PREFIX.length + branchChars)
          : VALUE_PREFIX.slice(0, sharedChars);

      // Top accepted prefix buffer rail
      nodes.push(
        txt('ACCEPTED PREFIX BUFFER', -840, -210, 26, ROLE.prefix, 'mono', 'left'),
        txt(
          prefix.length ? prefix : '"" (empty)',
          -840,
          -145,
          48,
          ROLE.prefix,
          'mono',
          'left',
        ).glow(8, ROLE.prefix),
        line([-840, -98], [260, -98], { stroke: '#273860', width: 2.5 }),
      );

      // Right-top FSM branching micro-diagram (S0 -> S_key -> passed / failed)
      const s0 = [410, -215];
      const sKey = [590, -215];
      const sPass = [780, -285];
      const sFail = [780, -145];
      const passAlive = LANGUAGE[0].startsWith(prefix);
      const failAlive = LANGUAGE[1].startsWith(prefix);

      nodes.push(
        beamWithPhotons(
          quadArcPts([s0[0] + 34, s0[1]], [sKey[0] - 34, sKey[1]], 0),
          ROLE.prefix,
          0,
          {
            alpha: 0.4 + 0.6 * kp,
            width: 3,
            photonCount: kp > 0.2 ? 1 : 0,
          },
        ),
        beamWithPhotons(
          quadArcPts([sKey[0] + 34, sKey[1]], [sPass[0] - 34, sPass[1]], -12),
          passAlive ? ROLE.fsm : '#2b344d',
          0,
          {
            alpha: passAlive ? 0.9 : 0.25,
            width: 2.8,
            photonCount: passAlive ? 1 : 0,
          },
        ),
        beamWithPhotons(
          quadArcPts([sKey[0] + 34, sKey[1]], [sFail[0] - 34, sFail[1]], 12),
          failAlive ? ROLE.legal : '#2b344d',
          0,
          {
            alpha: failAlive ? 0.95 : 0.25,
            width: 3.2,
            photonCount: failAlive ? 1 : 0,
          },
        ),
        fsmNode(s0[0], s0[1], 32, 'S0', { color: ROLE.prefix, size: 26 }),
        fsmNode(sKey[0], sKey[1], 34, 'S1', {
          color: kp > 0.8 ? ROLE.prefix : COSMOS.dim,
          size: 26,
        }),
        fsmNode(sPass[0], sPass[1], 34, 'P', {
          color: passAlive ? ROLE.fsm : COSMOS.dim,
          accepting: true,
          size: 26,
        }),
        fsmNode(sFail[0], sFail[1], 34, 'F', {
          color: failAlive ? ROLE.legal : COSMOS.dim,
          accepting: true,
          size: 26,
        }),
      );

      // Aligned character tracks for the two complete allowed strings
      nodes.push(
        txt(
          'COMPLETE STRINGS ALLOWED BY THIS TINY GRAMMAR',
          -840,
          -30,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
      );

      const cell = 56;
      const x0 = -815;
      LANGUAGE.forEach((record, row) => {
        const y = 78 + row * 175;
        const possible = record.startsWith(prefix);
        const chars = [...record];

        chars.forEach((ch, col) => {
          const matched = possible && col < prefix.length;
          const color = !possible ? '#3b4766' : matched ? ROLE.prefix : COSMOS.ink;
          const node = txt(ch, x0 + col * cell, y, 44, color, 'mono', 'center');
          if (matched) node.glow(7, ROLE.prefix);
          nodes.push(node);
        });

        // Glowing prefix underline beam (generous clearance below 44px glyphs)
        if (prefix.length > 0 && possible) {
          const ux1 = x0 - 20;
          const ux2 = x0 + (prefix.length - 1) * cell + 20;
          nodes.push(
            line([ux1, y + 48], [ux2, y + 48], { stroke: ROLE.prefix, width: 5.5 }).glow(
              10,
              ROLE.prefix,
            ),
          );
        }

        // Ruled-out dashed crimson rail cleanly below text (zero glyph crossing!)
        if (!possible) {
          nodes.push(
            line([x0 - 20, y + 48], [x0 + (chars.length - 1) * cell + 20, y + 48], {
              stroke: ROLE.prune,
              width: 3.5,
              dash: [10, 8],
            }).opacity(0.85),
          );
        }

        // Right-side status verdict
        nodes.push(
          txt(
            possible ? 'POSSIBLE' : 'RULED OUT',
            560,
            y,
            32,
            possible ? (fp > 0.5 ? ROLE.legal : ROLE.fsm) : ROLE.prune,
            'mono',
            'left',
          ).glow(possible ? 7 : 0, fp > 0.5 ? ROLE.legal : ROLE.fsm),
        );
      });

      // Bottom rule summary
      nodes.push(
        txt(
          fp > 0.5
            ? 'Trial test: keep candidate token iff some allowed record starts with (prefix + token)'
            : 'Both complete strings share the 11-character key prefix {"status":"',
          -840,
          365,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);

  c.on('prefix-key', () => {
    s.play(keyProg.to(1, { duration: clampDur(c, c.cue('prefix-key').start, 1.35) }));
  });
  c.on('prefix-fa', () => {
    s.play(faProg.to(1, { duration: clampDur(c, c.cue('prefix-fa').start, 0.85) }));
  });
}
