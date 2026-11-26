// Scene 1: intro - "Did the password signal get stronger?"
// Act 1: Glowing prompt ("Reset my password" + sliding luminous "now") above a luminous coordinate
//        spectrum bar rising 1.50 -> 2.30, then splitting into blue password (1.50) + pink urgency (0.80).
// Act 2: Full-bleed glowing 2D activation plane (blue + pink tip-to-tail -> x = [2.30, 0.60]) paired
//        with an orbiting 3D overcomplete feature-space sphere on the right; then orthogonal rotation
//        casting dual shadows on x1; then restoring the candidate mixture.
import { dynamic, group, indicate, line, linear, rightAngle, shift } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  buildOvercomplete3d,
  cinemaAtmosphere,
  cinemaPlane,
  glowDot,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  rule,
  txt,
  vec,
} from '../parts.mjs';
import { credential, resetState, urgency } from '../reset-example.mjs';

export default function intro(s, c) {
  const atmo = cinemaAtmosphere(ROLE.first, ROLE.second);
  s.add(atmo);

  const titleQ = heroTitle(['Did the password signal', 'get stronger?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 62,
    accent: ROLE.mark,
  });
  const titleShared = heroTitle(['Two features share', 'this coordinate'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 62,
    accent: ROLE.second,
  });
  const titleGeo = heroTitle(['How two directions share', 'one coordinate'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.other,
  });

  // --- ACT 1: Prompt ribbon + glowing coordinate meter ---
  const promptY = -140;
  const promptText = txt('Reset my password', -620, promptY, 72, COSMOS.ink, 'serif', 'left');
  const wordNow = group(
    lumBar(155, promptY, 198, 94, {
      color: ROLE.second,
      fillOpacity: 0.28,
      strokeWidth: 3,
      glow: 12,
      radius: 14,
    }),
    txt('now', 155, promptY, 70, ROLE.second, 'serif', 'center').glow(8, ROLE.second),
  );
  const caret = line([48, promptY - 46], [48, promptY + 46], {
    stroke: ROLE.mark,
    width: 4.5,
  }).glow(8, ROLE.mark);
  wordNow.shift(260, 0);

  const extra = s.value(0);
  const initial = resetState(0).activation[0]; // 1.5
  const total = resetState(1).activation[0]; // 2.3
  const current = () => resetState(1, { pink: extra.value }).activation[0];

  const barLeft = -780;
  const barRight = 780;
  const barW = barRight - barLeft;
  const barY = 175;
  const unit = barW / 3;
  const xOf = (val) => barLeft + val * unit;

  const meterLabel = txt(
    'First activation coordinate  (x₁)',
    barLeft,
    barY - 122,
    34,
    COSMOS.muted,
    'sans',
    'left',
  );
  const track = rule(barLeft, barY + 32, barRight, barY + 32, '#2e3e63', 4);
  const scaleTicks = [0, 1, 2, 3].flatMap((n) => [
    line([xOf(n), barY + 34], [xOf(n), barY + 48], { stroke: '#4c5f8c', width: 2.5 }),
    txt(String(n), xOf(n), barY + 76, 26, COSMOS.dim, 'mono', 'center'),
  ]);

  const joined = dynamic(() => {
    const w = Math.max(4, current() * unit);
    return lumBar(barLeft + w / 2, barY, w, 58, {
      color: ROLE.mark,
      fillOpacity: 0.42,
      strokeWidth: 2.8,
      glow: 12,
      radius: 8,
    });
  });

  const reading = dynamic(() => {
    const val = current();
    return [
      glowDot(xOf(val), barY, { radius: 8, color: ROLE.mark, glow: 14 }),
      txt(val.toFixed(2), xOf(val), barY - 82, 74, ROLE.mark, 'mono', 'center').glow(10, ROLE.mark),
    ];
  });

  const beforeTick = line([xOf(initial), barY + 34], [xOf(initial), barY + 95], {
    stroke: COSMOS.muted,
    width: 3.5,
    dash: [7, 5],
  });
  const beforeLabel = txt(
    `Before  ${initial.toFixed(2)}`,
    xOf(initial),
    barY + 132,
    34,
    COSMOS.muted,
    'mono',
    'center',
  );

  // Subtle decorative horizontal guide lines framing Act 1 so space stays visually balanced
  const promptRule = rule(-820, -45, 820, -45, COSMOS.rule, 1.8).opacity(0.55);

  const opening = [
    titleQ,
    promptText,
    caret,
    wordNow,
    promptRule,
    meterLabel,
    track,
    ...scaleTicks,
    joined,
    reading,
    beforeTick,
    beforeLabel,
  ];
  s.add(opening);

  const nowDur = Math.max(0.35, c.cue('intro-now').end - c.window.from);
  s.play(shift(wordNow, -260, 0), { duration: nowDur, ease: linear });
  c.hide('intro-now', caret, { after: true });
  playCue(s, c, 'intro-meter', (d) => s.play(extra.to(1, { duration: d })), { dur: 1.25 });

  // Split bar reveals (strictly at cues, never early)
  const segBlue = lumBar((barLeft + xOf(initial)) / 2, barY, initial * unit - 4, 58, {
    color: ROLE.first,
    fillOpacity: 0.48,
    strokeWidth: 2.8,
    glow: 10,
    radius: 8,
  });
  const segPink = lumBar((xOf(initial) + xOf(total)) / 2, barY, (total - initial) * unit - 4, 58, {
    color: ROLE.second,
    fillOpacity: 0.48,
    strokeWidth: 2.8,
    glow: 10,
    radius: 8,
  });
  const blueLbl = txt(
    `password  ${initial.toFixed(2)}`,
    (barLeft + xOf(initial)) / 2,
    barY,
    34,
    COSMOS.ink,
    'mono',
    'center',
  );
  const pinkLbl = txt(
    `urgency  ${(total - initial).toFixed(2)}`,
    (xOf(initial) + xOf(total)) / 2,
    barY,
    32,
    COSMOS.ink,
    'mono',
    'center',
  );

  c.swap('intro-unpack', joined, [segBlue, segPink], { lead: 0 });
  c.show('intro-same', blueLbl);
  c.show('intro-urgency', pinkLbl);
  c.swap('intro-urgency', titleQ, titleShared, { after: true });

  // --- ACT 2: Glowing 2D Activation Plane + Orbiting 3D Feature Space ---
  const b = cinemaPlane(s, {
    cx: -355,
    cy: 110,
    width: 960,
    height: 700,
    x: [-1.3, 2.9],
    y: [-1.4, 1.8],
  });
  const length = s.value(0);
  const tip = () => vec.add(credential, vec.scale(urgency, length.value));
  const projection = () => [tip()[0], 0];

  const blueArrow = b.arrowOf([0, 0], credential, ROLE.first, { width: 7.5 });
  const pinkArrow = b.arrowOf(credential, tip, ROLE.second, { width: 7.5 });
  const dotTip = b.dotOf(tip, ROLE.activation, 11, 14);
  const dropLine = b.segmentOf(tip, projection, ROLE.mark, { width: 3.5, dash: [9, 8] });
  const horizShadow = b.segmentOf(credential, projection, ROLE.second, {
    lift: [0, 62],
    width: 11,
    glow: 9,
  });

  // Right side: floating vector decomposition + orbiting 3D overcomplete feature sphere
  const rx = 250;
  const blueHead = txt('Credential', rx, -295, 34, ROLE.first, 'sans', 'left').glow(6, ROLE.first);
  const blueVec = txt('1.5 × [1.0, 0.0]', rx, -245, 32, COSMOS.ink, 'mono', 'left');
  const pinkHead = txt('Urgency', rx, -165, 34, ROLE.second, 'sans', 'left').glow(6, ROLE.second);
  const pinkVec = txt('1.0 × [0.8, 0.6]', rx, -115, 32, COSMOS.ink, 'mono', 'left');
  const pointReadout = dynamic(() =>
    txt(
      `x = [${tip()
        .map((v) => v.toFixed(2))
        .join(', ')}]`,
      rx,
      -20,
      40,
      ROLE.mark,
      'mono',
      'left',
    ).glow(7, ROLE.mark),
  );

  // Signature orbiting 3D overcomplete superposition sphere anchored in lower-right
  const super3d = buildOvercomplete3d({
    x: 545,
    y: 235,
    radius: 2.15,
    rayCount: 14,
    activeIndices: [0, 1],
    activeColors: [ROLE.first, ROLE.second],
    unit: 86,
  });
  const superCaption = txt(
    'Superposition: directions packed in high-D',
    545,
    452,
    26,
    COSMOS.muted,
    'sans',
    'center',
  );

  c.swapAll(
    'intro-arrows',
    [
      titleGeo,
      b.node,
      blueArrow,
      dotTip,
      blueHead,
      blueVec,
      pointReadout,
      super3d.view,
      superCaption,
    ],
    { keep: [atmo] },
  );

  // Orbit the 3D sphere smoothly from intro-arrows until just before scene end
  const arrowsStart = c.cue('intro-arrows').start;
  const orbitDur = Math.max(1, c.end - arrowsStart - 0.55);
  c.on('intro-arrows', () => {
    s.play(super3d.view.orbit({ theta: 1.15, phi: 0.96 }, { duration: orbitDur }));
  });

  c.show('intro-slant', [pinkArrow, dropLine, horizShadow, pinkHead, pinkVec]);
  playCue(s, c, 'intro-slant', (d) => s.play(length.to(1, { duration: d })), { dur: 1.5 });

  // --- ACT 3: Orthogonal pair rotation ---
  const turn = s.value(0);
  const u = () => [Math.cos(turn.value), Math.sin(turn.value)];
  const v = () => [Math.sin(turn.value), -Math.cos(turn.value)];
  const orthoPair = [
    b.arrowOf([0, 0], u, ROLE.other, { width: 7 }),
    b.arrowOf([0, 0], v, ROLE.other, { width: 7 }),
    dynamic(() => rightAngle(b.P([0, 0]), b.P(u()), b.P(v()), { stroke: ROLE.other, width: 3.5 })),
    b.shadowOf(u, [1, 0], ROLE.other, 8),
    b.shadowOf(v, [1, 0], ROLE.other, 8),
  ];

  const orthoLine1 = txt('2 directions in 2D', rx, -280, 38, COSMOS.ink, 'sans', 'left');
  const orthoLine2 = txt('90° apart (orthogonal)', rx, -220, 32, ROLE.other, 'mono', 'left').glow(
    6,
    ROLE.other,
  );
  const orthoLine3 = txt('Both cast a shadow on x₁', rx, -145, 32, ROLE.mark, 'sans', 'left').glow(
    6,
    ROLE.mark,
  );

  c.swap(
    'intro-rotate',
    [
      blueArrow,
      pinkArrow,
      dotTip,
      dropLine,
      horizShadow,
      pointReadout,
      blueHead,
      blueVec,
      pinkHead,
      pinkVec,
    ],
    [...orthoPair, orthoLine1, orthoLine2],
  );
  playCue(s, c, 'intro-rotate', (d) => s.play(b.ticksAlpha.to(0, { duration: d })), { dur: 0.25 });
  playCue(
    s,
    c,
    'intro-turn',
    (d) => s.play(turn.to(Math.atan2(urgency[1], urgency[0]), { duration: d })),
    { dur: 1.5 },
  );
  c.show('intro-shadows', orthoLine3);

  // --- ACT 4: Restore candidate mixture for SAE motivation ---
  c.hide('intro-find', orthoPair);
  playCue(s, c, 'intro-find', (d) => s.play(b.ticksAlpha.to(1, { duration: d })), { dur: 0.3 });
  c.swap(
    'intro-find',
    [orthoLine1, orthoLine2, orthoLine3],
    [blueArrow, pinkArrow, dotTip, blueHead, blueVec, pinkHead, pinkVec, pointReadout],
  );
  playCue(
    s,
    c,
    'intro-find',
    (d) => s.play(indicate(pointReadout, { color: ROLE.other, scale: 1.06, duration: d })),
    { offset: 0.6, dur: 0.8 },
  );
}
