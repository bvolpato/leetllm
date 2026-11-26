// Scene 15: candidate-ranking: CLIP relative shares (98% vs 2%) -> duplicate failure candidate -> 49.4% / 49.4%.
import {
  COSMOS,
  RANK_2,
  RANK_3,
  ROLE,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function candidateRanking(s, c) {
  const showWeights = s.value(0);
  const showCopy = s.value(0);
  const revealShare = s.value(0);

  const bgAura = aura(0, 0, 740, '#14325c28', '#2b152a22');
  const title = heroTitle(['What Does the Failure', 'Score Really Measure?'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.warn,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const wVis = showWeights.value;
    const cp = showCopy.value;
    const rev = revealShare.value;

    const p0 = rev > 0.4 ? RANK_3.probabilities[0] : RANK_2.probabilities[0];
    const p1 = rev > 0.4 ? RANK_3.probabilities[2] : RANK_2.probabilities[1];
    const pDup = RANK_3.probabilities[1];
    const pending = cp > 0.3 && rev <= 0.4;

    const barX = -190;
    const maxW = 700;

    const nodes = [
      txt(
        'INCIDENT IMAGE FIXED: SOFTMAX OVER CANDIDATE DESCRIPTIONS',
        -855,
        -220,
        26,
        ROLE.patch,
        'mono',
        'left',
      ).opacity(alpha),

      // Candidate 1: Deploy failed
      txt('1. "Deploy failed"', -855, -110, 28, ROLE.warn, 'mono', 'left').opacity(alpha),
      txt('wt=1.00', -365, -110, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha * (0.35 + 0.65 * wVis),
      ),
      lumBar(
        barX,
        -110,
        Math.max(10, (pending ? 0.5 : p0) * maxW * Math.max(0.2, wVis)),
        38,
        ROLE.warn,
        {
          opacity: alpha * (0.3 + 0.7 * wVis),
          maxTrackW: maxW,
        },
      ),
      txt(
        pending ? '? %' : wVis > 0.2 ? `${(p0 * 100).toFixed(1)}%` : '...',
        barX + maxW + 30,
        -110,
        34,
        pending ? ROLE.pos : ROLE.warn,
        'mono',
        'left',
      ).opacity(alpha),

      // Candidate 2: Deploy succeeded
      txt('2. "Deploy succeeded"', -855, 10, 28, ROLE.patch, 'mono', 'left').opacity(alpha),
      txt('wt=0.02', -365, 10, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha * (0.35 + 0.65 * wVis),
      ),
      lumBar(barX, 10, Math.max(8, p1 * maxW * Math.max(0.2, wVis)), 38, ROLE.patch, {
        opacity: alpha * (0.3 + 0.7 * wVis),
        maxTrackW: maxW,
      }),
      txt(
        pending ? '? %' : wVis > 0.2 ? `${(p1 * 100).toFixed(1)}%` : '...',
        barX + maxW + 30,
        10,
        34,
        ROLE.patch,
        'mono',
        'left',
      ).opacity(alpha),

      // Candidate 3 (duplicate failure): quiet track from t=0, illuminates on candidate-copy
      txt(
        '3. "Deploy failed" (dup)',
        -855,
        130,
        28,
        cp > 0.2 ? ROLE.pos : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.28 + 0.72 * cp)),
      txt('wt=1.00', -365, 130, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha * (0.25 + 0.75 * cp),
      ),
      lumBar(barX, 130, Math.max(8, (rev > 0.4 ? pDup : 0.04) * maxW), 38, ROLE.pos, {
        opacity: alpha * (0.22 + 0.78 * cp),
        maxTrackW: maxW,
      }),
      txt(
        rev > 0.4 ? `${(pDup * 100).toFixed(1)}%` : cp > 0.2 ? '? %' : 'absent',
        barX + maxW + 30,
        130,
        34,
        rev > 0.4 ? ROLE.ok : ROLE.pos,
        'mono',
        'left',
      ).opacity(alpha * (0.28 + 0.72 * cp)),

      // Bottom explanation
      txt(
        rev > 0.4
          ? 'Denominator grew (1 + 1 + 0.02): relative rank score, NOT calibrated probability!'
          : cp > 0.2
            ? 'Same image, same weight 1.00: what share does candidate 1 get now?'
            : 'CLIP dot product x scale -> candidate-relative softmax shares',
        0,
        290,
        30,
        rev > 0.4 ? ROLE.ok : ROLE.pos,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'candidate-towers', (d) => s.play(showWeights.to(0.3, { duration: d })));
  playCue(s, c, 'candidate-weights', (d) => s.play(showWeights.to(1, { duration: d })));
  playCue(s, c, 'candidate-copy', (d) => s.play(showCopy.to(1, { duration: d })));
  // Strict prediction withholding: reveal 49.4% only after candidate-share!
  playCue(s, c, 'candidate-share', (d) => s.play(revealShare.to(1, { duration: d })), {
    after: true,
  });
}
