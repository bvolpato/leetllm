// Scene 10: token-index - Where the two token paths split
// Signature 3D orbiting Tokenizer Trie & Bitmask Lookup Lattice!
// Orbiting 3D token-index blocks + 2D shared 6-byte path (i->l->e->d->"->}) splitting at !,
// contrasting Outlines FSM index, XGrammar compiled local bitmask + per-request stacks,
// and LLGuidance (Earley parser + regex lexer + tokenizer trie + UTF-8 byte carry).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addArc3D,
  addBox3D,
  aura,
  beamWithPhotons,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  orbitScene,
  quadArcPts,
  tokenChip,
  txt,
} from '../parts.mjs';

const SHARED_BYTES = ['i', 'l', 'e', 'd', '"', '}'];

export default function tokenIndex(s, c) {
  const pulse = s.value(0);
  const b0Hi = s.value(0);
  const trieProg = s.value(0);
  const act = s.value(0); // 0 = Outlines index, 1 = XGrammar local vs stack, 2 = LLGuidance
  const localStack = s.value(0);
  const req2On = s.value(0);
  const llgOn = s.value(0);

  const header = cinemaHeader(
    'INDEXED TOKEN LOOKUP LATTICE',
    'Where the two token',
    'paths split',
    { accent: ROLE.trie, size: 48 },
  );

  const stageAura = aura(320, 120, 640, '#a78bfa22', '#5ce1e618');

  // Signature 3D orbiting bitmask & token-index lattice on the right/lower-right stage!
  const view3d = cinematic3d({
    theta: -0.74,
    phi: 1.06,
    distance: 15.8,
    unit: 96,
    focus: [0, 0, 0.3],
  }).at(430, 185);

  // Build 4x3 glowing 3D bitmask/trie blocks representing precomputed state -> token ID masks
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 4; col++) {
      const active = (r + col) % 2 === 0;
      const fill = active ? (r === 2 && col === 3 ? ROLE.prune : ROLE.fsm) : '#182444';
      const edge = active ? (r === 2 && col === 3 ? ROLE.prune : ROLE.trie) : '#384c7c';
      addBox3D(
        view3d,
        -2.2 + col * 1.15,
        -1.5 + r * 1.15,
        active ? 0.15 : -0.1,
        0.82,
        0.82,
        active ? 0.55 : 0.24,
        fill,
        edge,
        { faceOpacity: active ? 0.72 : 0.45, edgeGlow: active ? 8 : 3 },
      );
    }
  }
  addArc3D(view3d, [-1.8, -1.1, 0.7], [1.6, 1.2, 0.7], ROLE.legal, {
    lift: 1.25,
    pulseVal: pulse,
    phaseOffset: 0,
  });
  addArc3D(view3d, [-0.6, 0.0, 0.7], [1.6, 1.2, 0.7], ROLE.prefix, {
    lift: 1.0,
    pulseVal: pulse,
    phaseOffset: 0.5,
  });

  // Persistent top shared 6-byte trie chain (i -> l -> e -> d -> " -> } splitting into !)
  const trieRibbon = guardedDynamic(
    () => 1,
    () => {
      const tp = trieProg.value;
      const lit = Math.round(tp * SHARED_BYTES.length);
      const nodes = [];

      nodes.push(
        txt('SHARED 6-BYTE TOKENIZER TRIE PATH', -840, -232, 26, ROLE.fsm, 'mono', 'left'),
      );

      const x0 = -790;
      const step = 112;
      const y = -142;

      SHARED_BYTES.forEach((ch, idx) => {
        const active = idx < lit;
        const col = active ? ROLE.fsm : ROLE.schema;
        nodes.push(
          tokenChip(ch, x0 + idx * step, y, {
            w: 78,
            h: 72,
            color: col,
            size: 36,
            glow: active ? 9 : 3,
          }),
        );
        if (idx < SHARED_BYTES.length - 1) {
          nodes.push(
            line([x0 + idx * step + 42, y], [x0 + (idx + 1) * step - 42, y], {
              stroke: active ? ROLE.fsm : '#31446e',
              width: 3.2,
            }),
          );
        }
      });

      const braceX = x0 + 5 * step;
      // Branch A: terminates at brace -> iled"} (emerald)
      nodes.push(
        beamWithPhotons(quadArcPts([braceX + 42, y], [120, y - 34], -18), ROLE.legal, 0, {
          width: 3.2,
          photonCount: 1,
        }),
        txt('A: iled"}  (ACCEPT)', 140, y - 36, 30, ROLE.legal, 'mono', 'left').glow(7, ROLE.legal),
        // Branch B: extra edge -> ! -> iled"}! (rose)
        beamWithPhotons(quadArcPts([braceX + 42, y + 10], [120, y + 54], 18), ROLE.prune, 0, {
          width: 3.2,
          photonCount: 1,
        }),
        tokenChip('!', 160, y + 54, { w: 66, h: 58, color: ROLE.prune, size: 32, glow: 8 }),
        txt('B: iled"}!  (PRUNE)', 225, y + 54, 30, ROLE.prune, 'mono', 'left'),
      );

      return group(...nodes);
    },
  );

  // Lower-left engine architecture HUD switching cleanly across the 3 beats
  const engineHud = guardedDynamic(
    () => 1,
    () => {
      const a = act.value;
      const ls = localStack.value;
      const r2 = req2On.value;
      const lg = llgOn.value;
      const bh = b0Hi.value;
      const nodes = [];

      const op0 = fadeOutHalf(Math.min(1, a));
      const op1 = fadeInHalf(Math.min(1, a)) * fadeOutHalf(Math.max(0, a - 1));
      const op2 = fadeInHalf(Math.max(0, a - 1));

      if (op0 > 0.02) {
        nodes.push(
          txt('OUTLINES · FINITE-STATE INDEX', -840, 20, 30, ROLE.fsm, 'mono', 'left')
            .glow(bh > 0.3 ? 7 : 0, ROLE.fsm)
            .opacity(op0),
          txt(
            'state_id -> precomputed allowed token IDs',
            -840,
            82,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(op0),
          txt(
            'Compile once, reuse table across every draw',
            -840,
            145,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(op0),
          txt(
            'Shared trie walks common bytes once',
            -840,
            215,
            28,
            ROLE.legal,
            'sans',
            'left',
          ).opacity(op0),
        );
      }

      if (op1 > 0.02) {
        nodes.push(
          txt('XGRAMMAR · SPLIT VOCABULARY MASK', -840, 12, 30, ROLE.prefix, 'mono', 'left')
            .glow(7, ROLE.prefix)
            .opacity(op1),
          txt(
            '1. Context-independent -> precomputed bitmask',
            -840,
            74,
            28,
            ROLE.fsm,
            'sans',
            'left',
          ).opacity(op1),
          txt(
            '2. Parent-closing tokens -> consult live stack',
            -840,
            130,
            28,
            ROLE.prefix,
            'sans',
            'left',
          ).opacity(op1),
        );
        // Request 1 stack plates
        for (let i = 0; i < 3; i++) {
          nodes.push(
            rect(112, 42, {
              fill: '#1b1d36',
              stroke: ls > i / 3 ? ROLE.prefix : '#33456d',
              width: 2.2,
              radius: 7,
            })
              .at(-760 + i * 130, 215)
              .opacity(op1),
            txt(`R1.${i + 1}`, -760 + i * 130, 215, 26, ROLE.prefix, 'mono', 'center').opacity(op1),
          );
        }
        if (r2 > 0.05) {
          nodes.push(
            txt('REQUEST 2 GETS ITS OWN STACK:', -840, 290, 26, ROLE.legal, 'mono', 'left').opacity(
              op1 * r2,
            ),
          );
          for (let i = 0; i < 3; i++) {
            nodes.push(
              rect(112, 42, { fill: '#10262b', stroke: ROLE.legal, width: 2.2, radius: 7 })
                .at(-760 + i * 130, 345)
                .opacity(op1 * r2),
              txt(`R2.${i + 1}`, -760 + i * 130, 345, 26, ROLE.legal, 'mono', 'center').opacity(
                op1 * r2,
              ),
            );
          }
        }
      }

      if (op2 > 0.02) {
        nodes.push(
          txt('LLGUIDANCE · INCREMENTAL ENGINE', -840, 20, 30, ROLE.trie, 'mono', 'left')
            .glow(lg > 0.3 ? 8 : 0, ROLE.trie)
            .opacity(op2),
          txt(
            'Earley CFG parser  +  Regex lexer  +  Trie',
            -840,
            86,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(op2),
          txt('UTF-8 MULTI-BYTE CONTINUATION:', -840, 168, 26, ROLE.prefix, 'mono', 'left').opacity(
            op2,
          ),
          txt(
            'Tokens can split one Unicode char across',
            -840,
            224,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(op2),
          txt(
            'boundaries; parser carries partial bytes',
            -840,
            272,
            28,
            ROLE.fsm,
            'sans',
            'left',
          ).opacity(op2),
        );
      }

      nodes.push(txt('3D PRECOMPUTED BITMASK LATTICE', 430, 392, 26, ROLE.trie, 'mono', 'center'));

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view3d, trieRibbon, engineHud);
  orbitScene(s, c, view3d, { theta: -0.15, phi: 0.96 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('sg-token-index-0', () => {
    s.play(b0Hi.to(1, { duration: clampDur(c, c.cue('sg-token-index-0').start, 0.35) }));
  });
  c.on('sg-trie-shared', () => {
    s.play(trieProg.to(1, { duration: clampDur(c, c.cue('sg-trie-shared').start, 0.95) }));
  });
  c.on('sg-token-index-1', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('sg-token-index-1').start, 0.4) }));
  });
  c.on('sg-index-local', () => {
    s.play(localStack.to(1, { duration: clampDur(c, c.cue('sg-index-local').start, 0.65) }));
  });
  c.on('sg-index-new-request', () => {
    s.play(req2On.to(1, { duration: clampDur(c, c.cue('sg-index-new-request').start, 0.45) }));
  });
  c.on('sg-token-index-2', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('sg-token-index-2').start, 0.4) }));
    s.play(llgOn.to(1, { duration: clampDur(c, c.cue('sg-token-index-2').start, 0.4) }));
  });
}
