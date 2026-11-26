// Scene 13: protocol: "Hold the scoring conditions fixed"
// View 1 (Beat 0): Control-lock instrument dials holding 4 scoring controls fixed so only
//   checkpoint weights rotate freely (zero boxed prose cards).
// View 2 (Beat 1): Live context-window caliper sliding past "amber means queued" while
//   probability for "queued" plunges from 80% (0.223 nats) to 20% (1.609 nats), +ln(4) nats.
// View 3 (Beat 2): Provenance radar sweeping over support tickets to check prior exposure.
import { circle, line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, fmt, glowRing, lumBar, playCue, swapVis } from '../parts.mjs';

export default function protocol(s, c) {
  const title = heroTitle(['Hold the scoring', 'conditions fixed'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.prob,
  });

  const vControls = s.value(1);
  const vClue = s.value(0);
  const vSource = s.value(0);

  // View 1 state
  const lockT = s.value(0); // locks 4 control dials in emerald
  const weightSpin = s.value(0); // turns the single free checkpoint-weights dial

  // View 2 state
  const clueCut = s.value(0); // 0 -> 1 slides history caliper past "amber means queued"
  const showLong = s.value(0); // AFTER protocol-long-share: 80% -> 0.223 nats
  const showShort = s.value(0); // AFTER protocol-short-share: 20% -> 1.609 nats

  // View 3 state
  const radarAngle = s.value(0);

  // VIEW 1: 4 locked control dials + 1 free checkpoint-weights rotor
  const controlsLayer = guardedDynamic(vControls, (alpha) => {
    const nodes = [];
    const lt = lockT.value;
    const ws = weightSpin.value;

    const dials = [
      { x: -640, y: -60, name: 'Corpus & Split', sub: 'same tickets' },
      { x: -215, y: -60, name: 'Tokenizer', sub: 'same objective' },
      { x: 215, y: -60, name: 'Context & Stride', sub: 'eval(), raw logits' },
      { x: 640, y: -60, name: 'Boundaries', sub: 'same target mask' },
    ];

    dials.forEach((d, idx) => {
      const lit = lt > idx * 0.2;
      const col = lit ? ROLE.good : ROLE.context;
      nodes.push(
        glowRing(d.x, d.y, 74, col, { width: 3.4, glow: lit ? 11 : 5, opacity: alpha }),
        line([d.x, d.y], [d.x, d.y - 54], { stroke: col, width: 4 })
          .glow(8, col)
          .opacity(alpha),
        glowDot(d.x, d.y, { radius: 7, color: col, glow: 10, opacity: alpha }),
        txt('LOCKED', d.x, d.y + 34, 26, col, 'mono', 'center').opacity((0.45 + 0.55 * lt) * alpha),
        txt(d.name, d.x, d.y - 118, 28, COSMOS.ink, 'serif', 'center').opacity(alpha),
        txt(d.sub, d.x, d.y + 114, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    });

    // Bottom central free variable: Checkpoint Weights rotor
    const wx = 0;
    const wy = 235;
    const ang = -Math.PI * 0.75 + ws * Math.PI * 1.1;
    nodes.push(
      glowRing(wx, wy, 82, ROLE.observed, { width: 4, glow: 14, opacity: alpha }),
      line([wx, wy], [wx + Math.cos(ang) * 62, wy + Math.sin(ang) * 62], {
        stroke: ROLE.observed,
        width: 5,
      })
        .glow(10, ROLE.observed)
        .opacity(alpha),
      glowDot(wx, wy, { radius: 8, color: ROLE.observed, glow: 12, opacity: alpha }),
      txt('ONLY FREE VARIABLE:', wx - 130, wy - 20, 26, COSMOS.muted, 'mono', 'right').opacity(
        alpha,
      ),
      txt('Checkpoint weights', wx - 130, wy + 26, 36, ROLE.observed, 'serif', 'right')
        .glow(7, ROLE.observed)
        .opacity(alpha),
      txt(
        'Dropout OFF  ·  no temperature / top-k',
        wx + 130,
        wy,
        28,
        ROLE.prob,
        'mono',
        'left',
      ).opacity(alpha),
    );

    return nodes;
  });

  // VIEW 2: Context-cut experiment ("amber means queued" -> 80% vs 20%)
  const clueLayer = guardedDynamic(vClue, (alpha) => {
    const nodes = [];
    const cc = clueCut.value;
    const sl = showLong.value;
    const ss = showShort.value;
    const cutDone = cc > 0.75;

    nodes.push(
      txt(
        'Same model  ·  Same target word: "queued"',
        0,
        -265,
        32,
        ROLE.observed,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Upper text spans
    const spanY = -135;
    const clueCol = cutDone ? COSMOS.dim : ROLE.context;
    nodes.push(
      lumBar(-405, spanY, 720, 92, {
        color: clueCol,
        fillOpacity: cutDone ? 0.08 : 0.24,
        strokeWidth: 2.6,
        glow: cutDone ? 2 : 9,
        radius: 12,
        opacity: (cutDone ? 0.42 : 1) * alpha,
      }),
      txt(
        'Earlier line: "amber means queued"',
        -405,
        spanY,
        32,
        clueCol,
        'serif',
        'center',
      ).opacity((cutDone ? 0.45 : 1) * alpha),

      lumBar(405, spanY, 720, 92, {
        color: ROLE.prob,
        fillOpacity: 0.26,
        strokeWidth: 2.8,
        glow: 10,
        radius: 12,
        opacity: alpha,
      }),
      txt(
        'Current prompt: "status for amber?"',
        405,
        spanY,
        32,
        COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),
    );

    // Sliding glowing cyan history caliper underneath
    const calLeft = -765 + cc * 810;
    const calRight = 765;
    const calY = -42;
    nodes.push(
      glowingTrail(
        [
          [calLeft, calY - 22],
          [calLeft, calY],
          [calRight, calY],
          [calRight, calY - 22],
        ],
        { color: ROLE.prob, width: 4.5, glow: 11, opacity: alpha },
      ),
      txt(
        'Context window in view',
        (calLeft + calRight) / 2,
        calY + 42,
        28,
        ROLE.prob,
        'mono',
        'center',
      )
        .glow(6, ROLE.prob)
        .opacity(alpha),
    );

    // Lower comparison probability bars (withheld until spoken!)
    const barLeft = -335;
    const barW = 540;
    const rows = [
      {
        label: 'With the clue',
        p: 0.8,
        y: 155,
        col: ROLE.good,
        vis: 1,
        rev: sl,
      },
      {
        label: 'Clue cut off',
        p: 0.2,
        y: 280,
        col: ROLE.warn,
        vis: cutDone ? 1 : 0,
        rev: ss,
      },
    ];

    rows.forEach((r) => {
      if (r.vis < 0.05) return;
      const op = r.vis * alpha;
      nodes.push(
        txt(r.label, barLeft - 36, r.y, 34, r.col, 'serif', 'right').opacity(op),
        lumBar(barLeft + barW / 2, r.y, barW, 56, {
          color: '#344775',
          fillOpacity: 0.14,
          strokeWidth: 2,
          glow: 3,
          opacity: op,
        }),
      );
      if (r.rev > 0.1) {
        const fw = Math.max(12, barW * r.p * r.rev);
        nodes.push(
          lumBar(barLeft + fw / 2, r.y, fw, 50, {
            color: r.col,
            fillOpacity: 0.56,
            strokeWidth: 2.6,
            glow: 11,
            opacity: op,
          }),
          txt(`${Math.round(r.p * 100)}%`, barLeft + barW + 38, r.y, 36, r.col, 'mono', 'left')
            .glow(7, r.col)
            .opacity(r.rev * op),
          txt(
            `→  ${fmt(-Math.log(r.p), 3)} nats`,
            barLeft + barW + 150,
            r.y,
            36,
            r.col,
            'mono',
            'left',
          )
            .glow(7, r.col)
            .opacity(r.rev * op),
        );
      }
    });

    if (ss > 0.5) {
      nodes.push(
        txt(
          'One dropped context line adds +ln(4) ≈ +1.386 nats with identical weights!',
          0,
          395,
          30,
          ROLE.observed,
          'mono',
          'center',
        )
          .glow(7, ROLE.observed)
          .opacity(ss * alpha),
      );
    }

    return nodes;
  });

  // VIEW 3: Provenance radar check
  const sourceLayer = guardedDynamic(vSource, (alpha) => {
    const nodes = [];
    const ang = radarAngle.value;
    const cx = 0;
    const cy = 15;

    [68, 132, 195].forEach((r, idx) => {
      nodes.push(
        circle(r, { fill: null, stroke: idx === 2 ? ROLE.observed : ROLE.context, width: 2.2 })
          .at(cx, cy)
          .opacity((0.35 + idx * 0.15) * alpha),
      );
    });

    const sx = cx + Math.cos(ang) * 195;
    const sy = cy + Math.sin(ang) * 195;
    nodes.push(
      glowingTrail(
        [
          [cx, cy],
          [sx, sy],
        ],
        { color: ROLE.observed, width: 4.5, glow: 12, opacity: alpha },
      ),
      glowDot(cx, cy, { radius: 8, color: ROLE.observed, glow: 12, opacity: alpha }),
      glowDot(cx - 245, cy - 85, { radius: 10, color: ROLE.warn, glow: 14, opacity: alpha }),
      txt('training split?', cx - 280, cy - 85, 30, ROLE.warn, 'mono', 'right').opacity(alpha),
      glowDot(cx + 245, cy + 75, { radius: 10, color: ROLE.amber, glow: 14, opacity: alpha }),
      txt('checkpoint selection?', cx + 280, cy + 75, 30, ROLE.amber, 'mono', 'left').opacity(
        alpha,
      ),
      txt(
        'Before trusting any score: did either checkpoint already see these tickets?',
        0,
        355,
        34,
        ROLE.observed,
        'serif',
        'center',
      )
        .glow(8, ROLE.observed)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.prob, ROLE.observed), title, controlsLayer, clueLayer, sourceLayer);

  // Beat 0: lock controls -> spin checkpoint weights dial
  playCue(s, c, 'protocol-beat-1-focus-1', (d) => s.play(lockT.to(1, { duration: d })), {
    dur: 0.9,
  });
  playCue(s, c, 'protocol-beat-1-focus-2', (d) => s.play(weightSpin.to(1, { duration: d })), {
    dur: 0.9,
  });

  // Beat 1: swap to context-cut live experiment
  c.onBeat(1, () => s.play(swapVis(vControls, vClue, 0.55)));
  playCue(s, c, 'protocol-beat-2-focus-1', (d) => s.play(showLong.to(0.15, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'protocol-long-share', (d) => s.play(showLong.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'protocol-context-cut', (d) => s.play(clueCut.to(1, { duration: d })), {
    dur: 0.9,
  });
  playCue(s, c, 'protocol-short-share', (d) => s.play(showShort.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  // Beat 2: swap to provenance radar check
  c.onBeat(2, () => s.play(swapVis(vClue, vSource, 0.55)));
  playCue(
    s,
    c,
    'protocol-beat-3-focus-1',
    (d) => s.play(radarAngle.to(Math.PI * 1.8, { duration: d })),
    { dur: 1.8 },
  );
}
