// Scene 23 (reproducible-package): "Bind the score to the evidence that produced it"
// 6-layer luminous audit manifest exposing confounded retrieval/model changes and holdout-tuned judges.
import {
  COSMOS,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const LAYERS = [
  { key: '1. CASE & SOURCE', val: 'Dataset version · Q91 · library policy v3', col: ROLE.A },
  { key: '2. INPUT & RETRIEVAL', val: 'Top-3 chunks · final context retained', col: ROLE.A },
  { key: '3. MODEL & PROTOCOL', val: 'Dated snapshot · run date · decoding & tools', col: ROLE.B },
  {
    key: '4. ANSWER & SCORER',
    val: 'Actual returned output · frozen scorer version',
    col: ROLE.pass,
  },
  { key: '5. ATTEMPT EVIDENCE', val: 'Failed cases · timeouts · full cost boundary', col: ROLE.A },
  { key: '6. EXPOSURE RECORD', val: 'CONFOUND: judge tuned on holdout cases!', col: ROLE.exposed },
];

export default function packageRecord(s, c) {
  const phase = s.value(0);
  const focusTop = s.value(0);
  const showOutputs = s.value(0);
  const showMissing = s.value(0);
  const showRepeat = s.value(0);
  const showChanged = s.value(0);
  const showExposed = s.value(0);
  const showRepair = s.value(0);

  const bgAura = aura(100, 20, 620, '#14324c36', '#331c4420');
  const title = heroTitle(['Bind Every Reported Score', 'to Retained Evidence'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.A,
    eyebrow: 'REPRODUCIBILITY · AUDIT MANIFEST & CONFOUNDS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const out = showOutputs.value;
    const chg = showChanged.value;
    const exp = showExposed.value;
    const rep = showRepair.value;
    const nodes = [];

    LAYERS.forEach((layer, i) => {
      const cy = -185 + i * 86;
      const isOutputRow = i === 3;
      const isRetrievalRow = i === 1;
      const isExposureRow = i === 5;
      const rowVis = isOutputRow ? 0.3 + 0.7 * out : isExposureRow ? 0.25 + 0.75 * exp : 1;

      const mutated = isRetrievalRow && chg > 0.5 && rep < 0.5;
      const exposedBad = isExposureRow && exp > 0.5 && rep < 0.5;
      const lockedClean = rep >= 0.5;

      const borderCol = lockedClean
        ? ROLE.pass
        : mutated || exposedBad
          ? ROLE.fail
          : i === 2 && showRepeat.value > 0.3 && chg < 0.5
            ? ROLE.focus
            : layer.col;

      const displayVal = mutated
        ? 'CONFOUND: top-5 retrieval + model also changed!'
        : isExposureRow && exp < 0.5
          ? 'Verify holdout isolation before shipping'
          : isExposureRow && lockedClean
            ? 'Exposed cases moved to regression · fresh untouched holdout'
            : isRetrievalRow && lockedClean
              ? 'Frozen top-3 retrieval · matched baseline rerun'
              : layer.val;

      nodes.push(
        lumBar(0, cy, 1660, 70, {
          color: borderCol,
          fillOpacity: mutated || exposedBad ? 0.22 : lockedClean ? 0.16 : 0.11,
          strokeWidth: mutated || exposedBad || lockedClean ? 2.8 : 2.0,
          glow: mutated || exposedBad ? 12 * pulse : lockedClean ? 9 : 4,
          radius: 10,
          opacity: rowVis,
        }),
        txt(layer.key, -795, cy, 26, borderCol, 'mono', 'left').opacity(rowVis),
        txt(
          displayVal,
          -345,
          cy,
          28,
          mutated || exposedBad ? ROLE.fail : COSMOS.ink,
          'sans',
          'left',
        ).opacity(rowVis),
      );

      if (lockedClean && i === 0) {
        nodes.push(
          glowRing(765, cy, 24 + 3 * pulse, ROLE.pass, { width: 2.6, glow: 9, opacity: rep }),
          txt('✓', 765, cy, 28, ROLE.pass, 'sans').opacity(rep),
        );
      }
    });

    // Bottom status bar with strict non-overlapping crossfades
    const s0 = showMissing.value * fadeOut(showRepeat.value) * fadeOut(rep);
    const s1 = fadeIn(showRepeat.value) * fadeOut(rep);
    const s2 = fadeIn(rep);

    if (s0 > 0.02) {
      nodes.push(
        txt(
          'A scalar score or matching manifest cannot recreate missing outputs or prove a run occurred',
          0,
          360,
          30,
          ROLE.focus,
          'sans',
        )
          .glow(6, ROLE.focus)
          .opacity(s0),
      );
    }
    if (s1 > 0.02) {
      nodes.push(
        txt(
          'Pin dated snapshot + run date · repeat under fixed protocol · rerun baseline contemporaneously',
          0,
          360,
          28,
          ROLE.A,
          'sans',
        )
          .glow(6, ROLE.A)
          .opacity(s1),
      );
    }
    if (s2 > 0.02) {
      nodes.push(
        txt(
          'REPAIR: freeze full system & validated scorer -> retire exposed cases -> untouched matched rerun',
          0,
          360,
          30,
          ROLE.pass,
          'sans',
        )
          .glow(8, ROLE.pass)
          .opacity(s2),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'reproducible-package-phase-0', focusTop, 1, { duration: 0.4 });
  tweenCue(s, c, 'ba-reproducible-package-outputs', showOutputs, 1, { duration: 0.45 });
  tweenCue(s, c, 'ba-reproducible-package-missing', showMissing, 1, { duration: 0.45 });
  tweenCue(s, c, 'reproducible-package-phase-1', showRepeat, 1, { duration: 0.45 });
  tweenCue(s, c, 'ba-reproducible-package-repeat', showRepeat, 1, { duration: 0.25 });
  tweenCue(s, c, 'ba-reproducible-package-changed', showChanged, 1, { duration: 0.45 });
  tweenCue(s, c, 'judge-exposed', showExposed, 1, { duration: 0.45 });
  tweenCue(s, c, 'freeze-repair', showRepair, 1, { duration: 0.5, after: true });
  tweenCue(s, c, 'ba-reproducible-package-repair', showRepair, 1, { duration: 0.25 });
}
