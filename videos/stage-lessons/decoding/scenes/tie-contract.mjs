// Scene 16: tie-contract: "Exact counts and score thresholds have different tie behavior"
// Ranks [2, 2, 2, 0] with stable token IDs 0..3. Contrasts exact count k = 1 (ID 0 only)
// against score-threshold k = 1 (retaining all three tied leaders AFTER dec-threshold-ties),
// then reveals normalized supports [1, 0, 0, 0] vs [1/3, 1/3, 1/3, 0] AFTER dec-tie-normalized.
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, glowVector, lumBar, playCue } from '../parts.mjs';

export default function tieContract(s, c) {
  const title = heroTitle(['Exact count vs', 'score-threshold ties'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.active,
  });

  const showThresh = s.value(0);
  const showNorm = s.value(0);
  const showShape = s.value(0);
  const stageVis = s.value(1);

  const logits = [2, 2, 2, 0];

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const th = showThresh.value > 0.4;
    const nm = showNorm.value > 0.4;
    const sh = showShape.value;

    // Top row: 4 logits [2, 2, 2, 0] with stable IDs
    const topXs = [-450, -150, 150, 450];
    const topY = -215;
    nodes.push(
      txt('Raw logits with stable token IDs', 0, -295, 28, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
    );

    logits.forEach((z, i) => {
      const col = z === 2 ? ROLE.winner : COSMOS.dim;
      nodes.push(
        lumBar(topXs[i], topY, 210, 74, {
          color: col,
          fillOpacity: z === 2 ? 0.24 : 0.1,
          strokeWidth: 2.4,
          glow: z === 2 ? 9 : 2,
          radius: 10,
          opacity: alpha,
        }),
        txt(`ID ${i} : ${z}`, topXs[i], topY, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    });

    // Fork arrows down to Left (Exact k = 1) and Right (Threshold k = 1)
    nodes.push(
      glowVector([-180, -162], [-435, -75], {
        color: ROLE.base,
        width: 4,
        glow: 8,
        opacity: alpha,
      }),
      glowVector([180, -162], [435, -75], {
        color: ROLE.active,
        width: 4,
        glow: 8,
        opacity: alpha,
      }),
      txt('Exact count  k = 1', -435, -35, 34, ROLE.base, 'mono', 'center').opacity(alpha),
      txt('Score threshold  k = 1 (z >= z_k)', 435, -35, 34, ROLE.active, 'mono', 'center').opacity(
        alpha,
      ),
    );

    // 4 slots under each branch
    logits.forEach((z, i) => {
      const lx = -705 + i * 180;
      const keepL = i === 0;
      nodes.push(
        lumBar(lx, 80, 156, 92, {
          color: keepL ? ROLE.base : COSMOS.dim,
          fillOpacity: keepL ? 0.34 : 0.08,
          strokeWidth: keepL ? 2.8 : 1.5,
          glow: keepL ? 10 : 2,
          radius: 10,
          opacity: (keepL ? 1 : 0.42) * alpha,
        }),
        txt(
          keepL ? `keep ${i}` : `drop ${i}`,
          lx,
          80,
          28,
          keepL ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );

      const rx = 165 + i * 180;
      const keepR = th && z >= 2;
      nodes.push(
        lumBar(rx, 80, 156, 92, {
          color: keepR ? ROLE.active : COSMOS.dim,
          fillOpacity: keepR ? 0.36 : 0.08,
          strokeWidth: keepR ? 2.8 : 1.5,
          glow: keepR ? 10 : 2,
          radius: 10,
          opacity: (th ? (keepR ? 1 : 0.42) : 0.7) * alpha,
        }),
        txt(
          th ? (keepR ? `keep ${i}` : `drop ${i}`) : '?',
          rx,
          80,
          28,
          keepR ? COSMOS.ink : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // Normalized supports (revealed AFTER dec-tie-normalized)
    nodes.push(
      txt(
        nm ? 'Normalized: [ 1 , 0 , 0 , 0 ]' : 'Normalized support pending',
        -435,
        225,
        30,
        nm ? ROLE.base : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        nm ? 'Normalized: [ 1/3 , 1/3 , 1/3 , 0 ]' : 'Normalized support pending',
        435,
        225,
        30,
        nm ? ROLE.winner : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(nm ? 7 : 0, ROLE.winner)
        .opacity(alpha),
    );

    nodes.push(
      txt(
        sh > 0.3
          ? 'Probability rank alone never verifies factual or grammatical validity.'
          : 'Keep token IDs stable when sorting; declare the exact tie rule.',
        0,
        380,
        30,
        sh > 0.3 ? ROLE.heat : COSMOS.muted,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.base, ROLE.active), title, mainLayer);

  playCue(s, c, 'dec-tie-contract-1', (d) => s.play(showThresh.to(0.1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'dec-threshold-ties', (d) => s.play(showThresh.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'dec-tie-contract-2', (d) => s.play(showNorm.to(0.1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'dec-tie-normalized', (d) => s.play(showNorm.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'dec-tie-contract-3', (d) => s.play(showShape.to(1, { duration: d })), {
    dur: 0.65,
  });
}
