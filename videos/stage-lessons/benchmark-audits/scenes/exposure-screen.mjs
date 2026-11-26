// Scene 17 (exposure-screen): "A screen reports its own detection boundary"
// 13-gram laser scanner sweeping across literal copy, paraphrase, renamed code, and translation + cutoff dates.
import {
  COSMOS,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  runAmbientPhase,
  tweenCue,
  txt,
  verifyInvariant,
} from '../parts.mjs';

const LITERAL =
  'freeze deployments require commander approval before any release enters the live production environment';
verifyInvariant(LITERAL.split(' ').length === 13, 'authored literal 13-gram window has 13 words');

const VARIANTS = [
  {
    kind: '1. LITERAL COPY (13-GRAM)',
    text: 'freeze deployments require commander approval before any release enters the live production environment',
    match: true,
    col: ROLE.exposed,
  },
  {
    kind: '2. PARAPHRASED POLICY',
    text: 'Commander sign-off is required before shipping during a freeze.',
    match: false,
    col: ROLE.B,
  },
  {
    kind: '3. RENAMED CODE',
    text: 'if deployment_frozen: require(commander_signoff)',
    match: false,
    col: ROLE.B,
  },
  {
    kind: '4. TRANSLATED POLICY',
    text: "Pendant le gel, obtenir l'accord du commandant avant le deploiement.",
    match: false,
    col: ROLE.B,
  },
];

