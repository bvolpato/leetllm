// Act 1 (Scenes 1 to 6): Sparse routing intuition, softmax scoring, top-2 renormalization,
// weighted vector blending, and architecture-owned gating rules.
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
} from '../../cinematic-kit.mjs';
import {
  BLENDED_OUTPUT,
  EXP_COLORS,
  EXPERT_OUTPUTS,
  ROLE,
  ROUTER_LOGITS,
  ROUTING,
  WALKTHROUGH_HIDDEN,
  arcPts,
  buildExpertRing3d,
  buildSoftmaxSurface3d,
  cinemaAtmosphere,
  clamp,
  fmt,
  glowRing,
  glowVector,
  lerp,
  lumBar,
  pct,
  playCue,
  shareRibbon,
  swapVis,
  vecStr,
  vectorPlane,
  vectorRow,
} from '../parts.mjs';

// ---------------------------------------------------------------------------
// Scene 1: capacity-question: "Where does the router send each token?"
// ---------------------------------------------------------------------------
export function capacityQuestion(s, c) {
  const title = heroTitle(['Where does the router', 'send each token?'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.token,
  });

  const view3d = buildExpertRing3d({ x: 605, y: -305, unit: 54 });

  const pFirstPair = s.value(1); // E1 & E3 connected from first frame
  const pFirstReturn = s.value(0);
  const pKeepAsk = s.value(0); // Beat 1 prediction prompt
  const pNextPair = s.value(0); // WITHHELD until Beat 2 next-pair!
  const pNextReturn = s.value(0);
  const vis = s.value(1);

  const expXs = Array.from({ length: 8 }, (_, i) => -735 + i * 210);
  const expY = 205;
  const tokY = -125;
  const retX = -320;
  const totX = 320;

  const layer = guardedDynamic(vis, (alpha) => {
    const fPair = pFirstPair.value;
    const fRet = pFirstReturn.value;
    const ask = pKeepAsk.value;
    const nPair = pNextPair.value;
    const nRet = pNextReturn.value;
    const nodes = [];

    // Tokens "return" and "total" floating above the 8-expert rack
    nodes.push(
      lumBar(retX, tokY, 270, 74, {
        color: ROLE.token,
        fillOpacity: 0.28,
        strokeWidth: 2.6,
        glow: 10,
        opacity: alpha,
      }),
      txt('return', retX, tokY, 38, COSMOS.ink, 'mono', 'center').opacity(alpha),
      lumBar(totX, tokY, 270, 74, {
        color: nPair > 0.2 ? ROLE.alt : '#5c6f9c',
        fillOpacity: nPair > 0.2 ? 0.3 : 0.16,
        strokeWidth: nPair > 0.2 ? 2.6 : 1.8,
        glow: nPair > 0.2 ? 10 : 3,
        opacity: alpha,
      }),
      txt(
        'total',
        totX,
        tokY,
        38,
        nPair > 0.2 ? COSMOS.ink : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Eight expert weight blocks across the shelf (all 8 stay resident)
    expXs.forEach((ex, i) => {
      const isReturnExp = i === 0 || i === 2;
      const isTotalExp = i === 1 || i === 7;
      const litReturn = isReturnExp && fPair > 0.1;
      const litTotal = isTotalExp && nPair > 0.15;
      const idleWarn = !isReturnExp && ask > 0.15 && nPair < 0.15;

      const col = litTotal ? ROLE.alt : litReturn ? ROLE.token : idleWarn ? ROLE.router : '#556791';
      const fillOp = litTotal || litReturn ? 0.38 : idleWarn ? 0.2 : 0.14;
      const g = litTotal || litReturn ? 10 : idleWarn ? 7 : 2;

      nodes.push(
        lumBar(ex, expY, 152, 118, {
          color: col,
          fillOpacity: fillOp,
          strokeWidth: litTotal || litReturn ? 2.8 : 1.8,
          glow: g,
          radius: 10,
          opacity: alpha,
        }),
        txt(
          `E${i + 1}`,
          ex,
          expY - 12,
          34,
          litTotal || litReturn ? COSMOS.ink : col,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          litTotal ? 'total' : litReturn ? 'return' : idleWarn ? 'idle?' : 'stored',
          ex,
          expY + 30,
          26,
          litTotal || litReturn ? col : idleWarn ? ROLE.router : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // Cyan dispatch & return arcs for "return" -> E1 (0) and E3 (2)
    [0, 2].forEach((idx, k) => {
      const pts = arcPts([retX, tokY + 42], [expXs[idx], expY - 66], k === 0 ? -36 : 26, 26);
      const cut = Math.max(2, Math.round(pts.length * clamp(fPair)));
      nodes.push(
        glowingTrail(pts.slice(0, cut), {
          color: ROLE.token,
          width: 4,
          glow: 9,
          opacity: (nPair > 0.2 ? 0.42 : 0.92) * alpha,
        }),
      );
      if (fRet > 0.05) {
        const retPts = arcPts([expXs[idx], expY - 66], [retX, tokY + 42], k === 0 ? 44 : -40, 26);
        const rCut = Math.max(2, Math.round(retPts.length * clamp(fRet)));
        const tip = retPts[rCut - 1];
        nodes.push(
          glowingTrail(retPts.slice(0, rCut), {
            gradientColors: [ROLE.token, ROLE.active],
            width: 3.4,
            glow: 9,
            opacity: (nPair > 0.2 ? 0.35 : 0.88) * alpha,
          }),
          glowDot(tip[0], tip[1], {
            radius: 6,
            color: ROLE.active,
            glow: 11,
            opacity: (nPair > 0.2 ? 0.35 : 1) * alpha,
          }),
        );
      }
    });

    // Violet dispatch & return arcs for "total" -> E2 (1) and E8 (7) (WITHHELD until next-pair!)
    if (nPair > 0.04) {
      [1, 7].forEach((idx, k) => {
        const pts = arcPts([totX, tokY + 42], [expXs[idx], expY - 66], k === 0 ? -42 : 34, 28);
        const cut = Math.max(2, Math.round(pts.length * clamp(nPair)));
        nodes.push(
          glowingTrail(pts.slice(0, cut), {
            color: ROLE.alt,
            width: 4.2,
            glow: 10,
            opacity: 0.94 * alpha,
          }),
        );
        if (nRet > 0.05) {
          const retPts = arcPts([expXs[idx], expY - 66], [totX, tokY + 42], k === 0 ? 42 : -36, 28);
          const rCut = Math.max(2, Math.round(retPts.length * clamp(nRet)));
          const tip = retPts[rCut - 1];
          nodes.push(
            glowingTrail(retPts.slice(0, rCut), {
              gradientColors: [ROLE.alt, ROLE.overflow],
              width: 3.6,
              glow: 10,
              opacity: 0.92 * alpha,
            }),
            glowDot(tip[0], tip[1], { radius: 6, color: ROLE.overflow, glow: 12, opacity: alpha }),
          );
        }
      });
    }

    // Bottom status / prediction prompt (mutually exclusive states, zero overlap)
    if (nPair > 0.25) {
      nodes.push(
        txt(
          'Keep all 8 stored  ·  total lights E2 + E8  ·  2 active per token',
          0,
          365,
          32,
          ROLE.alt,
          'mono',
          'center',
        )
          .glow(7, ROLE.alt)
          .opacity(clamp((nPair - 0.25) / 0.75) * alpha),
      );
    } else if (ask > 0.25) {
      nodes.push(
        txt(
          '6 experts sat idle for return. Can we discard their weights before total?',
          0,
          365,
          32,
          ROLE.router,
          'serif',
          'center',
        )
          .glow(7, ROLE.router)
          .opacity(clamp((ask - 0.25) / 0.75) * alpha),
      );
    } else {
      nodes.push(
        txt(
          fRet > 0.5
            ? 'return blends weighted E1 + E3  ·  6 other experts idle'
            : '8 experts stored in memory  ·  return activates E1 and E3',
          0,
          365,
          30,
          ROLE.token,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.token, ROLE.alt), title, view3d, layer);
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.96, distance: 14.2 });

  playCue(s, c, 'first-pair', (d) => s.play(pFirstPair.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'first-return', (d) => s.play(pFirstReturn.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'keep-weights', (d) => s.play(pKeepAsk.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'next-pair', (d) => s.play(pNextPair.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'next-return', (d) => s.play(pNextReturn.to(1, { duration: d })), { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// Scene 2: shared-and-routed: "Open up the feed-forward layer"
// ---------------------------------------------------------------------------
export function sharedAndRouted(s, c) {
  const title = heroTitle(['Open up the', 'feed-forward layer'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.expert,
  });

  const pTok = s.value(0.5);
  const pAttn = s.value(0);
  const pDense = s.value(0);
  const pOpen = s.value(0); // 0 = single dense FFN, 1 = 4 expert lanes
  const pGate = s.value(0);
  const pComb = s.value(0);
  const pRes = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const tk = pTok.value;
    const at = pAttn.value;
    const dn = pDense.value;
    const op = pOpen.value;
    const gt = pGate.value;
    const cm = pComb.value;
    const rs = pRes.value;
    const nodes = [];

    const cy = 65;
    // Input token hidden state
    const inX = -740;
    nodes.push(
      lumBar(inX, cy, 185, 110, {
        color: ROLE.token,
        fillOpacity: 0.24 + 0.18 * tk,
        strokeWidth: 2.6,
        glow: 6 + 6 * tk,
        opacity: alpha,
      }),
      txt('hidden x', inX, cy - 12, 30, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('token t', inX, cy + 28, 26, ROLE.token, 'mono', 'center').opacity(alpha),
    );

    // Shared Attention block
    const attX = -430;
    nodes.push(
      arrow([inX + 102, cy], [attX - 132, cy], {
        stroke: ROLE.token,
        width: 3.4,
        tip: 14,
      }).opacity(alpha),
      lumBar(attX, cy, 240, 150, {
        color: ROLE.expert,
        fillOpacity: 0.2 + 0.22 * at,
        strokeWidth: 2.6,
        glow: 5 + 7 * at,
        opacity: alpha,
      }),
      txt('Shared', attX, cy - 20, 32, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Attention', attX, cy + 24, 32, ROLE.expert, 'sans', 'center').opacity(alpha),
    );

    // Router switch node (appears as pool opens)
    const rtrX = -135;
    nodes.push(
      arrow([attX + 130, cy], [rtrX - 78, cy], {
        stroke: ROLE.expert,
        width: 3.4,
        tip: 14,
      }).opacity(alpha),
      lumBar(rtrX, cy, 134, 118, {
        color: gt > 0.2 ? ROLE.router : ROLE.expert,
        fillOpacity: op > 0.2 ? 0.22 + 0.22 * gt : 0.15,
        strokeWidth: gt > 0.2 ? 2.8 : 2,
        glow: gt > 0.2 ? 10 : 4,
        opacity: alpha,
      }),
      txt(op > 0.35 ? 'Router' : 'norm', rtrX, cy - 10, 28, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        op > 0.35 ? 'top-2' : 'pass',
        rtrX,
        cy + 26,
        26,
        gt > 0.2 ? ROLE.router : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // FFN expanding into 4 expert lanes
    const expX = 240;
    const laneOffsets = [-210, -70, 70, 210];
    const selectedSet = new Set([0, 2]);

    if (op < 0.08) {
      nodes.push(
        arrow([rtrX + 76, cy], [expX - 150, cy], {
          stroke: ROLE.expert,
          width: 3.4,
          tip: 14,
        }).opacity(alpha),
        lumBar(expX, cy, 310, 175, {
          color: ROLE.expert,
          fillOpacity: 0.2 + 0.22 * dn,
          strokeWidth: 2.8,
          glow: 6 + 6 * dn,
          opacity: alpha,
        }),
        txt('Dense FFN', expX, cy - 16, 34, COSMOS.ink, 'sans', 'center').opacity(alpha),
        txt('same for all', expX, cy + 28, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    } else {
      laneOffsets.forEach((off, i) => {
        const ey = cy + off * op;
        const isSel = selectedSet.has(i);
        const lit = isSel && gt > 0.2;
        const col = lit ? EXP_COLORS[i] : '#4e608a';
        // Dispatch wire from router to lane
        nodes.push(
          glowingTrail(arcPts([rtrX + 74, cy], [expX - 134, ey], off * -0.15, 22), {
            color: lit ? col : '#3d4d73',
            width: lit ? 3.8 : 2,
            glow: lit ? 9 : 0,
            core: lit,
            opacity: (lit ? 0.92 : 0.45) * alpha,
          }),
          lumBar(expX, ey, 240, 88, {
            color: col,
            fillOpacity: lit ? 0.36 : 0.14,
            strokeWidth: lit ? 2.8 : 1.7,
            glow: lit ? 10 : 2,
            radius: 9,
            opacity: alpha,
          }),
        );
        if (op > 0.65) {
          nodes.push(
            txt(`Expert ${i + 1}`, expX, ey, 30, lit ? COSMOS.ink : col, 'mono', 'center').opacity(
              clamp((op - 0.65) / 0.35) * alpha,
            ),
          );
        }
        // Combine wire to output node
        if (cm > 0.05 && isSel) {
          const cPts = arcPts([expX + 130, ey], [640 - 115, cy], off * 0.15, 22);
          const cut = Math.max(2, Math.round(cPts.length * clamp(cm)));
          nodes.push(
            glowingTrail(cPts.slice(0, cut), {
              gradientColors: [col, ROLE.token],
              width: 4,
              glow: 9,
              opacity: 0.92 * alpha,
            }),
          );
        }
      });
    }

    // Output / Combine block on right
    const outX = 640;
    nodes.push(
      lumBar(outX, cy, 210, 130, {
        color: cm > 0.2 ? ROLE.token : '#556791',
        fillOpacity: cm > 0.2 ? 0.32 : 0.16,
        strokeWidth: cm > 0.2 ? 2.8 : 1.8,
        glow: cm > 0.2 ? 10 : 3,
        opacity: alpha,
      }),
      txt(
        'Combine',
        outX,
        cy - 16,
        32,
        cm > 0.2 ? COSMOS.ink : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        '+ residual',
        outX,
        cy + 26,
        26,
        rs > 0.2 ? ROLE.active : COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Residual bypass arch over the whole block
    const resPts = [
      [inX, cy - 62],
      [inX, -245],
      [outX, -245],
      [outX, cy - 72],
    ];
    nodes.push(
      glowingTrail(resPts, {
        color: rs > 0.2 ? ROLE.active : '#4b5e8a',
        width: rs > 0.2 ? 4.2 : 2.2,
        glow: rs > 0.2 ? 10 : 2,
        core: rs > 0.2,
        opacity: (rs > 0.2 ? 0.95 : 0.55) * alpha,
      }),
      txt(
        'residual bypass stays intact across every token',
        -50,
        -285,
        28,
        rs > 0.2 ? ROLE.active : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        cm > 0.3
          ? 'Shared attention  ·  routed FFN selects E1 + E3  ·  merges back to residual'
          : op > 0.3
            ? 'FFN opens into 4 parallel experts  ·  router selects per token'
            : 'Transformer block: shared attention followed by dense FFN',
        0,
        395,
        28,
        cm > 0.3 ? ROLE.token : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.expert, ROLE.token), title, layer);

  playCue(s, c, 'hidden-token', (d) => s.play(pTok.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'shared-attention', (d) => s.play(pAttn.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'dense-ffn', (d) => s.play(pDense.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'open-expert-pool', (d) => s.play(pOpen.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'router-choice', (d) => s.play(pGate.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'combine-experts', (d) => s.play(pComb.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'residual-connection', (d) => s.play(pRes.to(1, { duration: d })), { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// Scene 3: router-scores: "Let the hidden state choose a path"
// ---------------------------------------------------------------------------
export function routerScores(s, c) {
  const title = heroTitle(['Let the hidden state', 'choose a path'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.router,
  });

  const eq = glowTex('g(x) = \\operatorname{softmax}(W_g x)', {
    x: 40,
    y: -380,
    size: 40,
    color: ROLE.router,
  });

  const view3d = buildSoftmaxSurface3d({ x: 615, y: -300, unit: 52 });

  const pHidden = s.value(0.5);
  const pLogits = s.value(0);
  const vLogits = s.value(1);
  const vProbs = s.value(0);
  const pProbGrow = s.value(0);
  const pHighlight = s.value(0);

  // Static left-side hidden state + projection skeleton always visible
  const leftLayer = guardedDynamic(s.value(1), (alpha) => {
    const h = pHidden.value;
    const lg = pLogits.value;
    const nodes = [
      txt('hidden state x', -580, -185, 30, ROLE.token, 'mono', 'center').opacity(alpha),
      vectorRow({
        cx: -580,
        cy: -95,
        values: WALKTHROUGH_HIDDEN,
        cellW: 108,
        cellH: 68,
        gap: 10,
        color: ROLE.token,
        digits: 1,
        opacity: (0.45 + 0.55 * h) * alpha,
      }),
      arrow([-580, -45], [-580, 48], {
        stroke: ROLE.router,
        width: 3.4,
        tip: 14,
      }).opacity(alpha),
      lumBar(-580, 128, 360, 118, {
        color: ROLE.router,
        fillOpacity: 0.18 + 0.2 * lg,
        strokeWidth: 2.6,
        glow: 6 + 6 * lg,
        opacity: alpha,
      }),
      txt('Router matrix  W_g', -580, 108, 30, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('4 experts x 4 dims', -580, 152, 26, ROLE.router, 'mono', 'center').opacity(alpha),
      arrow([-386, 128], [-210, 128], {
        stroke: ROLE.router,
        width: 3.6,
        tip: 14,
      }).opacity(alpha),
    ];
    return nodes;
  });

  // View A: Logit bars (negative values growing left from zero axis)
  const logitsLayer = guardedDynamic(vLogits, (alpha) => {
    const lg = pLogits.value;
    const zeroX = 560;
    const scale = 148;
    const nodes = [
      txt('Raw router logits  z = W_g x', 235, -135, 30, ROLE.expert, 'mono', 'center').opacity(
        alpha,
      ),
      line([zeroX, -75], [zeroX, 295], { stroke: '#6074a6', width: 2.4 }).opacity(alpha),
      txt('0.0', zeroX, 330, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
    ];

    ROUTER_LOGITS.forEach((val, i) => {
      const y = -20 + i * 94;
      const bw = Math.max(12, Math.abs(val) * scale * Math.max(0.12, lg));
      const col = EXP_COLORS[i];
      nodes.push(
        txt(`E${i + 1}`, -120, y, 30, col, 'mono', 'right').opacity(alpha),
        lumBar(zeroX - bw / 2, y, bw, 56, {
          color: col,
          fillOpacity: 0.34,
          strokeWidth: 2.4,
          glow: 7,
          radius: 6,
          opacity: alpha,
        }),
        txt(fmt(val, 2), zeroX + 24, y, 28, col, 'mono', 'left').opacity(alpha),
      );
    });
    nodes.push(
      txt(
        'Higher (less negative) logit means stronger router preference',
        210,
        405,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // View B: Softmax probability bars (positive shares summing to 1.000)
  const probsLayer = guardedDynamic(vProbs, (alpha) => {
    const pg = pProbGrow.value;
    const hi = pHighlight.value;
    const zeroX = -65;
    const maxW = 660;
    const nodes = [
      txt(
        'Softmax probabilities  p = softmax(z)  (sum = 1.000)',
        265,
        -135,
        30,
        ROLE.router,
        'mono',
        'center',
      ).opacity(alpha),
      line([zeroX, -75], [zeroX, 295], { stroke: '#6074a6', width: 2.4 }).opacity(alpha),
      txt('0', zeroX, 330, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      txt('0.5', zeroX + maxW * 0.5, 330, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
    ];

    ROUTING.probabilities.forEach((prob, i) => {
      const y = -20 + i * 94;
      const bw = Math.max(12, prob * maxW * Math.max(0.1, pg));
      const isWinner = i === 0 || i === 2;
      const dimOthers = hi > 0.25 && !isWinner;
      const col = EXP_COLORS[i];
      const op = (dimOthers ? 0.36 : 1) * alpha;
      nodes.push(
        txt(`E${i + 1}`, zeroX - 24, y, 30, col, 'mono', 'right').opacity(op),
        lumBar(zeroX + bw / 2, y, bw, 58, {
          color: col,
          fillOpacity: isWinner && hi > 0.25 ? 0.52 : 0.34,
          strokeWidth: isWinner && hi > 0.25 ? 3 : 2.2,
          glow: isWinner && hi > 0.25 ? 12 : 6,
          radius: 6,
          opacity: op,
        }),
        txt(
          `${fmt(prob, 3)} (${pct(prob, 1)})`,
          zeroX + bw + 24,
          y,
          28,
          col,
          'mono',
          'left',
        ).opacity(op),
      );
    });

    nodes.push(
      txt(
        hi > 0.3
          ? 'E1 (blue, 0.521) and E3 (gold, 0.259) hold the top two shares'
          : 'Exponentials turn every logit into a positive share summing to 1',
        230,
        405,
        28,
        hi > 0.3 ? ROLE.router : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(
    cinemaAtmosphere(ROLE.router, ROLE.token),
    title,
    eq,
    view3d,
    leftLayer,
    logitsLayer,
    probsLayer,
  );
  orbitScene(s, c, view3d, { theta: -0.26, phi: 0.94, distance: 14.0 });

  playCue(s, c, 'router-hidden-state', (d) => s.play(pHidden.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'project-router-logits', (d) => s.play(pLogits.to(1, { duration: d })), {
    dur: 0.85,
  });
  playCue(
    s,
    c,
    'router-softmax',
    (d) => s.play(swapVis(vLogits, vProbs, Math.min(0.6, d * 0.45))),
    { dur: 0.6 },
  );
  playCue(s, c, 'expert-probability-shares', (d) => s.play(pProbGrow.to(1, { duration: d })), {
    dur: 0.8,
  });
  playCue(s, c, 'expert-identities', (d) => s.play(pHighlight.to(1, { duration: d })), {
    dur: 0.7,
  });
}

// ---------------------------------------------------------------------------
// Scene 4: top-two: "Keep two paths and rescale their weights"
// ---------------------------------------------------------------------------
export function topTwo(s, c) {
  const title = heroTitle(['Keep two paths,', 'rescale their weights'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.router,
  });

  const eq = glowTex('\\tilde{g}_i = \\frac{p_i}{p_1 + p_3}', {
    x: 520,
    y: -380,
    size: 44,
    color: ROLE.router,
  });

  const pSelect = s.value(0);
  const pDim = s.value(0);
  const pNorm = s.value(0);
  const pUnit = s.value(0);
  const pReadout = s.value(0);
  const pFollow = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const sel = pSelect.value;
    const dim = pDim.value;
    const nrm = pNorm.value;
    const uni = pUnit.value;
    const rd = pReadout.value;
    const fl = pFollow.value;
    const nodes = [];

    // Upper row: 4 expert probability columns preserving their positions
    const colXs = [-540, -180, 180, 540];
    const baseY = 30;
    const maxH = 210;

    nodes.push(line([-720, baseY], [720, baseY], { stroke: '#4d608e', width: 2.2 }).opacity(alpha));

    ROUTING.probabilities.forEach((p, i) => {
      const cx = colXs[i];
      const isWin = i === 0 || i === 2;
      const col = EXP_COLORS[i];
      const barH = Math.max(18, p * maxH * 1.45);
      const op = (!isWin ? 1 - 0.62 * dim : 1) * alpha;
      nodes.push(
        lumBar(cx, baseY - barH / 2, 130, barH, {
          color: col,
          fillOpacity: isWin && sel > 0.2 ? 0.5 : 0.24,
          strokeWidth: isWin && sel > 0.2 ? 3 : 1.8,
          glow: isWin && sel > 0.2 ? 12 : 3,
          opacity: op,
        }),
        txt(`E${i + 1}`, cx, baseY + 38, 30, col, 'mono', 'center').opacity(op),
        txt(
          fmt(p, 3),
          cx,
          baseY - barH - 28,
          28,
          isWin ? COSMOS.ink : col,
          'mono',
          'center',
        ).opacity(op),
        txt(
          isWin
            ? sel > 0.3
              ? 'selected'
              : 'candidate'
            : dim > 0.3
              ? 'stored (idle)'
              : 'candidate',
          cx,
          baseY + 76,
          26,
          isWin ? (sel > 0.3 ? ROLE.active : COSMOS.muted) : COSMOS.dim,
          'mono',
          'center',
        ).opacity(op),
      );
    });

    // Lower conserved unit bar: surviving mass (0.780) expands to normalized unit blend (1.000)
    const barW = 1200;
    const barLeft = -barW / 2;
    const barY = 235;
    const p1 = ROUTING.probabilities[0];
    const p3 = ROUTING.probabilities[2];
    const w1 = ROUTING.weights[0];
    const w3 = ROUTING.weights[1];
    const cur1 = lerp(p1, w1, clamp(nrm));
    const cur3 = lerp(p3, w3, clamp(nrm));
    const w1Px = cur1 * barW;
    const w3Px = cur3 * barW;

    nodes.push(
      lumBar(0, barY, barW, 64, {
        color: '#41537d',
        fillOpacity: 0.22,
        strokeWidth: 2,
        glow: 0,
        radius: 8,
        opacity: alpha,
      }),
      lumBar(barLeft + w1Px / 2, barY, Math.max(12, w1Px - 4), 64, {
        color: EXP_COLORS[0],
        fillOpacity: 0.52,
        strokeWidth: 2.8,
        glow: 10 + 4 * fl,
        radius: 6,
        opacity: alpha,
      }),
      lumBar(barLeft + w1Px + w3Px / 2, barY, Math.max(12, w3Px - 4), 64, {
        color: EXP_COLORS[2],
        fillOpacity: 0.52,
        strokeWidth: 2.8,
        glow: 10 + 4 * fl,
        radius: 6,
        opacity: alpha,
      }),
      txt(
        `E1: ${fmt(cur1, 3)}`,
        barLeft + w1Px / 2,
        barY,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        `E3: ${fmt(cur3, 3)}`,
        barLeft + w1Px + w3Px / 2,
        barY,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        nrm > 0.75
          ? `Renormalized sum = ${fmt(cur1 + cur3, 3)}   (E1 ~ 2/3,  E3 ~ 1/3)`
          : `Surviving mass = ${fmt(p1 + p3, 3)}   (divide by ${fmt(p1 + p3, 3)} to reach 1.000)`,
        0,
        325,
        30,
        uni > 0.3 || rd > 0.3 ? ROLE.active : ROLE.router,
        'mono',
        'center',
      )
        .glow(uni > 0.3 ? 7 : 0, ROLE.active)
        .opacity(alpha),
      txt(
        fl > 0.3
          ? 'Exact weights kept on screen:  g1 = 0.668  ·  g3 = 0.332'
          : 'Mixtral-style top-2: compute only E1 and E3, blend with normalized weights',
        0,
        395,
        28,
        fl > 0.3 ? ROLE.router : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.router, ROLE.active), title, eq, layer);

  playCue(s, c, 'select-top-two', (d) => s.play(pSelect.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'unselected-stored', (d) => s.play(pDim.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'normalize-selected-gates', (d) => s.play(pNorm.to(1, { duration: d })), {
    dur: 0.95,
  });
  playCue(s, c, 'unit-gate-blend', (d) => s.play(pUnit.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'unit-gate-readout', (d) => s.play(pReadout.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'follow-selected-colors', (d) => s.play(pFollow.to(1, { duration: d })), {
    dur: 0.65,
  });
}

// ---------------------------------------------------------------------------
// Scene 5: weighted-output: "Build the output as a weighted vector sum"
// ---------------------------------------------------------------------------
export function weightedOutput(s, c) {
  const title = heroTitle(['Build the output as a', 'weighted vector sum'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.token,
  });

  const eq = glowTex('y = \\tilde{g}_1 E_1(x) + \\tilde{g}_3 E_3(x)', {
    x: 470,
    y: -380,
    size: 42,
    color: ROLE.token,
  });

  const plane = vectorPlane({
    originX: -580,
    originY: 265,
    scaleX: 235,
    scaleY: 165,
    xMin: -0.25,
    xMax: 2.35,
    yMin: -0.25,
    yMax: 3.3,
    xTicks: [0, 1, 2],
    yTicks: [0, 1, 2, 3],
    xLabel: 'c1',
    yLabel: 'c2',
  });

  const pInput = s.value(0.5);
  const pRaw = s.value(0);
  const pScale1 = s.value(0);
  const pScale3 = s.value(0);
  const pJoin = s.value(0);
  const pBlend = s.value(0);
  const vis = s.value(1);

  const w1 = ROUTING.weights[0];
  const w3 = ROUTING.weights[1];
  const e1 = EXPERT_OUTPUTS[0]; // [2, 0]
  const e3 = EXPERT_OUTPUTS[2]; // [0, 3]

  const layer = guardedDynamic(vis, (alpha) => {
    const inp = pInput.value;
    const raw = pRaw.value;
    const sc1 = pScale1.value;
    const sc3 = pScale3.value;
    const jn = pJoin.value;
    const bl = pBlend.value;
    const nodes = [];

    const orig = plane.toScreen(0, 0);
    const len1 = lerp(e1[0], w1 * e1[0], clamp(sc1));
    const len3 = lerp(e3[1], w3 * e3[1], clamp(sc3));

    // Faint ghost of full raw vectors once scaled
    if (raw > 0.1) {
      if (sc1 > 0.1) {
        nodes.push(
          glowVector(orig, plane.toScreen(e1[0], 0), {
            color: EXP_COLORS[0],
            width: 2.2,
            glow: 0,
            opacity: 0.28 * alpha,
            dotRadius: 3,
          }),
        );
      }
      if (sc3 > 0.1) {
        nodes.push(
          glowVector(orig, plane.toScreen(0, e3[1]), {
            color: EXP_COLORS[2],
            width: 2.2,
            glow: 0,
            opacity: 0.28 * alpha,
            dotRadius: 3,
          }),
        );
      }
      // Active E1 arrow (horizontal)
      const tip1 = plane.toScreen(len1 * clamp(raw), 0);
      nodes.push(
        glowVector(orig, tip1, {
          color: EXP_COLORS[0],
          width: 5.5,
          glow: 11,
          opacity: alpha,
        }),
        txt(
          sc1 > 0.5 ? 'w1·E1' : 'E1 [2,0]',
          (orig[0] + tip1[0]) / 2,
          395,
          28,
          EXP_COLORS[0],
          'mono',
          'center',
        ).opacity(alpha),
      );

      // Active E3 arrow (vertical, shifts right to tip1 as jn -> 1)
      const base3 = plane.toScreen(len1 * clamp(jn), 0);
      const tip3 = plane.toScreen(len1 * clamp(jn), len3 * clamp(raw));
      nodes.push(
        glowVector(base3, tip3, {
          color: EXP_COLORS[2],
          width: 5.5,
          glow: 11,
          opacity: alpha,
        }),
        txt(
          sc3 > 0.5 ? 'w3·E3' : 'E3 [0,3]',
          tip3[0] + 20,
          (base3[1] + tip3[1]) / 2,
          28,
          EXP_COLORS[2],
          'mono',
          'left',
        ).opacity(alpha),
      );
    }

    // Diagonal resultant vector
    if (bl > 0.05) {
      const diagTip = plane.toScreen(BLENDED_OUTPUT[0] * bl, BLENDED_OUTPUT[1] * bl);
      nodes.push(
        glowVector(orig, diagTip, {
          color: ROLE.token,
          width: 6,
          glow: 14,
          opacity: alpha,
        }),
      );
      if (bl > 0.7) {
        nodes.push(
          glowRing(diagTip[0], diagTip[1], 13, ROLE.token, {
            width: 3.2,
            glow: 12,
            opacity: alpha,
          }),
          txt(
            `y = ${vecStr(BLENDED_OUTPUT, 3)}`,
            diagTip[0] + 18,
            diagTip[1] - 34,
            28,
            ROLE.token,
            'mono',
            'left',
          )
            .glow(7, ROLE.token)
            .opacity(clamp((bl - 0.7) / 0.3) * alpha),
        );
      }
    }

    // Right side: exact arithmetic breakdown
    const rx = 470;
    nodes.push(
      txt(
        'Shared hidden input x = [1, 0, 0, 0]',
        rx,
        -225,
        28,
        ROLE.token,
        'mono',
        'center',
      ).opacity((0.5 + 0.5 * inp) * alpha),
      lumBar(rx, -110, 650, 88, {
        color: EXP_COLORS[0],
        fillOpacity: 0.16 + 0.18 * sc1,
        strokeWidth: 2.2,
        glow: 5 + 5 * sc1,
        opacity: alpha,
      }),
      txt(
        sc1 > 0.4
          ? `E1:  ${fmt(w1, 3)} x [2, 0]  =  [${fmt(w1 * 2, 3)}, 0.000]`
          : 'E1(x)  =  [2.000, 0.000]',
        rx,
        -110,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      lumBar(rx, 8, 650, 88, {
        color: EXP_COLORS[2],
        fillOpacity: 0.16 + 0.18 * sc3,
        strokeWidth: 2.2,
        glow: 5 + 5 * sc3,
        opacity: alpha,
      }),
      txt(
        sc3 > 0.4
          ? `E3:  ${fmt(w3, 3)} x [0, 3]  =  [0.000, ${fmt(w3 * 3, 3)}]`
          : 'E3(x)  =  [0.000, 3.000]',
        rx,
        8,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      lumBar(rx, 155, 650, 108, {
        color: bl > 0.3 ? ROLE.token : '#4a5c88',
        fillOpacity: bl > 0.3 ? 0.32 : 0.14,
        strokeWidth: bl > 0.3 ? 2.8 : 1.8,
        glow: bl > 0.3 ? 11 : 3,
        opacity: alpha,
      }),
      txt('Combined MoE output', rx, 130, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        bl > 0.35
          ? `[${fmt(BLENDED_OUTPUT[0], 3)},  ${fmt(BLENDED_OUTPUT[1], 3)}]`
          : 'head-to-tail sum',
        rx,
        176,
        36,
        bl > 0.35 ? ROLE.token : COSMOS.dim,
        'mono',
        'center',
      )
        .glow(bl > 0.35 ? 8 : 0, ROLE.token)
        .opacity(alpha),
      txt(
        'Real experts are large nonlinear FFNs; linear maps show the geometry',
        rx,
        310,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.token, ROLE.router), title, eq, plane.node, layer);

  playCue(s, c, 'same-expert-input', (d) => s.play(pInput.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'unweighted-expert-results', (d) => s.play(pRaw.to(1, { duration: d })), {
    dur: 0.75,
  });
  playCue(s, c, 'weight-first-expert', (d) => s.play(pScale1.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'weight-third-expert', (d) => s.play(pScale3.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'join-weighted-arrows', (d) => s.play(pJoin.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'combined-vector', (d) => s.play(pBlend.to(1, { duration: d })), { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// Scene 6: routing-rules: "The gate rule belongs to the architecture"
// ---------------------------------------------------------------------------
export function routingRules(s, c) {
  const title = heroTitle(['The gate rule belongs', 'to the architecture'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.router,
  });

  const pMix = s.value(0.5);
  const pRule = s.value(0);
  const pSw = s.value(0);
  const pLearn = s.value(0);
  const pRetain = s.value(0);
  const pVar = s.value(0);
  const pCount = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const mx = pMix.value;
    const rl = pRule.value;
    const sw = pSw.value;
    const lr = pLearn.value;
    const rt = pRetain.value;
    const vr = pVar.value;
    const ct = pCount.value;
    const nodes = [];

    // Left panel: Mixtral top-2 of 8 normalized
    const lx = -435;
    nodes.push(
      txt('Mixtral  ·  Top-2 of 8', lx, -235, 34, ROLE.expert, 'mono', 'center').opacity(alpha),
      lumBar(lx, -135, 680, 108, {
        color: ROLE.expert,
        fillOpacity: 0.16 + 0.16 * mx,
        strokeWidth: 2.4,
        glow: 6 + 5 * mx,
        opacity: alpha,
      }),
      txt('Normalized pair:  g1 + g3 = 1.000', lx, -152, 28, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),
      txt('0.668 E1(x)  +  0.332 E3(x)', lx, -110, 28, ROLE.token, 'mono', 'center').opacity(alpha),
    );

    // 8 compact expert slots under Mixtral
    for (let i = 0; i < 8; i++) {
      const ex = lx - 280 + i * 80;
      const on = i === 0 || i === 2;
      nodes.push(
        lumBar(ex, 0, 62, 68, {
          color: on ? (i === 0 ? EXP_COLORS[0] : EXP_COLORS[2]) : '#465884',
          fillOpacity: on ? 0.45 : 0.14,
          strokeWidth: on ? 2.6 : 1.6,
          glow: on ? 8 : 0,
          radius: 6,
          opacity: alpha,
        }),
        txt(`E${i + 1}`, ex, 0, 26, on ? COSMOS.ink : COSMOS.dim, 'mono', 'center').opacity(alpha),
      );
    }

    nodes.push(
      txt(
        rl > 0.3 || ct > 0.3
          ? 'Changing k changes the function the checkpoint computes'
          : '4-expert demo is a smaller teaching example of Mixtral',
        lx,
        96,
        26,
        rl > 0.3 || ct > 0.3 ? ROLE.router : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    // Right panel: Switch top-1 retained softmax gate
    const rx = 435;
    const probeP = 0.521 + 0.12 * Math.sin(lr * Math.PI);
    nodes.push(
      txt('Switch  ·  Top-1 retained gate', rx, -235, 34, ROLE.router, 'mono', 'center').opacity(
        alpha,
      ),
      lumBar(rx, -135, 720, 108, {
        color: sw > 0.2 ? ROLE.router : '#4d608e',
        fillOpacity: sw > 0.2 ? 0.26 : 0.14,
        strokeWidth: sw > 0.2 ? 2.6 : 1.8,
        glow: sw > 0.2 ? 9 : 3,
        opacity: alpha,
      }),
      txt(
        `y = p_1(x) · E_1(x)   (p_1 = ${fmt(probeP, 3)})`,
        rx,
        -154,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        rt > 0.3 ? 'Norm to 1 kills task-loss gate grad' : 'Keep raw softmax gate (router learns)',
        rx,
        -108,
        26,
        rt > 0.3 ? ROLE.overflow : ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Continuous gate meter on right
    const meterW = 540;
    const mLeft = rx - meterW / 2;
    const fillW = meterW * probeP;
    nodes.push(
      lumBar(rx, 0, meterW, 52, {
        color: '#3f517a',
        fillOpacity: 0.2,
        strokeWidth: 1.8,
        glow: 0,
        opacity: alpha,
      }),
      lumBar(mLeft + fillW / 2, 0, fillW, 52, {
        color: ROLE.router,
        fillOpacity: 0.48,
        strokeWidth: 2.6,
        glow: 10,
        opacity: alpha,
      }),
      txt(`gate p_1 = ${fmt(probeP, 3)}`, rx, 56, 28, ROLE.router, 'mono', 'center').opacity(alpha),
      txt(
        rt > 0.3 ? 'Do NOT divide p_1 by p_1 when k = 1' : 'Live sensitivity: dy/dp_1 = E_1(x)',
        rx,
        104,
        26,
        rt > 0.3 ? ROLE.overflow : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Common hidden-state bar + architectural variants footer
    nodes.push(
      shareRibbon({
        x: 0,
        y: 235,
        width: 1360,
        height: 52,
        shares: [0.34, 0.33, 0.33],
        colors: [ROLE.expert, ROLE.router, ROLE.active],
        labels: ['Top-k softmax', 'Top-1 retained', 'Shared + bias'],
        opacity: (0.45 + 0.55 * vr) * alpha,
      }),
      txt(
        'Same hidden state x  ·  evaluate answers and cost against the checkpoint contract',
        0,
        395,
        28,
        vr > 0.3 ? ROLE.token : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.router, ROLE.expert), title, layer);

  playCue(s, c, 'mixtral-route', (d) => s.play(pMix.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'trained-routing', (d) => s.play(pRule.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'switch-route', (d) => s.play(pSw.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'gate-learning', (d) => s.play(pLearn.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'retain-gate', (d) => s.play(pRetain.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'architectural-variants', (d) => s.play(pVar.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'selected-count', (d) => s.play(pCount.to(1, { duration: d })), { dur: 0.6 });
}
