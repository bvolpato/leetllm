// Scene 04: coverage: p=0.25 -> predict 4-attempt coverage? -> AFTER four-attempts reveal 68.4% (3200 tok), 16->99.0% (12800 tok), selector recall 0.8 -> 54.7% + 3D Frontier!
import {
  COSMOS,
  COV_16,
  COV_4,
  ROLE,
  SEL_4,
  aura,
  buildComputeFrontier3d,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';

export default function coverageScene(s, c) {
  const revealFour = s.value(0); // strictly withheld until AFTER four-attempts!
  const showSixteen = s.value(0);
  const showSelector = s.value(0);

  const bgAura = aura(-240, 0, 720, '#14335c28', '#14383222');
  const title = heroTitle(['Candidate Coverage vs Selection:', '1 - (1 - p)^N & Verifier Recall'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.ok,
  });

  // Orbiting 3D Test-Time Compute Frontier on the right
  const view3d = buildComputeFrontier3d(showSelector, { x: 465, y: 20 });
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.94 });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const r4 = revealFour.value;
    const s16 = showSixteen.value;
    const sel = showSelector.value;

    const barX = -560;
    const maxW = 420;

    const nodes = [
      txt(
        'FIXED PROMPT: p = 0.25 (MISS = 0.75)',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      // 1 attempt
      txt('N = 1 (800t)', -855, -115, 26, ROLE.draft, 'mono', 'left').opacity(alpha),
      lumBar(barX, -115, 0.25 * maxW, 38, ROLE.draft, { opacity: alpha, maxTrackW: maxW }),
      txt('25.0%', barX + maxW + 20, -115, 26, ROLE.draft, 'mono', 'left').opacity(alpha),

      // 4 attempts
      txt('N = 4 (3.2k)', -855, -15, 26, ROLE.ok, 'mono', 'left').opacity(alpha),
      lumBar(barX, -15, r4 > 0.35 ? COV_4 * maxW : 24, 38, ROLE.ok, {
        opacity: alpha * (0.48 + 0.52 * r4),
        maxTrackW: maxW,
      }),
      txt(
        r4 > 0.35 ? `${(COV_4 * 100).toFixed(1)}%` : '? (1-0.75^4)',
        barX + maxW + 20,
        -15,
        26,
        r4 > 0.35 ? ROLE.ok : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      // 16 attempts
      txt('N = 16 (12.8k)', -855, 85, 26, ROLE.gold, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * s16),
      ),
      lumBar(barX, 85, s16 > 0.35 ? COV_16 * maxW : 24, 38, ROLE.gold, {
        opacity: alpha * (0.48 + 0.52 * s16),
        maxTrackW: maxW,
      }),
      txt(
        s16 > 0.35 ? `${(COV_16 * 100).toFixed(1)}%` : '4x tokens',
        barX + maxW + 20,
        85,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * s16)),

      // Selected success (0.8 * 68.4% = 54.7%)
      txt('Sel r=0.8', -855, 185, 26, ROLE.score, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * sel),
      ),
      lumBar(barX, 185, sel > 0.35 ? SEL_4 * maxW : 24, 38, ROLE.score, {
        opacity: alpha * (0.48 + 0.52 * sel),
        maxTrackW: maxW,
      }),
      txt(
        sel > 0.35 ? `${(SEL_4 * 100).toFixed(1)}%` : '0.8 x cov',
        barX + maxW + 20,
        185,
        26,
        ROLE.score,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * sel)),

      chipPill(
        sel > 0.35
          ? 'Returned accuracy = coverage x recall (54.7%)'
          : s16 > 0.35
            ? 'N = 4 -> 68.4%; N = 16 -> 99.0% at 4x cost'
            : r4 > 0.35
              ? 'N = 4 -> 68.4% candidate coverage (3,200 tok)'
              : '4 misses = 0.75^4: what hit share is left?',
        -440,
        290,
        {
          w: 790,
          h: 72,
          color: sel > 0.35 ? ROLE.score : r4 > 0.35 ? ROLE.ok : ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),
      txt(
        sel > 0.35 ? '3D Frontier: Recall-Scaled Surface' : '3D Frontier: pass@N(N, p)',
        465,
        355,
        26,
        ROLE.ok,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, view3d, layer);
  playCue(s, c, 'independent-attempts', (d) => s.play(revealFour.to(0, { duration: d })));
  playCue(s, c, 'failure-product', (d) => s.play(revealFour.to(0, { duration: d })));
  // Strict prediction withholding: reveal 68.4% only after four-attempts!
  playCue(s, c, 'four-attempts', (d) => s.play(revealFour.to(1, { duration: d })), { after: true });
  playCue(s, c, 'diminishing-returns', (d) => s.play(showSixteen.to(1, { duration: d })));
  playCue(s, c, 'selector-recall', (d) => s.play(showSelector.to(0.5, { duration: d })));
  playCue(s, c, 'selected-success', (d) => s.play(showSelector.to(1, { duration: d })));
}
