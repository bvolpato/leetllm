// Scene 9: steering - "An edit moves overlapping readouts too"
// Left: Glowing 2D activation plane with baseline x = [0.2, 0.1], steering edit arrow along [0, 1],
//       and three luminous rulers (vertical cyan, horizontal blue, tilted pink) with live shadows.
// Right: Glowing MathJax x' = x + alpha d_f, sleek alpha slider, three luminous readout bars
//        showing collateral drift Delta = alpha (r . d_f), then Beat 2 dashed gold encoder ruler
//        [1, 2] contrasting requested coefficient (1.10) vs re-encoded coefficient (1.80).
import { dotProduct } from 'vizmatic';
import { angleMark } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  cinemaPlane,
  glowReadoutBars,
  glowSlider,
  glowTex,
  heroTitle,
  playCue,
  steeringBaseline,
  steeringDirection,
  steeringReadouts,
  txt,
  vec,
} from '../parts.mjs';

const ALPHA = 1;
const READER = [1, 2];

export default function steering(s, c) {
  const [candidate, orthogonal, overlapping] = steeringReadouts;
  const cached = dotProduct(READER, steeringBaseline); // 0.4

  const atmo = cinemaAtmosphere(ROLE.other, ROLE.second);
  const title = heroTitle(['An edit moves overlapping', 'readouts too'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.other,
  });

  const b = cinemaPlane(s, {
    cx: -365,
    cy: 95,
    width: 960,
    height: 700,
    x: [-1.3, 2.9],
    y: [-1.4, 1.8],
  });

  const alpha = s.value(0);
  const edited = () => vec.add(steeringBaseline, vec.scale(steeringDirection, alpha.value));
  const readOf = (dir) => () => dotProduct(edited(), dir);

  const rx = 515;
  const steerEq = glowTex("x' = x + \\alpha\\,d_f", {
    x: rx,
    y: -310,
    size: 48,
    color: COSMOS.ink,
    glow: 6,
  });
  steerEq.part('\\alpha\\,d_f').forEach((g) => g.color(ROLE.other));

  const knob = glowSlider({
    x: 410,
    y: -190,
    width: 350,
    value: alpha,
    min: 0,
    max: ALPHA,
    color: ROLE.other,
    prefix: 'α = ',
    digits: 2,
    labelX: 620,
  });

  const baseRing = b.ringOf(steeringBaseline, ROLE.dim, 14, 3);
  const dotEd = b.dotOf(edited, ROLE.activation, 10, 14);
  const editArrow = b.arrowOf(steeringBaseline, edited, ROLE.other, { width: 7.5 });

  const rulers = {
    candidate: [
      b.rulerOf(candidate, ROLE.other, -0.3, 1.8, { width: 3.5 }),
      b.shadowOf(edited, candidate, ROLE.other, 8),
    ],
    orthogonal: [
      b.rulerOf(orthogonal, ROLE.first, -0.3, 1.8, { width: 4.5 }),
      b.shadowOf(edited, orthogonal, ROLE.first, 8),
    ],
    overlapping: [
      b.rulerOf(overlapping, ROLE.second, -0.3, 1.9, { width: 3.5 }),
      b.shadowOf(edited, overlapping, ROLE.second, 8),
    ],
  };

  const bars = glowReadoutBars({
    left: 205,
    top: -100,
    width: 610,
    rowGap: 112,
    items: [
      { name: 'Vertical ruler  [0, 1]', color: ROLE.other, read: readOf(candidate) },
      { name: 'Horizontal ruler  [1, 0]', color: ROLE.first, read: readOf(orthogonal) },
      { name: 'Tilted ruler  [0.6, 0.8]', color: ROLE.second, read: readOf(overlapping) },
    ],
    max: dotProduct(vec.add(steeringBaseline, vec.scale(steeringDirection, ALPHA)), candidate),
  });

  s.add(
    atmo,
    title,
    b.node,
    baseRing,
    editArrow,
    dotEd,
    ...rulers.candidate,
    ...rulers.orthogonal,
    ...rulers.overlapping,
    steerEq,
    knob.rail,
    knob.activeTrack,
    knob.knob,
    knob.readout,
    ...bars.names,
    bars.bars,
  );

  const moveA =
    (to, dur = 1.6) =>
    (d) =>
      s.play(alpha.to(to, { duration: Math.min(dur, d) }));
  playCue(s, c, 'steer-add', moveA(ALPHA, 2.2), { dur: 2.2 });
  playCue(s, c, 'steer-rewind', moveA(0, 1.0), { dur: 1.0 });
  playCue(s, c, 'steer-grow', moveA(ALPHA, 2.4), { dur: 2.4 });

  const angle = angleMark(b.P([0, 0]), b.P(candidate), b.P(overlapping), {
    radius: 115,
    stroke: ROLE.mark,
    width: 4.5,
  });
  const collateralEq = glowTex('\\Delta\\,\\text{readout} = \\alpha\\,(r \\cdot d_f)', {
    x: rx,
    y: 315,
    size: 40,
    color: ROLE.mark,
    glow: 6,
  });
  c.show('steer-collateral', [angle, collateralEq]);

  const heldHead = txt('Measure on held-out prompts:', rx, 295, 28, COSMOS.muted, 'sans', 'center');
  const heldRow = txt(
    'target behavior  +  collateral behavior',
    rx,
    348,
    30,
    ROLE.mark,
    'sans',
    'center',
  ).glow(6, ROLE.mark);
  c.swap('steer-heldout', collateralEq, [heldHead, heldRow]);

  // --- Beat 2: Cached decomposition edit vs untied encoder readback ---
  const readerRuler = b.rulerOf(READER, ROLE.mark, -0.3, 2.0, { width: 3.5, dash: [13, 9] });
  const rereadShadow = b.shadowOf(edited, READER, ROLE.mark, 9);
  const cachedNote = txt(
    `Starting cached coefficient: ${cached.toFixed(2)}`,
    rx,
    -248,
    28,
    COSMOS.muted,
    'mono',
    'center',
  );
  c.show('steer-clamp', cachedNote);

  const clampBars = glowReadoutBars({
    left: 205,
    top: -85,
    width: 610,
    rowGap: 135,
    items: [
      {
        name: 'Saved decomposition (0.4 + α)',
        color: ROLE.other,
        read: () => cached + alpha.value,
      },
      {
        name: 'Re-encoded by encoder [1, 2]',
        color: ROLE.mark,
        read: readOf(READER),
      },
    ],
    max: cached + ALPHA * dotProduct(READER, steeringDirection),
  });

  c.swap(
    'steer-clamp',
    [
      ...rulers.orthogonal,
      ...rulers.overlapping,
      ...rulers.candidate,
      angle,
      heldHead,
      heldRow,
      ...bars.names,
      bars.bars,
    ],
    [readerRuler, rereadShadow, ...clampBars.names, clampBars.bars],
  );
  playCue(s, c, 'steer-clamp', moveA(0, 0.8), { dur: 0.8 });
  playCue(s, c, 'steer-smaller', moveA(0.7, 1.5), { dur: 1.5 });

  const encGap = angleMark(b.P([0, 0]), b.P(steeringDirection), b.P(READER), {
    radius: 145,
    stroke: ROLE.mark,
    width: 4.5,
  });
  const encRule = txt('Encoder reads x₁ + 2x₂', rx, 275, 36, ROLE.mark, 'mono', 'center').glow(
    6,
    ROLE.mark,
  );
  const switchNote = txt(
    'With thresholds, an edit can flip another slot on/off',
    rx,
    340,
    26,
    COSMOS.muted,
    'sans',
    'center',
  );
  c.show('steer-differ', [encGap, encRule]);
  c.show('steer-switch', switchNote);
}
