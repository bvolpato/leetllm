// Scene 23: diagnosis-release: Per-metric release gates (OCR 0.72 < 0.90 holds release), NaN finite-number guard, frozen rerun.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  playCue,
  releaseBlockers,
  txt,
} from '../parts.mjs';

export default function diagnosisRelease(s, c) {
  const showScores = s.value(0);
  const showHold = s.value(0);
  const showNanGuard = s.value(0);
  const showRerun = s.value(0);

  const bgAura = aura(0, 0, 760, '#2e14242a', '#14335c28');
  const title = heroTitle(['Which Score Holds', 'the Release?'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.warn,
  });

  const metrics = [
    { name: 'Helpfulness', val: 0.91, floor: 0.85, color: ROLE.ok },
    { name: 'Region IoU', val: 0.68, floor: 0.65, color: ROLE.ok },
    { name: 'OCR Exact', val: 0.72, floor: 0.9, color: ROLE.warn },
  ];
  const blockers = releaseBlockers({ helpfulness: 0.91, OCR: 0.72, IoU: 0.68 });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sc = showScores.value;
    const hd = showHold.value;
    const ng = showNanGuard.value;
    const rr = showRerun.value;

    const barX = -510;
    const maxW = 700;

    const nodes = [
      txt('METRIC', -855, -240, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(
        'MEASURED SCORE VS THRESHOLD (GOLD TICK)',
        barX,
        -240,
        26,
        ROLE.vision,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    metrics.forEach((m, i) => {
      const y = -150 + i * 108;
      const isOcr = m.name === 'OCR Exact';
      const barCol = isOcr && hd > 0.4 ? ROLE.warn : isOcr ? ROLE.gold : ROLE.ok;
      const tickX = barX + m.floor * maxW;

      nodes.push(
        txt(m.name, -855, y, 30, COSMOS.ink, 'mono', 'left').opacity(alpha),
        lumBar(barX, y, m.val * maxW * (0.4 + 0.6 * sc), 34, barCol, {
          opacity: alpha,
          maxTrackW: maxW,
        }),
        line([tickX, y - 26], [tickX, y + 26], { stroke: ROLE.gold, width: 3.4 })
          .glow(8, ROLE.gold)
          .opacity(alpha),
        txt(
          `${m.val.toFixed(2)} / ${m.floor.toFixed(2)}`,
          barX + maxW + 26,
          y,
          30,
          barCol,
          'mono',
          'left',
        ).opacity(alpha),
        chipPill(isOcr ? (hd > 0.4 ? 'HOLD RELEASE' : 'CHECK FLOOR') : 'PASS', 680, y, {
          w: 320,
          h: 58,
          color: isOcr ? (hd > 0.4 ? ROLE.warn : ROLE.gold) : ROLE.ok,
          fill: isOcr && hd > 0.4 ? '#2c1422' : '#0f2d24',
          size: 26,
          glow: isOcr && hd > 0.4 ? 14 : 6,
          opacity: alpha,
        }),
      );
    });

    // Middle-lower: NaN & invalid-value numerical guard
    nodes.push(
      chipPill(
        ng > 0.3
          ? 'GUARD: block missing, bool, non-numeric, NaN/Inf, out of [0,1]  (NaN < 0.90 is FALSE!)'
          : `Blockers detected: ${blockers.join(', ')} -> inspect resolution, crop & connector`,
        0,
        195,
        {
          w: 1620,
          h: 72,
          color: ng > 0.3 ? ROLE.warn : hd > 0.4 ? ROLE.gold : '#384c76',
          fill: ng > 0.3 ? '#2c1422' : '#10182d',
          size: 26,
          glow: ng > 0.3 ? 12 : 4,
          opacity: alpha,
        },
      ),
      txt(
        rr > 0.3
          ? 'Rerun on frozen cases after crop/bridge repair; report cited words, timing, slice counts & uncertainty'
          : 'A box can overlap the right region while the answer names the wrong metric',
        0,
        305,
        26,
        rr > 0.3 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'mm-diagnosis-release-0', (d) => s.play(showScores.to(1, { duration: d })));
  playCue(s, c, 'mm-ocr-block', (d) => s.play(showHold.to(1, { duration: d })), { after: true });
  playCue(s, c, 'mm-diagnosis-release-1', (d) => s.play(showNanGuard.to(1, { duration: d })));
  playCue(s, c, 'mm-diagnosis-release-2', (d) => s.play(showRerun.to(1, { duration: d })));
}
