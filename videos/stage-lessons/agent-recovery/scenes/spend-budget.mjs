// Scene 11: spend-budget - "What does the run spend?"
// Three stages: (1) Multiplicative retry lattice (3 -> 3x3=9 -> 4^3=64 transport sends),
// (2) Cumulative prompt token staircase (100, 150, 200, 250 = 700 with MathJax quadratic formula),
// (3) Atomic conservative reservation (120 + 80 = 200 > 150 balance rejected, compaction & cancel).
import { line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  ambientClock,
  cinemaAtmosphere,
  glowBar,
  glowDot,
  glowPill,
  glowTex,
  guardedDynamic,
  heroTitle,
  hexAlpha,
  lowerFooter,
  playCue,
  txt,
} from '../parts.mjs';

export default function spendBudget(s, c) {
  const title = heroTitle(['What does the run spend?'], {
    x: -855,
    y: -440,
    size: 52,
    accent: ROLE.mark,
  });

  const amb = ambientClock(s, c);
  const stage = s.value(0); // 0 = retry amplification, 1 = cumulative tokens, 2 = atomic reservation
  const show3 = s.value(0);
  const show9 = s.value(0);
  const show64 = s.value(0);
  const showOwner = s.value(0);

  const showPrefix = s.value(0);
  const showHistory = s.value(0);
  const showTotal700 = s.value(0);
  const showSeparate = s.value(0);

  const showReq200 = s.value(0);
  const showBal150 = s.value(0);
  const showParallel = s.value(0);
  const showCompact = s.value(0);

  const eq = glowTex('\\text{Total} = n h + s\\,\\frac{n(n-1)}{2} = 4(100) + 50(6) = 700', {
    x: 380,
    y: -405,
    size: 32,
    color: COSMOS.gold,
    glow: 6,
  });

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        // Stage 1: Retry amplification dot lattices (1 layer = 3, 2 layers = 9, 3 layers = 64)
        nodes.push(
          txt(
            'STACKED RETRY LAYERS MULTIPLY WIRE SENDS',
            0,
            -275,
            28,
            ROLE.mark,
            'mono',
            'center',
          ).opacity(alpha),
        );

        // Panel A: 1 layer = 3 attempts (x = -590)
        const aX = -590;
        const baseY = 15;
        const aOp = Math.max(0.55, show3.value) * alpha;
        nodes.push(txt('1 LAYER: 3', aX, -180, 28, ROLE.sure, 'mono', 'center').opacity(aOp));
        for (let i = 0; i < 3; i++) {
          nodes.push(
            glowDot(aX - 60 + i * 60, baseY, {
              radius: 13,
              color: ROLE.sure,
              glow: 10,
              opacity: aOp,
            }),
          );
        }
        nodes.push(
          txt('1 call + 2 retries', aX, 175, 26, COSMOS.muted, 'sans', 'center').opacity(aOp),
        );

        // Panel B: 2 layers = 3 x 3 = 9 (x = -110)
        const bX = -110;
        const bOp = Math.max(0.3, show9.value) * alpha;
        nodes.push(
          txt('2 LAYERS: 3 x 3 = 9', bX, -180, 28, ROLE.mark, 'mono', 'center').opacity(bOp),
        );
        for (let r = 0; r < 3; r++) {
          for (let col = 0; col < 3; col++) {
            nodes.push(
              glowDot(bX - 58 + col * 58, baseY - 58 + r * 58, {
                radius: 11,
                color: ROLE.mark,
                glow: 9,
                opacity: bOp,
              }),
            );
          }
        }
        nodes.push(txt('9 transport sends', bX, 175, 26, ROLE.mark, 'sans', 'center').opacity(bOp));

        // Panel C: 3 layers = 4^3 = 64 (x = 490)
        const cX = 490;
        const cOp = Math.max(0.25, show64.value) * alpha;
        nodes.push(
          txt('3 LAYERS: 4^3 = 64', cX, -180, 28, ROLE.fail, 'mono', 'center').opacity(cOp),
        );
        for (let r = 0; r < 8; r++) {
          for (let col = 0; col < 8; col++) {
            nodes.push(
              glowDot(cX - 112 + col * 32, baseY - 112 + r * 32, {
                radius: 6.5,
                color: ROLE.fail,
                glow: 6,
                opacity: cOp,
              }),
            );
          }
        }
        nodes.push(
          txt('64 possible wire sends', cX, 175, 26, ROLE.fail, 'sans', 'center').opacity(cOp),
        );

        nodes.push(
          txt(
            showOwner.value > 0.5
              ? 'Give one layer retry ownership; every model re-ask is a new proposal.'
              : 'Each dot is a transport send the stacked configuration allows.',
            0,
            315,
            27,
            showOwner.value > 0.5 ? ROLE.sure : COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (st === 1) {
        // Stage 2: Cumulative Prompt Token Staircase (100, 150, 200, 250 = 700)
        nodes.push(
          txt(
            'CONTEXT WINDOW (1 CALL) VS CUMULATIVE RUN SPEND (4 TURNS)',
            0,
            -275,
            27,
            ROLE.agent,
            'mono',
            'center',
          ).opacity(alpha),
        );

        const turns = [
          { n: 1, prefix: 100, hist: 0, total: 100 },
          { n: 2, prefix: 100, hist: 50, total: 150 },
          { n: 3, prefix: 100, hist: 100, total: 200 },
          { n: 4, prefix: 100, hist: 150, total: 250 },
        ];
        const barW = 148;
        const gap = 64;
        const startX = -595;
        const baseY = 190;
        const pxPerTok = 1.35;

        for (let i = 0; i < turns.length; i++) {
          const t = turns[i];
          const cx = startX + i * (barW + gap);
          const pH = t.prefix * pxPerTok;
          const hH = t.hist * pxPerTok;
          const pOp = Math.max(0.55, showPrefix.value) * alpha;
          const hOp = Math.max(0.25, showHistory.value) * alpha;

          // Fixed 100-token prefix block (gray/slate)
          nodes.push(
            rect(barW, pH, {
              radius: 8,
              fill: hexAlpha('#6b7da3', 0.35 * pOp),
              stroke: '#8ea2cc',
              width: 2.5,
            }).at(cx, baseY - pH / 2),
            txt('100', cx, baseY - pH / 2, 26, COSMOS.ink, 'mono', 'center').opacity(pOp),
          );

          // Growing 50-token blue history blocks stacked above prefix
          const blocks = t.hist / 50;
          for (let b = 0; b < blocks; b++) {
            const bH = 50 * pxPerTok;
            const by = baseY - pH - b * bH - bH / 2 - 4;
            nodes.push(
              rect(barW, bH - 6, {
                radius: 6,
                fill: hexAlpha(ROLE.agent, 0.32 * hOp),
                stroke: ROLE.agent,
                width: 2.4,
              })
                .at(cx, by)
                .glow(6, ROLE.agent),
              txt('+50', cx, by, 26, ROLE.agent, 'mono', 'center').opacity(hOp),
            );
          }

          nodes.push(
            txt(`Turn ${t.n}`, cx, baseY + 34, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
            txt(
              `${t.total} tok`,
              cx,
              baseY - pH - hH - 36,
              28,
              ROLE.mark,
              'mono',
              'center',
            ).opacity(Math.max(pOp, hOp)),
          );
        }

        // Right-side cumulative readout (wide clearance right of Turn 4)
        const sumX = 530;
        nodes.push(
          glowPill(
            showTotal700.value > 0.4 ? 'TOTAL = 700 INPUT' : 'SUMMING 4 TURNS',
            sumX,
            -55,
            ROLE.mark,
            { size: 28, alpha: Math.max(0.45, showTotal700.value) * alpha },
          ),
          txt('100 + 150 + 200 + 250', sumX, 20, 26, COSMOS.ink, 'mono', 'center').opacity(
            Math.max(0.45, showTotal700.value) * alpha,
          ),
          txt(
            showSeparate.value > 0.4
              ? 'Outputs + cache priced separately'
              : 'Prefix paid every turn',
            sumX,
            90,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
          txt(
            'Each turn replays the fixed prefix plus every prior history block.',
            0,
            315,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 3: Atomic Conservative Reservation (120 + 80 = 200 > 150 remaining)
        nodes.push(
          txt(
            'RESERVE WORST-CASE (INPUT + MAX OUTPUT) BEFORE DISPATCH',
            0,
            -275,
            27,
            ROLE.fail,
            'mono',
            'center',
          ).opacity(alpha),
        );

        // Remaining run balance meter (150 tokens)
        const barX = -680;
        const barW = 1360;
        nodes.push(
          txt(
            'REMAINING RUN BALANCE: 150 TOKENS',
            barX,
            -150,
            26,
            ROLE.sure,
            'mono',
            'left',
          ).opacity(alpha),
          glowBar(barX, -95, barW, 44, 150 / 220, ROLE.sure, { alpha }),
          txt(
            '150 left',
            barX + (barW * 150) / 220 - 10,
            -95,
            26,
            COSMOS.bg,
            'mono',
            'right',
          ).opacity(alpha),
        );

        // Proposed request conservative reservation (120 input + 80 output = 200 tokens)
        const reqOp = Math.max(0.45, showReq200.value) * alpha;
        nodes.push(
          txt(
            'NEXT CALL RESERVATION: 120 INPUT + 80 MAX OUTPUT = 200 TOKENS',
            barX,
            20,
            26,
            ROLE.fail,
            'mono',
            'left',
          ).opacity(reqOp),
          glowBar(barX, 75, barW, 44, 200 / 220, ROLE.fail, { alpha: reqOp }),
          txt(
            '200 needed (> 150 -> REJECTED)',
            barX + (barW * 200) / 220 - 12,
            75,
            26,
            COSMOS.ink,
            'mono',
            'right',
          ).opacity(Math.max(0.4, showBal150.value) * alpha),
        );

        // Policy notes below
        nodes.push(
          glowPill('Parallel: atomic balance', -575, 210, ROLE.agent, {
            size: 26,
            alpha: Math.max(0.4, showParallel.value) * alpha,
          }),
          glowPill('Timeout: hold reserve', 10, 210, ROLE.mark, {
            size: 26,
            alpha: Math.max(0.4, showParallel.value) * alpha * (0.85 + 0.15 * pulse),
          }),
          glowPill('Compaction: future only', 585, 210, ROLE.violet, {
            size: 26,
            alpha: Math.max(0.4, showCompact.value) * alpha,
          }),
          txt(
            'After local cancellation, still reconcile remote work and actual billed usage.',
            0,
            320,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(Math.max(0.5, showCompact.value) * alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'RETRY BOUNDS · QUADRATIC HISTORY · ATOMIC SPEND',
          st === 0
            ? '3 -> 9 -> 64 AMPLIFICATION'
            : st === 1
              ? '4 TURNS = 700 INPUT TOKENS'
              : '200 > 150 -> BLOCK DISPATCH',
          { accent: st === 2 ? ROLE.fail : ROLE.mark, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.mark, ROLE.fail), title, eq, layer);

  playCue(s, c, 'three-attempts', (d) => s.play(show3.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'two-layers', (d) => s.play(show9.to(0.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'retry-layers', (d) => s.play(show9.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'three-layers', (d) => s.play(show64.to(0.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'retry-cube', (d) => s.play(show64.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'possible-bounds', (d) => s.play(show64.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'one-owner', (d) => s.play(showOwner.to(0.7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 're-ask', (d) => s.play(showOwner.to(1, { duration: d })), { dur: 0.4 });

  playCue(
    s,
    c,
    'window-vs-run',
    (d) => s.play(stage.to(1, { duration: 0.15 }), showPrefix.to(0.5, { duration: d })),
    {
      dur: 0.45,
    },
  );
  playCue(s, c, 'cumulative', (d) => s.play(showPrefix.to(0.8, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'prefix', (d) => s.play(showPrefix.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'added', (d) => s.play(showHistory.to(0.7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'token-prompts', (d) => s.play(showHistory.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'token-total', (d) => s.play(showTotal700.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'formula', (d) => s.play(showPrefix.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'history-blocks', (d) => s.play(showHistory.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'separate-accounting', (d) => s.play(showSeparate.to(1, { duration: d })), {
    dur: 0.4,
  });

  playCue(
    s,
    c,
    'reserve-first',
    (d) => s.play(stage.to(2, { duration: 0.15 }), showReq200.to(0.6, { duration: d })),
    {
      dur: 0.45,
    },
  );
  playCue(s, c, 'request-size', (d) => s.play(showReq200.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'reserve-total', (d) => s.play(showBal150.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'parallel', (d) => s.play(showParallel.to(0.7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'ambiguous', (d) => s.play(showParallel.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'compaction', (d) => s.play(showCompact.to(0.7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'cancel', (d) => s.play(showCompact.to(1, { duration: d })), { dur: 0.4 });
}
