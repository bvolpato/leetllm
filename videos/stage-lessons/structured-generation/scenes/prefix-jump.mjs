// Scene 11: prefix-jump - Separate a shared prefix from a forced continuation
// Act 0 (Beat 0): Two requests sharing KV pages & compiled grammar; changing Request B's
// first prompt token breaks KV prefix reuse while compiled grammar reuse stays intact!
// Act 1 (Beats 1-2): Compares 3 serial forced sampling steps ({" / status / ":") against one
// compressed jump-forward append, then illuminates the tokenizer join-seam retokenization gate.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  fsmNode,
  glowDot,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  tokenChip,
  txt,
} from '../parts.mjs';

export default function prefixJump(s, c) {
  const b0Hi = s.value(0);
  const promptFlipped = s.value(0);
  const act = s.value(0); // 0 = KV vs grammar cache, 1 = forced jump-forward + join retokenize
  const stepsProg = s.value(0);
  const appendProg = s.value(0);
  const b2Hi = s.value(0);
  const joinGate = s.value(0);

  const header = cinemaHeader(
    'PREFIX CACHE VS JUMP-FORWARD',
    'Separate a shared prefix',
    'from a forced literal',
    { accent: ROLE.fsm, size: 48 },
  );

  const stageAura = aura(220, 40, 640, '#6ee7b71c', '#ffd16618');

  // Act 0: KV Prefix Reuse vs Compiled Grammar Reuse
  const act0 = guardedDynamic(
    () => fadeOutHalf(act.value),
    (a) => {
      const ch = promptFlipped.value;
      const bh = b0Hi.value;
      const nodes = [];

      const yA = -125;
      const yB = 110;

      nodes.push(
        opticalRail(-840, yA - 52, yA + 52, ROLE.schema, { opacity: a }),
        txt('REQUEST A PROMPT TOKENS', -805, yA - 36, 26, ROLE.schema, 'mono', 'left').opacity(a),
        txt('[system, schema, task-A]', -805, yA + 18, 34, COSMOS.ink, 'mono', 'left').opacity(a),

        opticalRail(-840, yB - 52, yB + 52, ch > 0.5 ? ROLE.prune : ROLE.fsm, { opacity: a }),
        txt(
          'REQUEST B PROMPT TOKENS',
          -805,
          yB - 36,
          26,
          ch > 0.5 ? ROLE.prune : ROLE.fsm,
          'mono',
          'left',
        ).opacity(a),
        txt(
          ch > 0.5 ? '[changed-sys, schema, task-B]' : '[system, schema, task-B]',
          -805,
          yB + 18,
          34,
          ch > 0.5 ? ROLE.prune : COSMOS.ink,
          'mono',
          'left',
        )
          .glow(ch > 0.5 ? 6 : 0, ROLE.prune)
          .opacity(a),
      );

      // Right-hand shared targets: KV Prefix Cache (top) & Compiled Grammar (bottom)
      const kvPos = [560, yA];
      const grPos = [560, yB];
      nodes.push(
        fsmNode(kvPos[0], kvPos[1], 76, 'KV CACHE', {
          color: ch > 0.5 ? ROLE.review : ROLE.legal,
          size: 26,
          opacity: a,
        }),
        txt(
          'Model prefill pages',
          kvPos[0],
          kvPos[1] + 105,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
        fsmNode(grPos[0], grPos[1], 76, 'GRAMMAR', {
          color: ROLE.prefix,
          accepting: true,
          size: 26,
          opacity: a,
        }),
        txt(
          'Compiled DFA / CFG',
          grPos[0],
          grPos[1] + 105,
          26,
          ROLE.prefix,
          'mono',
          'center',
        ).opacity(a),
      );

      // Optical beams: A -> KV & Grammar, B -> KV (breaks when promptFlipped!) & B -> Grammar (always alive!)
      nodes.push(
        beamWithPhotons(quadArcPts([-180, yA + 10], [472, yA], -18), ROLE.legal, 0, {
          alpha: a * (0.5 + 0.5 * bh),
          width: 3.4,
        }),
        beamWithPhotons(quadArcPts([-180, yA + 25], [472, yB - 20], 10), ROLE.prefix, 0, {
          alpha: a * 0.75,
          width: 2.8,
        }),
        beamWithPhotons(quadArcPts([-180, yB + 12], [472, yB + 12], 18), ROLE.prefix, 0, {
          alpha: a,
          width: 3.6,
        }),
      );

      if (ch < 0.5) {
        nodes.push(
          beamWithPhotons(quadArcPts([-180, yB - 10], [472, yA + 22], -12), ROLE.legal, 0, {
            alpha: a * (1 - ch),
            width: 3.2,
          }),
        );
      } else {
        nodes.push(
          line([-150, yB - 10], [40, 38], { stroke: ROLE.prune, width: 3.2, dash: [8, 8] }).opacity(
            a * ch,
          ),
          txt('KV PREFIX MISS', 165, 225, 30, ROLE.prune, 'mono', 'center')
            .glow(8, ROLE.prune)
            .opacity(a * ch),
        );
      }

      nodes.push(
        txt(
          ch > 0.5
            ? 'Changing token 0 invalidates KV prefix reuse, yet the compiled grammar is still reused'
            : 'Matching prompt prefix reuses KV cache pages; identical schema reuses compiled grammar',
          -840,
          355,
          28,
          ch > 0.5 ? ROLE.prefix : COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: 3 forced sampling steps vs Jump-Forward Append + Join Retokenization
  const act1 = guardedDynamic(
    () => fadeInHalf(act.value),
    (a) => {
      const sp = stepsProg.value;
      const ap = appendProg.value;
      const b2 = b2Hi.value;
      const jg = joinGate.value;
      const nodes = [];

      nodes.push(
        txt(
          'FORCED LITERAL:  {"status":"  (3 SAMPLING STEPS VS 1 APPEND)',
          -840,
          -225,
          26,
          ROLE.prefix,
          'mono',
          'left',
        ).opacity(a),
      );

      // Top lane: 3 serial sampling steps
      const frags = ['{"', 'status', '":"'];
      frags.forEach((f, idx) => {
        const x = -540 + idx * 420;
        const lit = sp > idx / 3;
        nodes.push(
          tokenChip(f, x, -110, {
            w: 240,
            h: 82,
            color: lit ? ROLE.prefix : '#33456d',
            size: 36,
            glow: lit ? 9 : 2,
            opacity: a,
          }),
          txt(
            `Step ${idx + 1}`,
            x,
            -38,
            26,
            lit ? ROLE.prefix : COSMOS.dim,
            'mono',
            'center',
          ).opacity(a),
        );
        if (idx < 2) {
          nodes.push(
            beamWithPhotons(quadArcPts([x + 128, -110], [x + 292, -110], 0), ROLE.prefix, 0, {
              alpha: a * (lit ? 0.9 : 0.35),
              width: 3,
              photonCount: lit ? 1 : 0,
            }),
          );
        }
      });

      // Bottom lane: Old prefix + single jump-forward append with glowing join seam
      const barY = 136;
      nodes.push(
        txt(
          'JUMP-FORWARD APPEND (HISTORICAL SGLANG SHORTCUT)',
          -840,
          20,
          26,
          ROLE.fsm,
          'mono',
          'left',
        ).opacity(a),
        rect(380, 92, { fill: '#101b33', stroke: ROLE.schema, width: 2.8, radius: 10 })
          .at(-650, barY)
          .opacity(a),
        txt('old prefix ...', -650, barY, 32, ROLE.schema, 'mono', 'center').opacity(a),
      );

      const appW = Math.max(120, 960 * Math.max(0.15, ap));
      const appText = '{"status":"'.slice(0, Math.max(1, Math.round(ap * 11)));
      nodes.push(
        rect(960, 92, {
          fill: '#0d1e2b',
          stroke: ap > 0.1 ? ROLE.fsm : '#2b3d63',
          width: 2.8,
          radius: 10,
        })
          .at(60, barY)
          .glow(ap > 0.3 ? 8 : 0, ROLE.fsm)
          .opacity(a),
        rect(appW - 12, 10, { fill: ROLE.fsm, stroke: null, radius: 4 })
          .at(-414 + (appW - 12) * 0.5, barY + 34)
          .glow(8, ROLE.fsm)
          .opacity(a * ap),
        txt(
          ap > 0.05 ? appText : 'forced literal',
          60,
          barY - 4,
          38,
          ROLE.fsm,
          'mono',
          'center',
        ).opacity(a),
      );

      // Join-seam retokenization laser when sg-join-retokenize fires
      if (jg > 0.05) {
        const seamX = -440;
        nodes.push(
          line([seamX, barY - 62], [seamX, barY + 76], { stroke: ROLE.prune, width: 5.5 })
            .glow(12, ROLE.prune)
            .opacity(a * jg),
          glowDot(seamX, barY - 62, { radius: 6, color: ROLE.prune, glow: 14, opacity: a * jg }),
          txt('RETOKENIZE ACROSS JOIN', seamX, barY + 118, 28, ROLE.prune, 'mono', 'center')
            .glow(8, ROLE.prune)
            .opacity(a * jg),
          txt(
            'XGrammar default backend',
            380,
            barY + 118,
            28,
            ROLE.legal,
            'mono',
            'center',
          ).opacity(a * Math.max(jg, b2)),
        );
      } else {
        nodes.push(
          txt(
            ap > 0.8
              ? '1 append skips 3 sampling calls · model forward pass still builds KV state'
              : 'Grammar fixes the entire next literal {"status":"',
            -840,
            255,
            28,
            ap > 0.8 ? ROLE.legal : COSMOS.muted,
            'mono',
            'left',
          ).opacity(a),
        );
      }

      nodes.push(
        txt(
          'Jump-forward aligns tokenizer joins · RadixAttention separately reuses prompt KV cache',
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

  c.on('sg-prefix-jump-0', () => {
    s.play(b0Hi.to(1, { duration: clampDur(c, c.cue('sg-prefix-jump-0').start, 0.35) }));
  });
  c.on('sg-cache-prompt-change', () => {
    s.play(
      promptFlipped.to(1, { duration: clampDur(c, c.cue('sg-cache-prompt-change').start, 0.5) }),
    );
  });
  c.on('sg-prefix-jump-1', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('sg-prefix-jump-1').start, 0.4) }));
  });
  c.on('sg-forced-steps', () => {
    s.play(stepsProg.to(1, { duration: clampDur(c, c.cue('sg-forced-steps').start, 0.75) }));
  });
  c.on('sg-forced-append', () => {
    s.play(appendProg.to(1, { duration: clampDur(c, c.cue('sg-forced-append').start, 0.8) }));
  });
  c.on('sg-prefix-jump-2', () => {
    s.play(b2Hi.to(1, { duration: clampDur(c, c.cue('sg-prefix-jump-2').start, 0.35) }));
  });
  c.on('sg-join-retokenize', () => {
    s.play(joinGate.to(1, { duration: clampDur(c, c.cue('sg-join-retokenize').start, 0.5) }));
  });
}
