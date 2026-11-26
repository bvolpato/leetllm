// Scene 11: windows: "Reuse context while scoring each target once"
// Full-width 10-word document timeline ("The little cat slept by the warm fire all evening")
// with a glowing sliding context-window aperture wave (W1 -> W2 -> W3), unique target
// ownership beams (9 distinct scored positions), and a Beat 2 causal-shift arc (8 -> 9).
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import { ROLE, arcPts, cinemaAtmosphere, lumBar, playCue, windows, words } from '../parts.mjs';

export default function windowsScene(s, c) {
  const title = heroTitle(['Reuse context while', 'scoring each target once'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.prob,
  });

  const winIdx = s.value(0); // 0 -> 1 -> 2 smoothly slides aperture across W1, W2, W3
  const ctxFocus = s.value(0); // highlights position 0 context-only
  const reuseFocus = s.value(0); // highlights masked reused context in W2
  const causalArc = s.value(0); // Beat 2: arc from position 8 ("all") -> position 9 ("evening")
  const maskNote = s.value(0);

  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const wi = Math.max(0, Math.min(2, winIdx.value));
    const shownCount = wi >= 1.65 ? 3 : wi >= 0.55 ? 2 : 1;

    // Interpolate sliding aperture bounds smoothly
    const loIdx = Math.floor(wi);
    const hiIdx = Math.min(2, loIdx + 1);
    const frac = wi - loIdx;
    const curBegin = windows[loIdx][0] + (windows[hiIdx][0] - windows[loIdx][0]) * frac;
    const curEnd = windows[loIdx][1] + (windows[hiIdx][1] - windows[loIdx][1]) * frac;

    const left = -760;
    const stepX = 168;
    const tokenY = -125;
    const ownerY = 175;
    const wCols = [ROLE.good, ROLE.masked, ROLE.observed];

    // Sliding glowing context-window aperture (horizontal top & bottom rails so NO vertical stroke ever crosses word text!)
    const apLeft = left + curBegin * stepX - 74;
    const apRight = left + (curEnd - 1) * stepX + 74;
    nodes.push(
      glowingTrail(
        [
          [apLeft, tokenY - 56],
          [apRight, tokenY - 56],
        ],
        { color: ROLE.prob, width: 4.5, glow: 12, opacity: alpha },
      ),
      glowingTrail(
        [
          [apLeft, tokenY + 84],
          [apRight, tokenY + 84],
        ],
        { color: ROLE.prob, width: 4.5, glow: 12, opacity: alpha },
      ),
      glowDot(apLeft, tokenY - 56, { radius: 6, color: ROLE.prob, glow: 10, opacity: alpha }),
      glowDot(apRight, tokenY - 56, { radius: 6, color: ROLE.prob, glow: 10, opacity: alpha }),
      glowDot(apLeft, tokenY + 84, { radius: 6, color: ROLE.prob, glow: 10, opacity: alpha }),
      glowDot(apRight, tokenY + 84, { radius: 6, color: ROLE.prob, glow: 10, opacity: alpha }),
      txt(
        `Window ${shownCount} reads positions ${windows[shownCount - 1][0]}..${windows[shownCount - 1][1] - 1}`,
        (apLeft + apRight) / 2,
        tokenY - 96,
        28,
        ROLE.prob,
        'mono',
        'center',
      )
        .glow(6, ROLE.prob)
        .opacity(alpha),
    );

    // 10 document tokens along the main ruler
    const activeW = windows[shownCount - 1];
    words.forEach((word, i) => {
      const tx = left + i * stepX;
      const inView = i >= activeW[0] && i < activeW[1];
      const isReused = inView && i < activeW[2];
      const isScoredNow = i >= activeW[2] && i < activeW[3];
      const revealed = i < activeW[1];

      const tCol = isScoredNow
        ? wCols[shownCount - 1]
        : isReused
          ? ROLE.context
          : inView
            ? ROLE.context
            : COSMOS.dim;

      nodes.push(
        txt(revealed ? word : '?', tx, tokenY, 32, tCol, 'serif', 'center').opacity(
          (revealed ? 1 : 0.4) * alpha,
        ),
        txt(String(i), tx, tokenY + 46, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      );
    });

    // Context-only tag under position 0 ("The")
    nodes.push(
      txt(
        'context only',
        left,
        ownerY,
        26,
        ctxFocus.value > 0.3 ? ROLE.context : COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Unique target ownership slots (positions 1..9)
    let distinctTotal = 0;
    for (let r = 0; r < shownCount; r++) {
      const [, , sBegin, sEnd] = windows[r];
      const col = wCols[r];
      distinctTotal += sEnd - sBegin;
      for (let i = sBegin; i < sEnd; i++) {
        const tx = left + i * stepX;
        nodes.push(
          lumBar(tx, ownerY, 134, 72, {
            color: col,
            fillOpacity: 0.36,
            strokeWidth: 2.5,
            glow: 9,
            radius: 10,
            opacity: alpha,
          }),
          txt(`W${r + 1}`, tx, ownerY, 30, col, 'mono', 'center').opacity(alpha),
        );
      }
    }

    // Reused context masking banner (strictly mutually exclusive with Beat 2 causal-shift text!)
    const ca = causalArc.value;
    if (reuseFocus.value > 0.1 && shownCount >= 2 && ca < 0.04) {
      nodes.push(
        txt(
          'Reused prefix tokens: read by attention, masked (-100) from loss',
          0,
          48,
          28,
          ROLE.context,
          'mono',
          'center',
        ).opacity(reuseFocus.value * alpha),
      );
    }

    // Beat 2: Causal shift arc from logit 8 ("all") -> target label 9 ("evening")
    if (ca >= 0.04) {
      const x8 = left + 8 * stepX;
      const x9 = left + 9 * stepX;
      const arc = arcPts([x8, tokenY + 96], [x9, tokenY + 96], 52, 22);
      const nPts = Math.max(2, Math.round(arc.length * ca));
      nodes.push(
        glowingTrail(arc.slice(0, nPts), {
          color: ROLE.observed,
          width: 4.5,
          glow: 12,
          opacity: alpha,
        }),
        glowDot(x9, tokenY + 96, {
          radius: 7,
          color: ROLE.observed,
          glow: 12,
          opacity: ca * alpha,
        }),
        txt(
          'Logits at 8 ("all") predict label 9 ("evening"): count valid labels AFTER shift',
          0,
          48,
          28,
          ROLE.observed,
          'mono',
          'center',
        )
          .glow(6, ROLE.observed)
          .opacity(ca * alpha),
      );
    }

    // Bottom running distinct-target tally
    nodes.push(
      txt(
        `Distinct scored targets: ${distinctTotal}  (each scored exactly once)`,
        0,
        305,
        38,
        ROLE.observed,
        'mono',
        'center',
      )
        .glow(8, ROLE.observed)
        .opacity(alpha),
      txt(
        maskNote.value > 0.4
          ? 'Context attention masks and target loss masks serve separate roles.'
          : 'No BOS prefix here: position 0 seeds context while positions 1..9 enter loss.',
        0,
        385,
        28,
        COSMOS.muted,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.prob, ROLE.good), title, mainLayer);

  // Beat 0: Window 1 (0..4, scores 1..4), highlight position 0 context-only
  playCue(s, c, 'windows-beat-1-focus-1', (d) => s.play(winIdx.to(0, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'windows-beat-1-focus-2', (d) => s.play(ctxFocus.to(1, { duration: d })), {
    dur: 0.55,
  });

  // Beat 1: Slide to Window 2 -> highlight reused masked context -> slide to Window 3 (total = 9)
  playCue(s, c, 'windows-beat-2-focus-1', (d) => s.play(winIdx.to(1, { duration: d })), {
    dur: 0.75,
  });
  playCue(s, c, 'windows-beat-2-focus-2', (d) => s.play(reuseFocus.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'windows-final-targets', (d) => s.play(winIdx.to(2, { duration: d })), {
    dur: 0.75,
  });

  // Beat 2: Causal shift arc & mask distinction
  playCue(s, c, 'windows-beat-3-focus-1', (d) => s.play(causalArc.to(1, { duration: d })), {
    dur: 0.7,
  });
  playCue(s, c, 'windows-beat-3-focus-2', (d) => s.play(maskNote.to(1, { duration: d })), {
    dur: 0.55,
  });
}
