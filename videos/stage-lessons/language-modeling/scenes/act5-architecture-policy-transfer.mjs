// Act 5 (Scenes 24-28): GQA & PagedAttention Memory, Context Window Policy,
// Evidence Failure & Execution Verification, Learner Transfer Check ("The dog slept"),
// and Fresh Budgeted Rollout Finale ("A red fox").
import { arrow, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  architectureMemoryState,
  cinemaGrid,
  clamp01,
  conditionalDistribution,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  rule,
  scaleTrack,
  tokenChip,
  txt,
  voiceSpan,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 24. architecture-memory: GQA Head Sharing, PagedAttention Blocks & 8->4 KV Halving
// Beat 0: 4 Q heads share 1 K/V head -> 8 KV heads serve 32 Q heads (1/4 cache)
// Beat 1: PagedAttention 4 slots/block: Req A (3 pos -> 1 blk), Req B (7 pos -> 2 blks) = 10/12 filled
// Beat 2: Halve KV heads 8 -> 4: 4 long reqs drop 16 GiB -> 8 GiB, fitting 8 reqs in 16 GiB
// ---------------------------------------------------------------------------
export function architectureMemory(s, c) {
  const b0Step = s.value(0);
  const b1P = s.value(0);
  const b1Step = s.value(0);
  const b2P = s.value(0);
  const headHalve = s.value(0);
  const b2Step = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.alt, seed: 24 }));
  s.add(decorAura(-320, 20, 480, '#5ce1e61c', '#07091000'));
  s.add(decorAura(360, 20, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['GQA Sharing &', 'Paged KV Blocks'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.alt,
    eyebrow: 'ARCHITECTURAL & ALLOCATOR LEVERS FOR KV CAPACITY',
  });

  // View 0: GQA 32 Q heads grouped 4:1 into 8 shared K/V heads
  const view0 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const st = b0Step.value;
      const nodes = [];
      const x0 = -740;
      const grpW = 195;

      nodes.push(
        txt('32 QUERY HEADS (8 GROUPS OF 4)', x0, -210, 26, ROLE.prefix, 'mono', 'left'),
        txt('8 SHARED KV HEADS  (1/4 RAW KV CACHE)', x0, 175, 26, ROLE.alt, 'mono', 'left'),
      );

      for (let g = 0; g < 8; g++) {
        const gx = x0 + 75 + g * grpW;
        const hi = g === 0 || st >= 0.8;
        const col = g === 0 ? ROLE.target : ROLE.prefix;
        // 4 query dots in each group
        for (let q = 0; q < 4; q++) {
          const qx = gx - 54 + q * 36;
          const qy = -110;
          nodes.push(
            line([qx, qy + 14], [gx, 62], { stroke: col, width: g === 0 ? 2.6 : 1.5 }).opacity(
              hi ? 0.8 : 0.25,
            ),
            glowDot(qx, qy, { radius: 11, color: col, glow: hi ? 9 : 2, opacity: hi ? 1 : 0.4 }),
          );
        }
        nodes.push(
          tokenChip(`KV ${g}`, gx, 95, g === 0 ? ROLE.target : ROLE.alt, {
            w: 120,
            h: 56,
            size: 26,
            glow: hi ? 9 : 2,
            opacity: hi ? 1 : 0.45,
          }),
        );
      }

      nodes.push(
        txt(
          '4 query heads share 1 K and 1 V head: converted T5 GQA models matched MHA quality at 1/4 KV memory',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1: PagedAttention physical block pool (4 slots/block: Req A=3 -> 1 blk, Req B=7 -> 2 blks = 10/12)
  const view1 = guardedDynamic(
    () => Math.min(fadeIn(b1P.value), fadeOut(b2P.value)),
    (vis) => {
      const st = b1Step.value;
      const nodes = [];

      // Left: Logical requests rounded up separately
      nodes.push(
        txt('LOGICAL REQUESTS (4 SLOTS / BLOCK)', -835, -210, 26, ROLE.prefix, 'mono', 'left'),
        txt(
          'Request A:  3 positions  ->  1 block (3/4)',
          -835,
          -110,
          28,
          ROLE.prefix,
          'mono',
          'left',
        ),
        txt('Request B:  7 positions  ->  2 blocks (7/8)', -835, -40, 28, ROLE.alt, 'mono', 'left'),
        txt('Total filled:  10 / 12 slots', -835, 65, 34, ROLE.target, 'mono', 'left'),
        txt(
          '2 empty tail slots (zero external fragmentation)',
          -835,
          125,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
        txt(
          st >= 3.5
            ? 'Pre-paged systems used only 20.4% - 38.2% of KV memory'
            : 'Non-contiguous physical blocks eliminate contiguous slack',
          -835,
          205,
          26,
          ROLE.warm,
          'sans',
          'left',
        ),
      );

      // Right: 3 physical 4-slot blocks placed non-contiguously in memory pool
      const bx = 135;
      const blocks = [
        { title: 'Physical Block #0  (Req B, 0..3)', filled: 4, col: ROLE.alt },
        { title: 'Physical Block #2  (Req A, 0..2)', filled: 3, col: ROLE.prefix },
        { title: 'Physical Block #5  (Req B, 4..6)', filled: 3, col: ROLE.alt },
      ];
      nodes.push(txt('PHYSICAL KV BLOCK POOL', bx, -210, 26, ROLE.alt, 'mono', 'left'));
      blocks.forEach((blk, bIdx) => {
        const y = -105 + bIdx * 125;
        nodes.push(txt(blk.title, bx, y - 48, 26, blk.col, 'mono', 'left'));
        for (let sIdx = 0; sIdx < 4; sIdx++) {
          const sx = bx + 66 + sIdx * 155;
          const used = sIdx < blk.filled;
          nodes.push(
            tokenChip(used ? `tok ${sIdx}` : 'empty', sx, y + 6, used ? blk.col : COSMOS.dim, {
              w: 136,
              h: 56,
              size: 26,
              glow: used ? 8 : 0,
              dash: used ? null : [7, 5],
              opacity: used ? 1 : 0.55,
            }),
          );
        }
      });

      nodes.push(
        txt(
          "Equal block sizes eliminate external fragmentation; only each request's final block has empty tail slots",
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2: Halving KV heads 8 -> 4 cuts 16 GiB -> 8 GiB, fitting 8 requests in 16 GiB budget
  const view2 = guardedDynamic(
    () => fadeIn(b2P.value),
    (vis) => {
      const hh = headHalve.value;
      const st = b2Step.value;
      const mem = architectureMemoryState(hh);
      const barX = -680;
      const barW = 1360;
      const nodes = [
        txt(
          `STORED KV HEADS:  ${mem.heads} HEADS   (4 LONG REQUESTS @ 32,768 POS)`,
          barX,
          -185,
          28,
          ROLE.target,
          'mono',
          'left',
        ),
        scaleTrack(barX, -95, barW, 74, { stroke: ROLE.prefix, radius: 12 }),
        glowBar(barX, -95, barW * (mem.gib / 16), 68, hh > 0.5 ? ROLE.alt : ROLE.prefix, {
          glow: 11,
          radius: 10,
        }),
        txt(
          `${mem.gib.toFixed(1)} GiB / 16 GiB budget`,
          barX + 24,
          -95,
          32,
          '#070910',
          'mono',
          'left',
        ),

        // Second bar: 8 requests packed into the freed 16 GiB cache budget
        txt(
          'SAME 16 GiB BUDGET AT 4 KV HEADS:  HOLDS 8 CONCURRENT REQUESTS (2×)',
          barX,
          55,
          28,
          ROLE.alt,
          'mono',
          'left',
        ).opacity(mix(0.35, 1, clamp01(st))),
        scaleTrack(barX, 145, barW, 74, { stroke: ROLE.alt, radius: 12 }),
      ];
      for (let r = 0; r < 8; r++) {
        const rw = barW / 8;
        const visReq = r < 4 ? 1 : clamp01(st);
        nodes.push(
          glowBar(barX + r * rw + 3, 145, rw - 6, 66, r < 4 ? ROLE.prefix : ROLE.alt, {
            glow: 8 * visReq,
            radius: 8,
            opacity: visReq,
          }),
          txt(`R${r + 1}`, barX + (r + 0.5) * rw, 145, 26, '#070910', 'mono').opacity(visReq),
        );
      }

      nodes.push(
        txt(
          'Weights, runtime tensors, scheduling & latency still cap batches: measure tokens/sec directly',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  cueTo(s, c, 'architecture-memory-b1', b0Step, 0.4, { dur: 0.4 });
  voiceSpan(s, c, 'architecture-memory-voice-1', vPhase, 1);
  cueTo(s, c, 'architecture-memory-step-0-1', b0Step, 1, { dur: 0.5 });
  cueTo(s, c, 'architecture-memory-step-0-2', b0Step, 2, { dur: 0.45 });
  cueTo(s, c, 'architecture-memory-step-0-3', b0Step, 3, { dur: 0.45 });

  cueTo(s, c, 'architecture-memory-b2', b1P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'architecture-memory-voice-2', vPhase, 2);
  cueTo(s, c, 'architecture-memory-step-1-1', b1Step, 1, { dur: 0.45 });
  cueTo(s, c, 'architecture-memory-step-1-2', b1Step, 2, { dur: 0.45 });
  cueTo(s, c, 'architecture-memory-step-1-3', b1Step, 3, { dur: 0.45 });
  cueTo(s, c, 'architecture-memory-step-1-4', b1Step, 4, { dur: 0.45 });
  cueTo(s, c, 'architecture-memory-step-1-5', b1Step, 5, { dur: 0.45 });

  cueTo(s, c, 'architecture-memory-b3', b2P, 1, { dur: 0.65 });
  cueTo(s, c, 'architecture-memory-b3', headHalve, 1, { dur: 1.0 });
  voiceSpan(s, c, 'architecture-memory-voice-3', vPhase, 3);
  cueTo(s, c, 'architecture-memory-step-2-1', b2Step, 1, { dur: 0.5 });
  cueTo(s, c, 'architecture-memory-step-2-2', b2Step, 2, { dur: 0.45 });
  cueTo(s, c, 'architecture-memory-step-2-3', b2Step, 3, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 25. context-policy: Context Window 32 (25+8=33 overflow vs 24+8=32) & Retention Policy
// Beat 0: 32-slot ruler, 8 reserved output slots, 25-tok prompt overflows by 1 -> trim to 24
// Beat 1: Full attention vs Sliding-window eviction vs Recurrent hidden state
// ---------------------------------------------------------------------------
export function contextPolicy(s, c) {
  const b0Step = s.value(0);
  const trimP = s.value(0);
  const b1P = s.value(0);
  const b1Step = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.warm, seed: 25 }));
  s.add(decorAura(-240, 0, 480, '#fb923c1c', '#07091000'));
  s.add(decorAura(340, 0, 480, '#5ce1e61a', '#07091000'));

  const headline = heroTitle(['Context Budget &', 'Retention Policy'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.warm,
    eyebrow: 'WINDOW LIMIT = 32 POSITIONS  ·  PROMPT + RESERVED OUTPUT',
  });

  // View 0: 32-position context ruler with 25+8=33 overflow -> trimmed 24+8=32 fit
  const view0 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const tr = trimP.value;
      const st = b0Step.value;
      const sx = -760;
      const unit = 44; // 32 * 44 = 1408 px
      const limX = sx + 32 * unit;
      const promptLen = mix(25, 24, tr);
      const totalLen = promptLen + 8;
      const isOver = totalLen > 32.05;
      const yBar = -25;
      const nodes = [];

      nodes.push(
        txt('CONTEXT WINDOW CAPACITY = 32 POSITIONS', sx, -185, 28, ROLE.prefix, 'mono', 'left'),
        scaleTrack(sx, yBar, 32 * unit, 84, { stroke: '#3a4e7c', radius: 12 }),
        // Prompt segment
        glowBar(sx, yBar, promptLen * unit - 3, 76, ROLE.prefix, { glow: 9, radius: 10 }),
        txt(
          `Prompt: ${Math.round(promptLen)} tokens`,
          sx + (promptLen * unit) / 2,
          yBar,
          32,
          '#070910',
          'mono',
        ),
        // Reserved 8 output slots
        glowBar(
          sx + promptLen * unit + 2,
          yBar,
          8 * unit - 4,
          76,
          isOver ? ROLE.danger : ROLE.alt,
          { glow: 11, radius: 10, opacity: mix(0.45, 1, clamp01(st)) },
        ),
        txt('8 output', sx + (promptLen + 4) * unit, yBar, 28, '#070910', 'mono'),

        // Hard limit wall at slot 32
        line([limX, yBar - 90], [limX, yBar + 96], {
          stroke: isOver ? ROLE.danger : ROLE.alt,
          width: 4.5,
        }).glow(12, isOver ? ROLE.danger : ROLE.alt),
        txt('LIMIT 32', limX, yBar - 112, 26, isOver ? ROLE.danger : ROLE.alt, 'mono'),

        // Live equation readout below
        txt(
          isOver
            ? '25 prompt + 8 reserved  =  33  >  32   (OVERFLOW BY 1 SLOT!)'
            : '24 prompt + 8 reserved  =  32  =  32   (EXACT FIT)',
          0,
          145,
          36,
          isOver ? ROLE.danger : ROLE.alt,
          'mono',
        ).glow(10, isOver ? ROLE.danger : ROLE.alt),
        txt(
          isOver
            ? 'Options: reject request, reserve fewer output slots, or shorten prompt by 1 token'
            : 'Shortening the prompt to 24 tokens leaves all 8 reserved output slots inside the window',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1: Full attention vs Sliding-window eviction vs Recurrent hidden state
  const view1 = guardedDynamic(
    () => fadeIn(b1P.value),
    (vis) => {
      const sx = -320;
      const step = 115;
      const lanes = [
        {
          name: 'FULL ATTENTION KV',
          y: -135,
          keepFrom: 0,
          col: ROLE.prefix,
          note: 'retains all 8 slots',
        },
        {
          name: 'SLIDING WINDOW (W=4)',
          y: 15,
          keepFrom: 4,
          col: ROLE.warm,
          note: 'evicts slots 0..3',
        },
        {
          name: 'RECURRENT STATE h_t',
          y: 165,
          keepFrom: 7,
          col: ROLE.rare,
          note: 'compresses past into state',
        },
      ];
      const nodes = [
        txt(
          'DIFFERENT ARCHITECTURES ENFORCE DIFFERENT RETENTION RULES',
          -835,
          -225,
          26,
          ROLE.prefix,
          'mono',
          'left',
        ),
      ];
      lanes.forEach((ln, lIdx) => {
        nodes.push(
          txt(ln.name, -835, ln.y - 12, 26, ln.col, 'mono', 'left'),
          txt(ln.note, -835, ln.y + 24, 26, COSMOS.muted, 'sans', 'left'),
        );
        for (let k = 0; k < 8; k++) {
          const cx = sx + k * step;
          const active = k >= ln.keepFrom;
          const isRecGhost = lIdx === 2 && k < 7;
          nodes.push(
            tokenChip(
              lIdx === 2 && k === 7 ? 'h_7' : `t${k}`,
              cx,
              ln.y,
              active ? ln.col : isRecGhost ? ROLE.rare : ROLE.danger,
              {
                w: 96,
                h: 56,
                size: 26,
                glow: active ? 9 : 0,
                dash: active ? null : [6, 5],
                opacity: active ? 1 : isRecGhost ? 0.38 : 0.25,
              },
            ),
          );
        }
      });

      nodes.push(
        txt(
          "Deleting old KV vectors != recomputing a shortened prompt: follow the runtime's documented retention policy",
          0,
          365,
          26,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1);
  cueTo(s, c, 'context-policy-b1', b0Step, 0.3, { dur: 0.4 });
  voiceSpan(s, c, 'context-policy-voice-1', vPhase, 1);
  cueTo(s, c, 'context-policy-step-0-1', b0Step, 1, { dur: 0.45 });
  cueTo(s, c, 'context-policy-step-0-2', b0Step, 2, { dur: 0.45 });
  cueTo(s, c, 'context-policy-step-0-3', b0Step, 3, { dur: 0.45 });
  cueTo(s, c, 'context-policy-step-0-4', trimP, 1, { dur: 0.75 });

  cueTo(s, c, 'context-policy-b2', b1P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'context-policy-voice-2', vPhase, 2);
  cueTo(s, c, 'context-policy-step-1-1', b1Step, 1, { dur: 0.45 });
  cueTo(s, c, 'context-policy-step-1-2', b1Step, 2, { dur: 0.45 });
  cueTo(s, c, 'context-policy-step-1-3', b1Step, 3, { dur: 0.45 });
  cueTo(s, c, 'context-policy-step-1-4', b1Step, 4, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 26. evidence-failure: Plausible Token vs Authoritative Policy & Code Execution Test
// Cues: policy-prediction, policy-open, policy-trace, retries-first, retries-change, retries-second*
// ---------------------------------------------------------------------------
export function evidenceFailure(s, c) {
  const predP = s.value(0);
  const openP = s.value(0);
  const traceP = s.value(0);
  const ret1P = s.value(0);
  const chgP = s.value(0);
  const ret2P = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.danger, seed: 26 }));
  s.add(decorAura(-340, 0, 480, '#ff6b8b1a', '#07091000'));
  s.add(decorAura(340, 0, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Likelihood Is Not', 'Verified Ground Truth'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.danger,
    eyebrow: 'STALE RETRIEVAL TRACE  ·  COUNTERFACTUAL EXECUTION CHECK',
  });

  // View 0 (Beats 0-1): "unlimited" 75% bar vs Policy v2 "60 req/min" + Retriever v1 -> v2 trace
  const view0 = guardedDynamic(
    () => fadeOut(ret1P.value),
    (vis) => {
      const pr = predP.value;
      const op = openP.value;
      const tr = traceP.value;
      const nodes = [];

      // Left: Model probability distribution for "Free tier limit is ..."
      const lx = -820;
      const bw = 620;
      nodes.push(
        txt('MODEL NEXT-TOKEN PROBABILITY', lx, -205, 26, ROLE.warm, 'mono', 'left'),
        txt('Prompt: "Free-tier rate limit is ..."', lx, -155, 28, COSMOS.muted, 'sans', 'left'),
        scaleTrack(lx, -70, bw, 62, { stroke: ROLE.danger, radius: 10 }),
        glowBar(lx, -70, bw * 0.75, 56, ROLE.danger, {
          glow: 11 * mix(0.35, 1, pr),
          radius: 9,
          opacity: mix(0.55, 1, pr),
        }),
        txt('"unlimited"  75%', lx + 24, -70, 32, '#070910', 'mono', 'left'),
        scaleTrack(lx, 20, bw, 46, { radius: 8 }),
        glowBar(lx, 20, bw * 0.15, 42, ROLE.prefix, { glow: 5, radius: 8 }),
        txt('"60 req/min"  15%', lx + bw * 0.15 + 24, 20, 26, ROLE.prefix, 'mono', 'left'),
      );

      // Right: Authoritative Policy & Retrieval Trace pipeline
      const rx = 85;
      nodes.push(
        rule(0, -210, 0, 225, '#2a3759', 2),
        txt('AUTHORITATIVE POLICY & TRACE', rx, -205, 26, ROLE.alt, 'mono', 'left'),
        txt(
          op > 0.35 ? 'CURRENT POLICY v2:  60 req / min' : 'OPEN CURRENT POLICY DOC...',
          rx,
          -95,
          34,
          op > 0.35 ? ROLE.alt : COSMOS.dim,
          'mono',
          'left',
        ).glow(op > 0.35 ? 10 : 0, ROLE.alt),
      );

      // Application trace diagram (v1 stale -> fetch v2)
      const trAlpha = mix(0.35, 1, tr);
      nodes.push(
        tokenChip('Retriever: v1', rx + 125, 35, ROLE.danger, {
          w: 250,
          h: 64,
          size: 28,
          glow: 9 * trAlpha,
          opacity: trAlpha,
        }),
        arrow([rx + 260, 35], [rx + 360, 35], { stroke: ROLE.alt, width: 3.5 }).opacity(trAlpha),
        tokenChip('Fetch v2 (60)', rx + 505, 35, ROLE.alt, {
          w: 270,
          h: 64,
          size: 28,
          glow: 10 * trAlpha,
          opacity: trAlpha,
        }),
        txt(
          tr > 0.45
            ? 'Lowering temperature keeps stale v1 in place!'
            : 'Probability explains generation; policy establishes truth',
          rx,
          145,
          28,
          tr > 0.45 ? ROLE.warm : COSMOS.muted,
          'sans',
          'left',
        ),
        txt(
          'Inspect retrieved doc version, live tool traces, and stop reasons rather than guessing from likelihood',
          0,
          365,
          26,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beats 2-3): Python counterfactual execution (retries=3; -=1 -> 2  vs  retries=7; +=2 -> 9)
  const view1 = guardedDynamic(
    () => fadeIn(ret1P.value),
    (vis) => {
      const cg = chgP.value;
      const r2 = ret2P.value;
      const nodes = [];

      // Left: Original program (prints 2)
      const lx = -780;
      nodes.push(
        txt('CASE 1: ORIGINAL PROGRAM', lx, -205, 26, ROLE.prefix, 'mono', 'left'),
        txt('retries = 3', lx, -110, 36, COSMOS.ink, 'mono', 'left'),
        txt('retries -= 1', lx, -50, 36, ROLE.prefix, 'mono', 'left'),
        txt('print(retries)', lx, 10, 36, COSMOS.ink, 'mono', 'left'),
        arrow([lx + 150, 58], [lx + 150, 128], { stroke: ROLE.alt, width: 3.5 }),
        txt('Python output:  2', lx, 175, 42, ROLE.alt, 'mono', 'left').glow(9, ROLE.alt),
        txt('A constant "always 2" model passes this!', lx, 240, 26, ROLE.warm, 'sans', 'left'),
      );

      nodes.push(rule(0, -210, 0, 260, '#2a3759', 2));

      // Right: Mutated counterfactual program (retries=7; retries+=2 -> 9 withheld until retries-second!)
      const rx = 115;
      const mutAlpha = mix(0.4, 1, cg);
      nodes.push(
        txt('CASE 2: COUNTERFACTUAL MUTATION', rx, -205, 26, ROLE.target, 'mono', 'left'),
        txt(
          cg > 0.35 ? 'retries = 7' : 'retries = ?',
          rx,
          -110,
          36,
          ROLE.target,
          'mono',
          'left',
        ).opacity(mutAlpha),
        txt(
          cg > 0.35 ? 'retries += 2' : 'retries ? ?',
          rx,
          -50,
          36,
          ROLE.target,
          'mono',
          'left',
        ).opacity(mutAlpha),
        txt('print(retries)', rx, 10, 36, COSMOS.ink, 'mono', 'left').opacity(mutAlpha),
        arrow([rx + 150, 58], [rx + 150, 128], {
          stroke: r2 > 0.4 ? ROLE.alt : ROLE.warm,
          width: 3.5,
        }).opacity(mutAlpha),
        txt(
          r2 > 0.4 ? 'Python output:  9' : 'Expected output:  ?',
          rx,
          175,
          44,
          r2 > 0.4 ? ROLE.alt : ROLE.warm,
          'mono',
          'left',
        ).glow(r2 > 0.4 ? 12 : 0, ROLE.alt),
        txt(
          r2 > 0.4
            ? 'Compare model completion against 9 across unfamiliar inputs'
            : 'Predict the output before testing the model!',
          rx,
          240,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
        txt(
          'Varied execution tests separate genuine state tracking from memorized shortcuts',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'policy-prediction', predP, 1, { dur: 0.65 });
  cueTo(s, c, 'policy-open', openP, 1, { dur: 0.65 });
  cueTo(s, c, 'policy-trace', traceP, 1, { dur: 0.65 });
  cueTo(s, c, 'retries-first', ret1P, 1, { dur: 0.7 });
  cueTo(s, c, 'retries-change', chgP, 1, { dur: 0.7 });
  cueTo(s, c, 'retries-second', ret2P, 1, { after: true, dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 27. transfer: Learner Transfer Check on "The dog slept"
// Beat 0: Prediction pause (targets & prefix withheld!)
// Beat 1: Shift targets -> highlight visible prefix [start, The, dog] -> loss -ln(0.30) = 1.20 nats
// Beat 2: Greedy generation from "The dog" -> picks "ate" (0.60) -> "end" (0.80)
// ---------------------------------------------------------------------------
export function transfer(s, c) {
  const tgtP = s.value(0);
  const ctxP = s.value(0);
  const lossP = s.value(0);
  const genP = s.value(0);
  const endP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.target, seed: 27 }));
  s.add(decorAura(-320, 0, 480, '#5ce1e61c', '#07091000'));
  s.add(decorAura(340, 0, 480, '#ffd16618', '#07091000'));

  const headline = heroTitle(['Your Turn:', 'Record vs Generation'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.target,
    eyebrow: 'RECORDED SENTENCE: "The dog slept"  ·  TRANSFER CHECK',
  });

  const dogRow = conditionalDistribution('The dog'); // ate 0.6, slept 0.3, sat 0.1
  const inputs = ['start', 'The', 'dog', 'slept'];
  const targets = ['The', 'dog', 'slept', 'end'];

  const visual = dynamic(() => {
    const tg = tgtP.value;
    const cxP = ctxP.value;
    const ls = lossP.value;
    const gn = genP.value;
    const en = endP.value;
    const nodes = [];

    // Top half: Teacher-forced shifted rails for "The dog slept"
    const x0 = -720;
    const step = 225;
    const yIn = -145;
    const yOut = 15;

    nodes.push(
      txt('RECORDED INPUTS', x0 - 95, yIn - 68, 26, ROLE.prefix, 'mono', 'left'),
      txt('SHIFTED TARGETS', x0 - 95, yOut + 68, 26, ROLE.alt, 'mono', 'left'),
    );
    for (let i = 0; i < 4; i++) {
      const px = x0 + i * step;
      const inVisible = cxP > 0.35 && i <= 2;
      const isDog = i === 2;
      const inCol = isDog ? ROLE.target : inVisible ? ROLE.prefix : COSMOS.muted;
      nodes.push(
        tokenChip(inputs[i], px, yIn, inCol, {
          w: 168,
          h: 62,
          size: 28,
          glow: isDog ? 11 : inVisible ? 8 : 2,
          opacity: cxP > 0.35 && i === 3 ? 0.45 : 1,
        }),
        arrow([px, yIn + 36], [px, yOut - 36], {
          stroke: isDog && tg > 0.35 ? ROLE.alt : '#3a4e7c',
          width: isDog ? 3.5 : 2.2,
        }),
        tokenChip(
          tg > 0.35 ? targets[i] : '?',
          px,
          yOut,
          tg > 0.35 ? (isDog ? ROLE.alt : ROLE.prefix) : COSMOS.dim,
          {
            w: 168,
            h: 62,
            size: 28,
            glow: isDog && tg > 0.35 ? 11 : 3,
            dash: tg > 0.35 ? null : [8, 6],
          },
        ),
      );
    }

    // Top-right: Distribution P(next | The dog) & loss -ln(0.30) = 1.20 nats
    const bx = 260;
    const bw = 460;
    const dCols = [ROLE.warm, ROLE.alt, ROLE.rare];
    nodes.push(txt('P(next | The dog)', bx, -210, 26, ROLE.prefix, 'mono', 'left'));
    dogRow.forEach((item, i) => {
      const y = -135 + i * 74;
      nodes.push(
        txt(item.token, bx - 18, y, 28, dCols[i], 'mono', 'right'),
        scaleTrack(bx, y, bw, 38, { radius: 8 }),
        glowBar(bx, y, bw * item.probability, 38, dCols[i], { glow: 8, radius: 8 }),
        txt(`${Math.round(item.probability * 100)}%`, bx + bw + 48, y, 28, dCols[i], 'mono'),
      );
    });

    // Bottom readout: Prediction prompt -> Loss (1.20 nats) -> Greedy Rollout ("The dog ate")
    if (gn > 0.08) {
      nodes.push(
        group(
          txt('GREEDY ROLLOUT:', -810, 180, 28, ROLE.warm, 'mono', 'left'),
          tokenChip('The', -460, 180, ROLE.prefix, { w: 120, h: 58, size: 28 }),
          tokenChip('dog', -320, 180, ROLE.prefix, { w: 120, h: 58, size: 28 }),
          tokenChip('ate', -175, 180, ROLE.warm, { w: 130, h: 58, size: 28, glow: 11 }),
          en > 0.3
            ? tokenChip('end', -25, 180, ROLE.target, {
                w: 130,
                h: 58,
                size: 28,
                glow: 11,
                opacity: en,
              })
            : group(),
          txt('Record: "The dog slept"', -810, 260, 30, ROLE.alt, 'mono', 'left'),
          txt('Generated: "The dog ate"', 20, 260, 30, ROLE.warm, 'mono', 'left'),
        ).opacity(gn),
      );
    } else if (ls > 0.08) {
      nodes.push(
        group(
          glowTex(
            '\\text{At dog: target} = \\text{slept} \\; (0.30) \\;\\Rightarrow\\; -\\ln(0.30) \\approx 1.20\\text{ nats}',
            {
              x: 0,
              y: 205,
              size: 40,
              color: ROLE.alt,
            },
          ),
        ).opacity(ls),
      );
    } else {
      nodes.push(
        txt(
          'At "dog": which word is the target, and which earlier words may the model read?',
          0,
          205,
          32,
          ROLE.target,
          'serif',
        ),
      );
    }

    nodes.push(
      txt(
        en > 0.45
          ? 'Probabilities explain what the model generates; observations supply targets and ground truth'
          : 'Keep observed training targets strictly separate from model-generated choices',
        0,
        365,
        28,
        COSMOS.muted,
        'serif',
      ),
    );
    return group(...nodes);
  });

  s.add(headline, visual);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'transfer-targets', tgtP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'transfer-context', ctxP, 1, { dur: 0.6 });
  cueTo(s, c, 'transfer-loss', lossP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'transfer-generate', genP, 1, { dur: 0.7 });
  cueTo(s, c, 'transfer-end', endP, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 28. fresh-budgeted-rollout: Grand Finale on "A red fox" (Window 5, Reserve 2)
// Beat 0: Window 5 (3 prompt + 2 output), record "runs -> end" (1/4 * 1/2 = ?)
// Beat 1: Run 1: prefill 3 -> sample runs -> feed back (4 KV) -> sample end (stop: end token);
//         record score = 1/8, PPL = sqrt(8) = 2.83
// Beat 2: Reset prompt, keep record: sample waits -> feed back (4 KV) -> sample here (prediction!)
// Beat 3: Output limit stop; cache = [A, red, fox, waits]; record score stays 1/8!
// ---------------------------------------------------------------------------
export function freshBudgetedRollout(s, c) {
  const resP = s.value(0);
  const recP = s.value(0);
  const runsP = s.value(0);
  const feed1P = s.value(0);
  const end1P = s.value(0);
  const probP = s.value(0);
  const pplP = s.value(0);
  const rewP = s.value(0);
  const waitsP = s.value(0);
  const feed2P = s.value(0);
  const hereP = s.value(0);
  const limP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.target, seed: 28 }));
  s.add(decorAura(-320, 0, 500, '#5ce1e61c', '#07091000'));
  s.add(decorAura(340, 20, 500, '#ffd1661a', '#07091000'));

  const headline = heroTitle(['Full Loop Synthesis:', 'Budgeted Rollout'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.target,
    eyebrow: 'PROMPT "A red fox"  ·  WINDOW 5  ·  2 OUTPUT SLOTS  ·  RECORD vs RUN',
  });

  const visual = dynamic(() => {
    const rs = resP.value;
    const rc = recP.value;
    const r1 = runsP.value;
    const f1 = feed1P.value;
    const e1 = end1P.value;
    const pr = probP.value;
    const pp = pplP.value;
    const rw = rewP.value;
    const wt = waitsP.value;
    const f2 = feed2P.value;
    const hr = hereP.value;
    const lm = limP.value;
    const nodes = [];

    const isRun2 = rw > 0.5;
    const x0 = -760;
    const slotW = 165;
    const gap = 18;

    // Top: 5-slot Context Window & Resident KV Cache
    const yWin = -165;
    const fourthTok = isRun2 ? (f2 > 0.4 ? 'waits' : null) : f1 > 0.4 ? 'runs' : null;
    const kvCount = fourthTok ? 4 : 3;

    nodes.push(
      txt(
        `5-SLOT WINDOW  (${kvCount} PROCESSED IN KV CACHE  ·  2 OUTPUT SLOTS)`,
        x0,
        yWin - 72,
        26,
        ROLE.prefix,
        'mono',
        'left',
      ),
    );
    const promptWords = ['A', 'red', 'fox'];
    for (let i = 0; i < 5; i++) {
      const cx = x0 + 82 + i * (slotW + gap);
      const isPrompt = i < 3;
      const isCached4 = i === 3 && Boolean(fourthTok);
      const isOutSlot = i >= 3;
      const lbl = isPrompt ? promptWords[i] : isCached4 ? fourthTok : `out ${i - 2}`;
      const col = isPrompt
        ? ROLE.prefix
        : isCached4
          ? isRun2
            ? ROLE.warm
            : ROLE.alt
          : rs > 0.3
            ? ROLE.target
            : COSMOS.dim;
      nodes.push(
        tokenChip(lbl, cx, yWin, col, {
          w: slotW,
          h: 68,
          size: 28,
          glow: isPrompt || isCached4 ? 9 : 3,
          dash: isOutSlot && !isCached4 ? [8, 6] : null,
        }),
        txt(
          isPrompt || isCached4 ? 'KV' : 'free',
          cx,
          yWin + 54,
          26,
          isPrompt || isCached4 ? col : COSMOS.dim,
          'mono',
        ),
      );
    }

    // Middle-left: Accepted Output Slots (Run 1 vs Run 2)
    const yRun = 45;
    const out1 = isRun2 ? (wt > 0.4 ? 'waits' : '...') : r1 > 0.4 ? 'runs' : '...';
    const out2 = isRun2 ? (hr > 0.4 ? 'here' : '...') : e1 > 0.4 ? 'end' : '...';
    const stopBadge = isRun2
      ? lm > 0.4
        ? 'STOP: OUTPUT LIMIT'
        : hr > 0.4
          ? 'STOP: ?'
          : 'RUNNING...'
      : e1 > 0.4
        ? 'STOP: END TOKEN'
        : 'READY';
    const stopCol = isRun2
      ? lm > 0.4
        ? ROLE.danger
        : ROLE.warm
      : e1 > 0.4
        ? ROLE.alt
        : COSMOS.muted;

    nodes.push(
      txt(
        isRun2 ? 'RUN 2 (REWOUND ROLLOUT)' : 'RUN 1 (FOLLOWS RECORD)',
        x0,
        yRun - 62,
        26,
        isRun2 ? ROLE.warm : ROLE.alt,
        'mono',
        'left',
      ),
      tokenChip(out1, x0 + 95, yRun, out1 === '...' ? COSMOS.dim : isRun2 ? ROLE.warm : ROLE.alt, {
        w: 185,
        h: 66,
        size: 30,
        glow: out1 === '...' ? 0 : 10,
      }),
      tokenChip(
        out2,
        x0 + 305,
        yRun,
        out2 === '...' ? COSMOS.dim : isRun2 ? ROLE.warm : ROLE.target,
        {
          w: 185,
          h: 66,
          size: 30,
          glow: out2 === '...' ? 0 : 10,
        },
      ),
      txt(stopBadge, x0 + 430, yRun, 28, stopCol, 'mono', 'left').glow(
        (isRun2 && lm > 0.4) || (!isRun2 && e1 > 0.4) ? 9 : 0,
        stopCol,
      ),
    );

    // Middle-right: Current Active Next-Token Distribution Row
    const rx = 250;
    const rwBar = 460;
    const activePrefix = isRun2
      ? f2 > 0.4
        ? 'A red fox waits'
        : 'A red fox'
      : f1 > 0.4
        ? 'A red fox runs'
        : 'A red fox';
    const activeRow = conditionalDistribution(activePrefix);
    nodes.push(txt(`P(next | ${activePrefix})`, rx, -236, 26, ROLE.target, 'mono', 'left'));
    activeRow.forEach((item, i) => {
      const y = -168 + i * 74;
      const col = i === 0 ? ROLE.alt : ROLE.warm;
      nodes.push(
        txt(item.token, rx - 18, y, 28, col, 'mono', 'right'),
        scaleTrack(rx, y, rwBar, 38, { radius: 8 }),
        glowBar(rx, y, rwBar * item.probability, 38, col, { glow: 8, radius: 8 }),
        txt(`${Math.round(item.probability * 100)}%`, rx + rwBar + 48, y, 28, col, 'mono'),
      );
    });

    // Bottom: Fixed Recorded Page Score (strictly stays 1/8 and PPL 2.83 across Run 2!)
    const yRec = 205;
    nodes.push(
      txt(
        rc > 0.3
          ? 'RECORDED PAGE:  "A red fox  ->  runs (1/4)  ->  end (1/2)"'
          : 'FIXED RECORDED CONTINUATION',
        x0,
        yRec - 42,
        28,
        ROLE.prefix,
        'mono',
        'left',
      ),
    );
    if (pr > 0.3) {
      nodes.push(
        txt(
          pp > 0.3
            ? 'Record P = 1/8  ·  Mean NLL = 1.040  ·  PPL = √8 ≈ 2.83'
            : 'Record P = 1/4 × 1/2 = 1/8',
          x0,
          yRec + 24,
          30,
          ROLE.target,
          'mono',
          'left',
        ).glow(10, ROLE.target),
      );
      if (isRun2 && lm > 0.4) {
        nodes.push(
          txt('UNCHANGED!', 560, yRec + 24, 30, ROLE.alt, 'mono', 'left').glow(9, ROLE.alt),
        );
      }
    } else {
      nodes.push(
        txt(
          'Predict: what is P(runs, end | A red fox), and which tokens reach the KV cache?',
          x0,
          yRec + 24,
          28,
          ROLE.target,
          'serif',
          'left',
        ),
      );
    }

    nodes.push(
      txt(
        lm > 0.4
          ? 'Score a record from its page; continue a rollout from the token it actually picked'
          : isRun2 && hr > 0.4
            ? "Both output slots are full: what stopped this run, and does the record's score change?"
            : 'Check end token first, then output budget; cache stores only processed inputs',
        0,
        365,
        28,
        COSMOS.muted,
        'serif',
      ),
    );
    return group(...nodes);
  });

  s.add(headline, visual);
  livingDrift(s, c, drift, 1);

  // Beat 0
  cueTo(s, c, 'fresh-reserve', resP, 1, { dur: 0.6 });
  cueTo(s, c, 'fresh-record', recP, 1, { dur: 0.6 });

  // Beat 1
  cueTo(s, c, 'fresh-choose-runs', runsP, 1, { dur: 0.6 });
  cueTo(s, c, 'fresh-budgeted-rollout-step-1-1', feed1P, 1, { dur: 0.65 });
  cueTo(s, c, 'fresh-budgeted-rollout-step-1-2', end1P, 1, { dur: 0.6 });
  cueTo(s, c, 'fresh-budgeted-rollout-step-1-4', probP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'fresh-budgeted-rollout-step-1-5', pplP, 1, { after: true, dur: 0.6 });

  // Beat 2
  cueTo(s, c, 'fresh-rewind', rewP, 1, { dur: 0.55 });
  cueTo(s, c, 'fresh-choose-waits', waitsP, 1, { dur: 0.6 });
  cueTo(s, c, 'fresh-feed-waits', feed2P, 1, { dur: 0.65 });
  cueTo(s, c, 'fresh-choose-here', hereP, 1, { dur: 0.6 });

  // Beat 3
  cueTo(s, c, 'fresh-limit', limP, 1, { after: true, dur: 0.65 });
}
