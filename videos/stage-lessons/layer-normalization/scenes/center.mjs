// Scene 2: center: "Where is zero for this token?"
// Four glowing feature coordinates balance around a live mean fulcrum on a shared [-4, 9] ruler.
// Subtracting mean=2 centers to [1, -1, -3, 3]; adding +3 raises input mean to 5; subtracting 5
// lands every feature back on the exact same centered constellation.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  fmt,
  fmtTrim,
  glowRing,
  mean,
  playBeat,
  playCue,
  scenePulse,
  x,
} from '../parts.mjs';

export default function center(s, c) {
  const baseMean = mean(x); // 2.0

  const title = heroTitle(['Where is zero', 'for this token?'], {
    x: -850,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.write,
  });

  const sub1 = s.value(0); // 0 -> 2 (initial mean subtraction)
  const peerVis = s.value(0); // beat 1: neighboring token independent mean badge
  const addOffset = s.value(0); // 0 -> 3 (uniform +3 offset)
  const sub2 = s.value(0); // 0 -> 3 (subtract extra 3 so total subtracted = 5)
  const pulse = s.value(0);

  const stageVis = s.value(1);

  const trackLeft = -355;
  const trackRight = 815;
  const valMin = -4;
  const valMax = 9;
  const toX = (v) => trackLeft + ((v - valMin) / (valMax - valMin)) * (trackRight - trackLeft);
  const zeroX = toX(0);
  const rowYs = [-145, -40, 65, 170];

  const centerLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const off = addOffset.value;
    const sub = sub1.value + sub2.value;
    const input = x.map((v) => v + off);
    const current = input.map((v) => v - sub);
    const inMean = mean(input);
    const curMean = mean(current);
    const p = pulse.value;

    // Shared vertical zero meridian (stops well below top labels)
    const axisY = 248;
    nodes.push(
      glowingTrail(
        [
          [zeroX, -210],
          [zeroX, axisY],
        ],
        { color: ROLE.norm, width: 3.2, glow: 9, core: false, opacity: 0.78 * alpha },
      ),
    );

    // Shared ruler ticks below tracks
    nodes.push(
      line([trackLeft, axisY], [trackRight, axisY], { stroke: '#4c6091', width: 2.2 }).opacity(
        alpha,
      ),
    );
    [-3, 0, 3, 6, 8].forEach((tick) => {
      const tx = toX(tick);
      nodes.push(
        line([tx, axisY - 8], [tx, axisY + 8], { stroke: '#6c82b8', width: 2 }).opacity(alpha),
        txt(
          String(tick),
          tx,
          axisY + 34,
          26,
          tick === 0 ? ROLE.norm : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // Live mean beacon vertical dashed guide
    const meanX = toX(curMean);
    nodes.push(
      line([meanX, -210], [meanX, axisY], {
        stroke: ROLE.gold,
        width: 2.6,
        dash: [8, 8],
      }).opacity(0.85 * alpha),
      glowDot(meanX, axisY, {
        radius: 8 + Math.sin(p * Math.PI * 8) * 1.5,
        color: ROLE.gold,
        glow: 14,
        opacity: alpha,
      }),
      txt(`mean = ${fmtTrim(curMean, 2)}`, meanX, -252, 30, ROLE.gold, 'mono', 'center')
        .glow(6, ROLE.gold)
        .opacity(alpha),
    );

    // Left column headers (Input & Current placed cleanly outside sliding tracks)
    nodes.push(
      txt('Feat', -825, -220, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('Input', -680, -220, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Shifted', -515, -220, 26, ROLE.write, 'mono', 'center').opacity(alpha),
    );

    // 4 feature tracks
    current.forEach((val, i) => {
      const ry = rowYs[i];
      const col = i === 0 ? ROLE.gold : i === 3 ? ROLE.amber : ROLE.write;
      const inX = toX(input[i]);
      const curX = toX(val);

      nodes.push(
        txt(`f${i + 1}`, -825, ry, 30, COSMOS.muted, 'mono', 'left').opacity(alpha),
        txt(fmtTrim(input[i], 1), -680, ry, 36, COSMOS.ink, 'mono', 'center').opacity(alpha),
        txt(fmtTrim(val, 2), -515, ry, 36, col, 'mono', 'center').glow(5, col).opacity(alpha),
        line([trackLeft, ry], [trackRight, ry], { stroke: '#273558', width: 2 }).opacity(alpha),
      );

      // Displacement trail from input to current value
      if (Math.abs(inX - curX) > 4) {
        nodes.push(
          glowRing(inX, ry, 9, COSMOS.muted, {
            width: 2.2,
            glow: 4,
            fillOpacity: 0.1,
            opacity: 0.65 * alpha,
          }),
          glowingTrail(
            [
              [inX, ry],
              [curX, ry],
            ],
            { color: col, width: 4, glow: 9, opacity: 0.88 * alpha },
          ),
        );
      }

      nodes.push(glowDot(curX, ry, { radius: 11, color: col, glow: 14, opacity: alpha }));
    });

    // Bottom live telemetry + non-overlapping neighbor isolation note on separate line
    nodes.push(
      txt(
        `Input mean = ${fmtTrim(inMean, 2)}   ·   Subtracted = ${fmtTrim(sub, 2)}   ·   Spread f4 - f1 = ${fmt(current[3] - current[0], 1)}`,
        0,
        352,
        30,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    );

    if (peerVis.value > 0.05) {
      nodes.push(
        txt(
          'Another token in the sequence gets its own independent mean',
          0,
          412,
          28,
          ROLE.rms,
          'sans',
          'center',
        )
          .glow(5, ROLE.rms)
          .opacity(peerVis.value * alpha),
      );
    }

    // Offset badge when +3 offset is active
    if (off > 0.05) {
      nodes.push(
        txt(`Offset +${fmtTrim(off, 1)}`, 810, -370, 34, ROLE.amber, 'mono', 'right')
          .glow(8, ROLE.amber)
          .opacity(Math.min(1, off / 0.5) * alpha),
      );
    }

    return nodes;
  });

  const centerEq = glowTex('x_{\\text{centered}} = x - \\mu', {
    x: 420,
    y: -385,
    size: 40,
    color: ROLE.write,
  });

  s.add(cinemaAtmosphere(ROLE.write, ROLE.gold), title, centerEq, centerLayer);
  scenePulse(s, c, pulse);

  // Beat 0: Subtract mean = 2 from every feature
  playCue(s, c, 'center-subtract', (d) => s.play(sub1.to(baseMean, { duration: d })), {
    dur: 0.9,
  });

  // Beat 1: Show per-token independence note
  playBeat(s, c, 1, (d) => s.play(peerVis.to(1, { duration: d })), { offset: 0.8, dur: 0.6 });

  // Beat 2: Add +3 to every input, then subtract the new mean (5) -> returns identically
  playCue(s, c, 'center-offset', (d) => s.play(addOffset.to(3, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'center-again', (d) => s.play(sub2.to(3, { duration: d })), { dur: 0.85 });
}