export default function screen(s, c) {
  const phase = s.value(0);
  const focusTrain = s.value(0);
  const focusDev = s.value(0);
  const showReg = s.value(0);
  const showScan = s.value(0);
  const scanRow = s.value(0); // 0 -> 3
  const showMatch0 = s.value(0);
  const showMissRest = s.value(0);
  const showCanary = s.value(0);
  const showDated = s.value(0);

  const bgAura = aura(-40, 20, 620, '#331a4836', '#142f4820');
  const title = heroTitle(['Every Contamination Screen', 'Has a Detection Boundary'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.exposed,
    eyebrow: 'EXPOSURE SCREENING · 13-GRAMS, CANARIES & CUTOFFS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const nodes = [];

    const rowYs = [-180, -45, 90, 225];
    const boxX = 0;
    const boxW = 1660;

    // Animated golden scanner beacon gliding along left margin rail (never crosses text!)
    if (showScan.value > 0.02) {
      const sy = rowYs[0] + (rowYs[3] - rowYs[0]) * (scanRow.value / 3);
      nodes.push(
        glowingTrail(
          [
            [-860, rowYs[0] - 40],
            [-860, rowYs[3] + 40],
          ],
          { color: ROLE.focus, width: 3.0, glow: 8, opacity: showScan.value * 0.55, core: false },
        ),
        glowDot(-860, sy, { radius: 11, color: ROLE.focus, glow: 15, opacity: showScan.value }),
      );
    }

    VARIANTS.forEach((v, i) => {
      const cy = rowYs[i];
      const isLit =
        (i === 0 && focusTrain.value > 0.3) ||
        (i === 1 && focusDev.value > 0.3) ||
        (i === 0 && showMatch0.value > 0.3);
      const badgeVis = i === 0 ? showMatch0.value : showMissRest.value;
      const borderCol =
        i === 0 && showMatch0.value > 0.3 ? ROLE.exposed : isLit ? ROLE.focus : COSMOS.rule;

      nodes.push(
        lumBar(boxX, cy, boxW, 112, {
          color: borderCol,
          fillOpacity: i === 0 && showMatch0.value > 0.3 ? 0.2 : 0.1,
          strokeWidth: isLit ? 3.0 : 2.0,
          glow: isLit ? 11 * pulse : 4,
          radius: 10,
        }),
        txt(v.kind, -805, cy - 28, 26, i === 0 ? ROLE.A : COSMOS.muted, 'mono', 'left'),
        txt(v.text, -805, cy + 20, 26, COSMOS.ink, i === 2 ? 'mono' : 'sans', 'left'),
      );

      if (badgeVis > 0.02) {
        const bCol = v.match ? ROLE.exposed : ROLE.fail;
        nodes.push(
          txt(
            v.match ? '13-GRAM MATCH' : 'MISSED BY 13-GRAM',
            805,
            cy - 28,
            26,
            bCol,
            'mono',
            'right',
          )
            .glow(v.match ? 8 : 5, bCol)
            .opacity(badgeVis),
        );
      }
    });

    // Bottom phase summary with strict non-overlapping crossfades
    const s0 =
      fadeOut(showReg.value) *
      fadeOut(showMissRest.value) *
      fadeOut(showCanary.value) *
      fadeOut(showDated.value);
    const s1 =
      fadeIn(showReg.value) *
      fadeOut(showMissRest.value) *
      fadeOut(showCanary.value) *
      fadeOut(showDated.value);
    const s2 = fadeIn(showMissRest.value) * fadeOut(showCanary.value) * fadeOut(showDated.value);
    const s3 = fadeIn(showCanary.value) * fadeOut(showDated.value);
    const s4 = fadeIn(showDated.value);

    if (s0 > 0.02) {
      nodes.push(
        txt(
          'Training exposure (weights) vs development exposure (prompts, examples, judges)',
          0,
          355,
          30,
          COSMOS.muted,
          'sans',
        ).opacity(s0),
      );
    }
    if (s1 > 0.02) {
      nodes.push(
        txt(
          'Once any case guides a design choice -> retire it to regression, find fresh holdout',
          0,
          355,
          32,
          ROLE.focus,
          'sans',
        )
          .glow(7, ROLE.focus)
          .opacity(s1),
      );
    }
    if (s2 > 0.02) {
      nodes.push(
        txt(
          'Exact 13-gram screens miss paraphrases, renamed variables, and translations',
          0,
          355,
          32,
          ROLE.fail,
          'sans',
        )
          .glow(7, ROLE.fail)
          .opacity(s2),
      );
    }
    if (s3 > 0.02) {
      nodes.push(
        txt(
          'BIG-bench canary GUIDs work only when crawlers honor them and copies keep them intact',
          0,
          355,
          30,
          ROLE.exposed,
          'sans',
        )
          .glow(6, ROLE.exposed)
          .opacity(s3),
      );
    }
    if (s4 > 0.02) {
      nodes.push(
        txt(
          'LiveCodeBench & LiveBench: pair task dates with exact checkpoint cutoff, post-training & retrieval',
          0,
          355,
          28,
          ROLE.A,
          'sans',
        )
          .glow(7, ROLE.A)
          .opacity(s4),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'exposure-screen-phase-0', focusTrain, 0, { duration: 0.1 });
  tweenCue(s, c, 'ba-exposure-screen-train', focusTrain, 1, { duration: 0.4 });
  tweenCue(s, c, 'ba-exposure-screen-dev', focusDev, 1, { duration: 0.4 });
  tweenCue(s, c, 'ba-exposure-screen-regression', showReg, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'exposure-screen-phase-1', showScan, 1, { duration: 0.4 });
  tweenCue(s, c, 'ba-exposure-screen-ngram', showMatch0, 1, { duration: 0.4 });
  c.on('ba-exposure-screen-paraphrase', () => {
    s.play(scanRow.to(3, { duration: 1.6 }));
    s.play(showMissRest.to(1, { duration: 0.5 }));
  });
  tweenCue(s, c, 'ba-exposure-screen-canary', showCanary, 1, { duration: 0.45 });
  tweenCue(s, c, 'exposure-screen-phase-2', showScan, 0, { duration: 0.35 });
  tweenCue(s, c, 'ba-exposure-screen-dated', showDated, 1, { duration: 0.45 });
  tweenCue(s, c, 'ba-exposure-screen-cutoff', showDated, 1, { duration: 0.25 });
}
