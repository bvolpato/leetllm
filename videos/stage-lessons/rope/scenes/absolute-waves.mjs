// Scene 5: absolute-waves: Four frequency clocks construct sine-first rows at pos 0 & pos 2 + wavelengths.
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  CLOCK_FREQUENCIES,
  COSMOS,
  ROLE,
  TAU,
  absoluteRow,
  aura,
  bindStepCues,
  clockDial,
  glowDot,
  glowTex,
  glowingCurve,
  heroTitle,
  txt,
  wavePath,
} from '../parts.mjs';

const ALL_CUES = [
  'rp-absolute-waves-0-0',
  'rp-absolute-waves-0-1',
  'rp-absolute-waves-0-2',
  'rp-absolute-waves-0-3',
  'rp-absolute-waves-1-0',
  'rp-absolute-waves-1-1',
  'rp-absolute-waves-1-2',
  'rp-absolute-waves-1-3',
  'rp-absolute-waves-2-0',
  'rp-absolute-waves-2-1',
  'rp-absolute-waves-2-2',
  'rp-absolute-waves-2-3',
];

const WAVELENGTHS_512 = [
  { dim: 0, wl: TAU / Math.pow(10000, 0 / 512), col: COSMOS.cyan },
  { dim: 64, wl: TAU / Math.pow(10000, 64 / 512), col: COSMOS.blue },
  { dim: 510, wl: TAU / Math.pow(10000, 510 / 512), col: COSMOS.gold },
];

export default function absoluteWaves(s, c) {
  const step = s.value(0);
  const stageAura = aura(0, -10, 720, '#60a5fa20', '#5ce1e614');

  const title = heroTitle(['One slot drives', 'several wave pairs'], {
    x: -860,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.blue,
    eyebrow: 'ABSOLUTE SINUSOIDAL ENCODING',
  });

  const eq = glowTex(
    String.raw`[\sin(m\omega_i),\;\cos(m\omega_i)],\quad \lambda_i = \frac{2\pi}{\omega_i}`,
    {
      x: 340,
      y: -375,
      size: 38,
      color: COSMOS.gold,
      glow: 5,
    },
  );

  const live = dynamic(() => {
    const st = step.value;
    // Position smoothly animates from 0 to 2 starting at beat 1 (step 4 -> 5)
    const pos = Math.max(0, Math.min(2, (st - 3.6) * 2));
    const addBlend = Math.max(0, Math.min(1, st - 5.5));
    const showWave = Math.max(0, Math.min(1, st - 8.2));
    const row = absoluteRow(pos, CLOCK_FREQUENCIES);

    const nodes = [];
    const dialXs = [-630, -210, 210, 630];
    const dialY = -125;

    CLOCK_FREQUENCIES.forEach((freq, i) => {
      const ang = pos * freq;
      const col = ROLE.bands[i];
      nodes.push(
        clockDial({
          cx: dialXs[i],
          cy: dialY,
          radius: 108,
          queryAngle: ang,
          showAxes: true,
          showWake: true,
          queryColor: col,
          auraColor: i === 0 ? '#5ce1e622' : '#4c2f8a12',
          title: `ω${i} = ${freq}`,
          subtitle: `(${Math.sin(ang).toFixed(2)}, ${Math.cos(ang).toFixed(2)})`,
          titleColor: col,
          subColor: COSMOS.ink,
        }),
      );
    });

    // Middle strip: 8-coordinate fingerprint [sin, cos, ...] + addition to token embedding
    const stripY = 175;
    const cellW = 192;
    const startX = -768 + cellW * 0.5;
    nodes.push(
      txt(
        `pos = ${pos.toFixed(1)}`,
        -860,
        stripY - 62,
        28,
        pos > 0.5 ? ROLE.query : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        addBlend > 0.2 ? '+ token embedding  →  Q, K, V' : '8-coordinate sine-first row',
        860,
        stripY - 62,
        26,
        addBlend > 0.2 ? ROLE.score : COSMOS.muted,
        'mono',
        'right',
      ),
    );
    row.forEach((val, idx) => {
      const cx = startX + idx * cellW;
      const col = ROLE.bands[Math.floor(idx / 2)];
      nodes.push(
        rect(cellW - 12, 62, {
          fill: '#101729',
          stroke: col,
          width: idx < 2 ? 2.6 : 1.7,
          radius: 10,
        }).at(cx, stripY),
        txt(val.toFixed(3), cx, stripY, 27, idx < 2 ? COSMOS.ink : COSMOS.muted, 'mono'),
      );
    });

    // Bottom: Glowing continuous wave + d=512 wavelengths (6.3, 20, 60611)
    const waveY = 345;
    const ptsFast = wavePath(-840, 80, waveY, 44, (t) => Math.sin(t * 20), 120);
    const ptsSlow = wavePath(-840, 80, waveY, 34, (t) => Math.sin(t * 2.4), 100);
    nodes.push(
      line([-840, waveY], [80, waveY], { stroke: '#2a3759', width: 1.6 }),
      glowingCurve(ptsFast, COSMOS.cyan, { width: 3.4, glow: 8 }),
      glowingCurve(ptsSlow, COSMOS.gold, { width: 3.0, glow: 7 }).opacity(0.82),
      glowDot(-840 + (pos / 6) * 920, waveY - 44 * Math.sin((pos / 6) * 20), {
        radius: 7,
        color: '#ffffff',
        glow: 12,
      }),
    );

    // Wavelength readout on bottom right
    const wlOp = 0.45 + 0.55 * showWave;
    nodes.push(
      txt('d = 512 wavelengths', 180, 290, 26, COSMOS.muted, 'mono', 'left').opacity(wlOp),
    );
    WAVELENGTHS_512.forEach((item, i) => {
      const x = 180 + i * 240;
      nodes.push(
        txt(`2i=${item.dim}`, x, 338, 26, COSMOS.dim, 'mono', 'left').opacity(wlOp),
        txt(
          `λ≈${Math.round(item.wl).toLocaleString('en-US')}`,
          x,
          378,
          28,
          item.col,
          'mono',
          'left',
        )
          .opacity(wlOp)
          .glow(showWave > 0.3 ? 5 : 0, item.col),
      );
    });

    return group(...nodes);
  });

  s.add(stageAura, title, eq, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
