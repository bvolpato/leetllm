// Scene 6: placement: "Which vector gets normalized?"
// Twin glowing parallel residual highways (Pre-LN upper vs Post-LN lower) tracing start=[1,2,4,8]
// through F(z)=0.2z+0.1. Strictly withholds Post-LN's normalized output sign ("Negative") until
// AFTER the spoken "post-sign" cue, then propagates both routes into Block 2 showing stream drift.
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  fmt,
  lumBar,
  mean,
  placementTrace,
  playCue,
  scenePulse,
} from '../parts.mjs';

export default function placement(s, c) {
  const b1 = placementTrace();
  const b2Pre = placementTrace(b1.pre[3]).pre;
  const b2Post = placementTrace(b1.post[3]).post;

  const title = heroTitle(['Which vector', 'gets normalized?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.write,
  });

  // Reactive stage progress values
  const preStep = s.value(0); // 0 -> 1 (LN) -> 2 (F) -> 3 (Add)
  const postStep = s.value(0); // 0 -> 1 (F) -> 2 (Add) -> 3 (LN, strictly AFTER post-sign!)
  const signReveal = s.value(0); // 0 -> 1 reveals "Negative" verdict AFTER post-sign
  const block2T = s.value(0); // 0 -> 1 switches to Block 2
  const pulse = s.value(0);
  const stageVis = s.value(1);

  const cols = [-525, -125, 275, 675];
  const preLabels = ['Token', 'LayerNorm', 'Branch F', 'Add skip'];
  const postLabels = ['Token', 'Branch F', 'Add skip', 'LayerNorm'];

  function drawMiniBars(nodes, vals, cx, baseY, alpha) {
    vals.forEach((v, i) => {
      const bx = cx + (i - 1.5) * 62;
      const barH = Math.max(4, Math.min(72, Math.abs(v) * 7.2));
      const col = i === 0 ? ROLE.gold : ROLE.write;
      const by = v >= 0 ? baseY - barH / 2 : baseY + barH / 2;
      nodes.push(
        lumBar(bx, by, 34, barH, {
          color: col,
          fillOpacity: i === 0 ? 0.55 : 0.34,
          strokeWidth: 2,
          glow: i === 0 ? 9 : 5,
          radius: 4,
          opacity: alpha,
        }),
      );
    });
    // Single crisp f1 (gold) readout below baseline to avoid cramped 4-number overlaps
    nodes.push(
      txt(`f₁ = ${fmt(vals[0], 2)}`, cx, baseY + 42, 26, ROLE.gold, 'mono', 'center')
        .glow(5, ROLE.gold)
        .opacity(alpha),
    );
  }

  function drawHighway(nodes, kind, baseY, trace, stepVal, showFinal, alpha, p) {
    const isPre = kind === 'pre';
    const labels = isPre ? preLabels : postLabels;
    const addCol = isPre ? 3 : 2;
    const wireY = baseY - 118;

    // Route name at far left
    nodes.push(
      txt(
        isPre ? 'Pre-LN' : 'Post-LN',
        -845,
        baseY - 12,
        34,
        isPre ? ROLE.write : ROLE.rms,
        'sans',
        'left',
      )
        .glow(6, isPre ? ROLE.write : ROLE.rms)
        .opacity(alpha),
    );

    // Blue identity skip wire arcing cleanly overhead
    const skipPts = [
      [cols[0] - 96, baseY - 62],
      [cols[0] - 96, wireY],
      [cols[addCol] + 82, wireY],
      [cols[addCol] + 82, baseY - 62],
    ];
    nodes.push(
      glowingTrail(skipPts, {
        color: ROLE.stream,
        width: 3.6,
        glow: 9,
        opacity: 0.9 * alpha,
      }),
    );
    // Flowing skip photon
    const sf = (p * 2.5 + (isPre ? 0 : 0.5)) % 1;
    const sx = cols[0] - 96 + (cols[addCol] + 82 - (cols[0] - 96)) * sf;
    nodes.push(
      glowDot(sx, wireY, { radius: 5.5, color: ROLE.stream, glow: 12, opacity: 0.85 * alpha }),
    );

    // 4 stage columns
    cols.forEach((cx, i) => {
      const reached = stepVal >= i - 0.05;
      const lockedFinal = !isPre && i === 3 && !showFinal;
      const active = Math.round(stepVal) === i;
      nodes.push(
        txt(
          labels[i],
          cx,
          baseY - 84,
          28,
          active ? COSMOS.ink : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
        line([cx - 122, baseY], [cx + 122, baseY], { stroke: '#495e91', width: 2 }).opacity(alpha),
      );

      if (lockedFinal) {
        if (stepVal >= 1.9) {
          nodes.push(
            txt('?', cx, baseY - 42, 48, ROLE.gold, 'mono', 'center')
              .glow(10, ROLE.gold)
              .opacity(alpha),
          );
        }
      } else if (reached) {
        drawMiniBars(nodes, trace[i], cx, baseY, alpha);
      }

      if (i > 0) {
        const fromX = cols[i - 1] + 132;
        const toX = cx - 132;
        nodes.push(
          arrow([fromX, baseY], [toX, baseY], {
            stroke: stepVal >= i ? ROLE.write : '#475987',
            width: 3,
            tip: 12,
          }).opacity(alpha),
        );
      }
    });
  }

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const preS = preStep.value;
    const postS = postStep.value;
    const sRev = signReveal.value;
    const isB2 = block2T.value > 0.5;
    const p = pulse.value;

    const preTrace = isB2 ? b2Pre : b1.pre;
    const postTrace = isB2 ? b2Post : b1.post;

    // Top-right concise context metadata (no top banner bar)
    nodes.push(
      txt(
        isB2 ? 'Block 2  ·  F(z) = 0.2z + 0.1' : 'Block 1  ·  F(z) = 0.2z + 0.1',
        845,
        -405,
        30,
        isB2 ? ROLE.write : COSMOS.muted,
        'mono',
        'right',
      ).opacity(alpha),
      txt('blue wire = skip   ·   gold = f₁', 845, -360, 26, ROLE.stream, 'mono', 'right').opacity(
        alpha,
      ),
    );

    drawHighway(nodes, 'pre', -110, preTrace, isB2 ? 3 : preS, true, alpha, p);
    drawHighway(nodes, 'post', 205, postTrace, isB2 ? 3 : postS, isB2 || postS >= 2.5, alpha, p);

    // Bottom floating status / prediction prompt / block 2 mean comparison
    let footerText = 'Both routes start from [1, 2, 4, 8]';
    let footerCol = COSMOS.muted;

    if (isB2) {
      footerText = `Block 2 means:   Pre-LN = ${fmt(mean(preTrace[3]), 2)} (needs FinalNorm)   ·   Post-LN = ${fmt(Math.abs(mean(postTrace[3])), 2)}`;
      footerCol = ROLE.norm;
    } else if (postS >= 2.8) {
      footerText = `Post-LN sum mean = ${fmt(mean(postTrace[2]), 1)}  ->  normalized f₁ = ${fmt(postTrace[3][0], 3)}`;
      footerCol = ROLE.gold;
    } else if (sRev > 0.2) {
      footerText = 'Negative!   f₁ = 1.3 lies below the sum mean 4.6';
      footerCol = ROLE.gold;
    } else if (postS >= 1.9) {
      footerText =
        'Sum = [1.3, 2.5, 4.9, 9.7]  ->  After LayerNorm, will f₁ be positive or negative?';
      footerCol = ROLE.gold;
    } else if (preS >= 2.8) {
      footerText = `Pre-LN output f₁ = 1.00 + (-0.11) = +${fmt(preTrace[3][0], 3)} (still positive)`;
      footerCol = ROLE.write;
    }

    nodes.push(
      txt(footerText, 0, 395, 30, footerCol, 'sans', 'center')
        .glow(footerCol === ROLE.gold ? 7 : 0, footerCol)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.stream, ROLE.gold), title, mainLayer);
  scenePulse(s, c, pulse);

  // Beat 1: Upper Pre-LN stages
  playCue(s, c, 'pre-read', (d) => s.play(preStep.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'pre-write', (d) => s.play(preStep.to(2, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'pre-add', (d) => s.play(preStep.to(3, { duration: d })), { dur: 0.65 });

  // Beat 2: Lower Post-LN up to Add (strictly withholds LayerNorm sign!)
  playCue(s, c, 'post-write', (d) => s.play(postStep.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'post-add', (d) => s.play(postStep.to(2, { duration: d })), { dur: 0.65 });

  // Beat 3: Reveal "Negative" strictly AFTER post-sign, then normalize on post-normalize
  playCue(s, c, 'post-sign', (d) => s.play(signReveal.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'post-normalize', (d) => s.play(postStep.to(3, { duration: d })), {
    after: true,
    dur: 0.7,
  });

  // Beat 4: Propagate into Block 2 showing Pre-LN mean 3.95 vs Post-LN mean 0.00
  playCue(s, c, 'second-block', (d) => s.play(block2T.to(1, { duration: d })), { dur: 0.7 });
}
