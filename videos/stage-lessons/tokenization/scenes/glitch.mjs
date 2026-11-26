// Scene 19: glitch: Under-trained vocabulary rows (SolidGoldMagikarp) + 3 empirical diagnostic checks.
import { linear } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  TABLE,
  aura,
  bindCueBeat,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function glitch(s, c) {
  const focusUnder = s.value(0);
  const showOdd = s.value(0);
  const checkStep = s.value(0); // 1=count training, 2=compare vector, 3=repeat across prompts
  const pulse = s.value(0);

  const bgAura = aura(-120, 0, 740, '#4a172e2a', '#162f5218');
  const title = heroTitle(['Glitch Tokens:', 'under-trained rows'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.warn,
  });

  // Illustrative frequency profile across 8 embedding rows (row 7 near-zero training exposure)
  const freqs = [0.92, 0.78, 0.85, 0.64, 0.71, 0.58, 0.49, 0.03];
  const stageVis = s.value(1);

  const layer = guardedDynamic(stageVis, (alpha) => {
    const und = focusUnder.value;
    const odd = showOdd.value;
    const cs = Math.round(checkStep.value);
    const p = 0.65 + 0.35 * Math.sin(pulse.value * Math.PI * 2);
    const nodes = [];

    // Left: Vocabulary training-frequency spectrum across rows (visual mechanism, zero bullet cards!)
    nodes.push(
      txt(
        'TRAINING EXPOSURE BY VOCABULARY ROW',
        -855,
        -215,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    );
    freqs.forEach((f, idx) => {
      const y = -145 + idx * 54;
      const isRare = idx === 7;
      const col = isRare ? ROLE.warn : ROLE.piece;
      nodes.push(
        txt(`Row ${idx}`, -855, y, 26, isRare ? ROLE.warn : COSMOS.muted, 'mono', 'left').opacity(
          alpha,
        ),
        lumBar(-720, y, f * 520, 24, col, {
          opacity: (isRare ? 0.95 : 0.72) * alpha,
          glow: isRare ? 12 * p : 4,
          maxTrackW: 520,
        }),
      );
      if (isRare && und > 0.2) {
        nodes.push(
          txt('near-zero updates', -165, y, 26, ROLE.warn, 'mono', 'left')
            .glow(8, ROLE.warn)
            .opacity(und * alpha),
        );
      }
    });

    // Right: Illustrative anomaly -> 3 diagnostic rays (quiet from t=0, illuminate on cues)
    const rx = 210;
    const r7 = TABLE[7].map((v) => v.toFixed(1)).join(', ');
    const aUnd = (0.45 + 0.55 * und) * alpha;
    nodes.push(
      tokenPill('SolidGoldMagikarp', rx + 250, -145, {
        w: 440,
        h: 72,
        color: ROLE.warn,
        fill: '#2a1222',
        size: 30,
        glow: und > 0.2 ? 12 * p : 4,
        opacity: aUnd,
      }),
      txt(`Row 7 vector: [${r7}]`, rx, -55, 28, ROLE.warn, 'mono', 'left').opacity(aUnd),
      txt('Example odd reply: "banana"', rx, 20, 30, ROLE.merge, 'serif', 'left')
        .glow(odd > 0.2 ? 6 : 0, ROLE.merge)
        .opacity((0.45 + 0.55 * odd) * alpha),
    );

    // 3 diagnostic check probes anchored to a glowing vertical stem (NOT boxes!)
    const checks = [
      '1. Count training appearances',
      '2. Compare vector norm & neighbors',
      '3. Test repeatability across prompts',
    ];
    nodes.push(
      glowingTrail(
        [
          [rx + 12, 105],
          [rx + 12, 275],
        ],
        {
          color: ROLE.piece,
          width: 3.5,
          glow: cs >= 2 ? 8 : 2,
          opacity: (0.4 + 0.6 * (cs >= 2 ? 1 : 0)) * alpha,
        },
      ),
    );
    checks.forEach((label, i) => {
      const y = 105 + i * 85;
      const active = cs >= i + 1;
      const op = (active ? 1 : 0.45) * alpha;
      nodes.push(
        glowDot(rx + 12, y, { radius: 8, color: ROLE.piece, glow: active ? 12 : 4, opacity: op }),
        txt(label, rx + 42, y, 28, COSMOS.ink, 'sans', 'left').opacity(op),
      );
    });

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  const totalDur = Math.max(1, c.end - c.start - 0.5);
  c.at(0.1, () => {
    s.play(pulse.to(5, { duration: totalDur, ease: linear }));
  });

  playCue(s, c, 'under', (d) => s.play(focusUnder.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'odd', (d) => s.play(showOdd.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'e1', (d) => s.play(checkStep.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'e2', (d) => s.play(checkStep.to(2, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'e3', (d) => s.play(checkStep.to(3, { duration: d })), { dur: 0.35 });
  bindCueBeat(s, c, s.value(0), ['strange', 'anomalous', 'goals', 'barely']);
}
