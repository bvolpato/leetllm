// Scene 12: regularization: Subword regularization sampling paths & temperature exponent alpha.
import { linear } from 'vizmatic/stage';
import {
  COSMOS,
  PATHS,
  ROLE,
  aura,
  bindCueBeat,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function regularization(s, c) {
  const passNum = s.value(1); // 1 -> 2
  const alphaExp = s.value(1.0); // 1.0 -> 0.25 (flatter sampling distribution)
  const showServe = s.value(0);
  const pulse = s.value(0);

  const bgAura = aura(0, 0, 720, '#271e5c26', '#103b5418');
  const title = heroTitle(['Subword Regularization:', 'sampling valid cuts'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.piece,
  });

  const eq = glowTex(String.raw`P_\alpha(x) \propto P(x)^\alpha`, {
    x: 560,
    y: -380,
    size: 42,
    color: ROLE.merge,
    glow: 6,
  });

  const stageVis = s.value(1);
  const labels = ['▁rain', '▁  +  rain', '▁  +  ra  +  in'];
  const colors = [ROLE.merge, ROLE.piece, ROLE.path];

  const layer = guardedDynamic(stageVis, (alpha) => {
    const pn = Math.round(passNum.value);
    const exp = alphaExp.value;
    const srv = showServe.value;
    const p = 0.65 + 0.35 * Math.sin(pulse.value * Math.PI * 2);

    const powered = PATHS.map((v) => Math.pow(v, exp));
    const total = powered.reduce((acc, v) => acc + v, 0);
    const probs = powered.map((v) => v / total);
    const nodes = [];

    // Active sampled pass at top
    nodes.push(
      txt(`TRAINING PASS ${pn}`, -855, -210, 26, ROLE.piece, 'mono', 'left').opacity(alpha),
    );
    if (pn === 1) {
      nodes.push(
        tokenPill('▁rain', -680, -120, {
          w: 280,
          h: 80,
          color: ROLE.merge,
          size: 40,
          glow: 12 * p,
          opacity: alpha,
        }),
      );
    } else {
      nodes.push(
        tokenPill('▁', -755, -120, {
          w: 120,
          h: 80,
          color: ROLE.piece,
          size: 40,
          glow: 12 * p,
          opacity: alpha,
        }),
        tokenPill('rain', -560, -120, {
          w: 210,
          h: 80,
          color: ROLE.piece,
          size: 40,
          glow: 12 * p,
          opacity: alpha,
        }),
      );
    }

    // Live sampling distribution bars reacting smoothly as exponent drops 1.0 -> 0.25
    nodes.push(
      txt(
        `SAMPLING DISTRIBUTION  (α = ${exp.toFixed(2)})`,
        -855,
        25,
        28,
        ROLE.merge,
        'mono',
        'left',
      )
        .glow(6, ROLE.merge)
        .opacity(alpha),
    );

    labels.forEach((lbl, idx) => {
      const y = 105 + idx * 78;
      const share = probs[idx];
      nodes.push(
        txt(lbl, -855, y, 30, colors[idx], 'mono', 'left').opacity(alpha),
        lumBar(-430, y, share * 860, 32, colors[idx], { opacity: alpha, maxTrackW: 860 }),
        txt(`${(share * 100).toFixed(1)}%`, 465, y, 32, colors[idx], 'mono', 'left').opacity(alpha),
      );
    });

    if (srv > 0.05) {
      nodes.push(
        txt(
          'At inference time, serve the exact deterministic mode specified for the checkpoint',
          -855,
          380,
          28,
          ROLE.ok,
          'sans',
          'left',
        )
          .glow(6, ROLE.ok)
          .opacity(srv * alpha),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  const totalDur = Math.max(1, c.end - c.start - 0.5);
  c.at(0.1, () => {
    s.play(pulse.to(5, { duration: totalDur, ease: linear }));
  });

  playCue(s, c, 'pass-2', (d) => s.play(passNum.to(2, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'setting', (d) => s.play(alphaExp.to(0.25, { duration: d })), { dur: 1.2 });
  playCue(s, c, 'serve', (d) => s.play(showServe.to(1, { duration: d })), { dur: 0.5 });
  bindCueBeat(s, c, s.value(0), ['sample', 'pass-1', 'augment', 'option']);
}
