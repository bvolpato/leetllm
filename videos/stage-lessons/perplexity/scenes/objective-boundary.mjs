// Scene 6: objective-boundary: "Conditioning defines the objective"
// View 1 (Beat 0): Causal left-only context vs Masked bidirectional context on target "sat".
// View 2 (Beat 1): Chat transcript response-only scoring contract (attention mask vs loss mask).
// View 3 (Beat 2): Forking path from "The cat sat" showing sampled "on" (p exposed) vs
//   held-out test target "under" (p unknown without teacher-forced logprobs).
import { arrow } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import { ROLE, arcPts, cinemaAtmosphere, lumBar, playCue, swapVis } from '../parts.mjs';

export default function objectiveBoundary(s, c) {
  const title = heroTitle(['Conditioning defines', 'the objective'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.masked,
  });

  const vCompare = s.value(1);
  const vChat = s.value(0);
  const vFork = s.value(0);

  const rightContext = s.value(0); // illuminates right-side words for masked model
  const maskScore = s.value(0); // illuminates assistant-only LOSS +1 in chat view
  const forkReveal = s.value(0); // illuminates unobserved target logprob gap

  // VIEW 1: Causal left-only vs Masked left+right conditioning
  const compareLayer = guardedDynamic(vCompare, (alpha) => {
    const nodes = [];
    const rc = rightContext.value;
    const xs = [-360, -110, 140, 390, 640];
    const words = ['The', 'cat', 'sat', 'on', 'mat'];

    const rows = [
      { name: 'Causal LM', sub: 'left context only', y: -120, col: ROLE.context, masked: false },
      { name: 'Masked LM', sub: 'pseudo-perplexity', y: 155, col: ROLE.masked, masked: true },
    ];

    rows.forEach((row) => {
      nodes.push(
        txt(row.name, -830, row.y - 18, 36, row.col, 'serif', 'left').opacity(alpha),
        txt(row.sub, -830, row.y + 30, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      );

      // Left conditioning beam (always visible on both rows)
      const leftBeam = arcPts([xs[0], row.y - 44], [xs[2] - 18, row.y - 44], -55, 24);
      nodes.push(glowingTrail(leftBeam, { color: row.col, width: 3.6, glow: 9, opacity: alpha }));

      // Right conditioning beam (ONLY on masked row after masked-context!)
      if (row.masked && rc > 0.05) {
        const rightBeam = arcPts([xs[4], row.y - 44], [xs[2] + 18, row.y - 44], -55, 24);
        const nPts = Math.max(2, Math.round(rightBeam.length * rc));
        nodes.push(
          glowingTrail(rightBeam.slice(0, nPts), {
            color: ROLE.masked,
            width: 4.2,
            glow: 11,
            opacity: rc * alpha,
          }),
        );
      }

      words.forEach((w, i) => {
        const isTarget = i === 2;
        const isFuture = i > 2;
        const canRead = i < 2 || (isFuture && row.masked && rc > 0.2);
        const col = isTarget ? ROLE.observed : canRead ? row.col : COSMOS.dim;
        const label = isTarget ? (row.masked ? '[MASK]' : 'sat') : canRead ? w : 'future';
        nodes.push(
          lumBar(xs[i], row.y, 195, 74, {
            color: col,
            fillOpacity: isTarget ? 0.36 : canRead ? 0.24 : 0.08,
            strokeWidth: isTarget ? 3 : 2,
            glow: isTarget ? 12 : canRead ? 7 : 2,
            radius: 10,
            opacity: (canRead || isTarget ? 1 : 0.45) * alpha,
          }),
          txt(label, xs[i], row.y, 30, isTarget ? ROLE.observed : col, 'mono', 'center').opacity(
            (canRead || isTarget ? 1 : 0.5) * alpha,
          ),
        );
      });
    });

    nodes.push(
      txt(
        rc > 0.4
          ? 'Extra right context prevents direct raw causal-vs-masked ranking.'
          : 'Same target word "sat" under two different conditioning rules.',
        0,
        365,
        30,
        ROLE.observed,
        'serif',
        'center',
      )
        .glow(7, ROLE.observed)
        .opacity(alpha),
    );

    return nodes;
  });

  // VIEW 2: Response-only chat contract (context visibility vs loss-mask scoring)
  const chatLayer = guardedDynamic(vChat, (alpha) => {
    const nodes = [];
    const ms = maskScore.value;
    const segments = [
      { name: 'system', read: true, scored: false },
      { name: 'user', read: true, scored: false },
      { name: 'assistant 1', read: true, scored: true },
      { name: 'assistant 2', read: true, scored: true },
      { name: 'padding', read: false, scored: false },
    ];
    const xs = [-660, -330, 0, 330, 660];
    const segY = -65;

    nodes.push(
      txt(
        'Response-only chat scoring: separate context masks from target masks',
        0,
        -225,
        30,
        ROLE.prob,
        'mono',
        'center',
      ).opacity(alpha),
    );

    segments.forEach((seg, i) => {
      const col = seg.scored ? ROLE.good : seg.read ? ROLE.context : COSMOS.dim;
      nodes.push(
        lumBar(xs[i], segY, 275, 86, {
          color: col,
          fillOpacity: seg.scored ? 0.34 : seg.read ? 0.2 : 0.08,
          strokeWidth: seg.scored ? 3 : 2,
          glow: seg.scored ? 11 : 5,
          radius: 10,
          opacity: alpha,
        }),
        txt(seg.name, xs[i], segY, 30, col, 'mono', 'center').opacity(alpha),
        // Attention mask channel
        glowDot(xs[i], 75, {
          radius: 9,
          color: seg.read ? ROLE.context : COSMOS.dim,
          glow: seg.read ? 10 : 2,
          opacity: alpha,
        }),
        txt(
          seg.read ? 'read context' : 'attn masked',
          xs[i],
          122,
          26,
          seg.read ? ROLE.context : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );

      // Loss mask channel (revealed on response-mask)
      const lossCol = ms > 0.3 ? (seg.scored ? ROLE.good : COSMOS.dim) : ROLE.observed;
      const lossTxt = ms > 0.3 ? (seg.scored ? 'LOSS +1' : 'ignored') : 'scored ?';
      nodes.push(
        glowDot(xs[i], 225, {
          radius: 9,
          color: lossCol,
          glow: seg.scored && ms > 0.3 ? 12 : 3,
          opacity: alpha,
        }),
        txt(lossTxt, xs[i], 272, 28, lossCol, 'mono', 'center')
          .glow(seg.scored && ms > 0.3 ? 7 : 0, ROLE.good)
          .opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'Fix the chat template, BOS/EOS rules, and scored spans before comparing.',
        0,
        390,
        30,
        ROLE.observed,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // VIEW 3: Teacher-forced target likelihood vs generation-only path
  const forkLayer = guardedDynamic(vFork, (alpha) => {
    const nodes = [];
    const fr = forkReveal.value;

    const pX = -510;
    const pY = 40;
    const upY = -125;
    const dnY = 205;
    const outX = 415;

    nodes.push(
      lumBar(pX, pY, 540, 96, {
        color: ROLE.context,
        fillOpacity: 0.28,
        strokeWidth: 2.8,
        glow: 10,
        radius: 12,
        opacity: alpha,
      }),
      txt('Supplied prefix: "The cat sat"', pX, pY, 30, COSMOS.ink, 'serif', 'center').opacity(
        alpha,
      ),

      // Upper path: generated continuation
      arrow([pX + 285, pY - 22], [outX - 305, upY], {
        stroke: ROLE.good,
        width: 4,
        tip: 15,
      })
        .glow(8, ROLE.good)
        .opacity(alpha),
      lumBar(outX, upY, 570, 96, {
        color: ROLE.good,
        fillOpacity: 0.28,
        strokeWidth: 2.8,
        glow: 10,
        radius: 12,
        opacity: alpha,
      }),
      txt('Sampled: "on"  (p exposed)', outX, upY, 30, ROLE.good, 'mono', 'center').opacity(alpha),

      // Lower path: held-out test target
      arrow([pX + 285, pY + 22], [outX - 305, dnY], {
        stroke: ROLE.warn,
        width: 4,
        tip: 15,
      })
        .glow(8, ROLE.warn)
        .opacity(alpha),
      lumBar(outX, dnY, 570, 96, {
        color: ROLE.warn,
        fillOpacity: 0.24 + 0.14 * fr,
        strokeWidth: 2.8,
        glow: 10 + 4 * fr,
        radius: 12,
        opacity: alpha,
      }),
      txt(
        fr > 0.35 ? 'Test: "under"  (p hidden!)' : 'Test target: "under"',
        outX,
        dnY,
        30,
        ROLE.warn,
        'mono',
        'center',
      )
        .glow(fr > 0.35 ? 7 : 0, ROLE.warn)
        .opacity(alpha),

      txt(
        'Perplexity requires teacher-forced likelihoods for supplied test targets.',
        0,
        385,
        30,
        ROLE.observed,
        'serif',
        'center',
      )
        .glow(6, ROLE.observed)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.masked, ROLE.context), title, compareLayer, chatLayer, forkLayer);

  // Beat 0: reveal right-side masked context
  playCue(s, c, 'masked-context', (d) => s.play(rightContext.to(1, { duration: d })), {
    dur: 0.75,
  });

  // Beat 1: swap to chat contract, reveal assistant-only loss mask
  c.onBeat(1, () => s.play(swapVis(vCompare, vChat, 0.55)));
  playCue(s, c, 'response-mask', (d) => s.play(maskScore.to(1, { duration: d })), { dur: 0.7 });

  // Beat 2: swap to generation vs teacher-forced target access
  c.onBeat(2, () => s.play(swapVis(vChat, vFork, 0.55)));
  playCue(s, c, 'target-access', (d) => s.play(forkReveal.to(1, { duration: d })), { dur: 0.7 });
}
