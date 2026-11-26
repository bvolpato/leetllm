// Scene 14: contamination: "Changing a manifest leaves trained weights intact"
// View 1 (Beat 0): Provenance link graph showing ticket-103 direct ID reuse + ticket-904
//   copied-text alias bypassing exact ID match yet caught by content fingerprinting.
// View 2 (Beat 1): Manifest deletion on left while an orbiting 3D frozen-weight neural core
//   (cinematic3d + wireframeSlab3d) retains its glowing rose contamination imprint intact!
// View 3 (Beat 2): Dual-ring holdout architecture: stable private regression tickets (201, 202)
//   paired with rotating fresh challenge sources (301, 302, 303).
import { gridPlane3d, line } from 'vizmatic/stage';
import {
  COSMOS,
  cinematic3d,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
  wireframeSlab3d,
} from '../../cinematic-kit.mjs';
import { ROLE, arcPts, cinemaAtmosphere, glowRing, lumBar, playCue, swapVis } from '../parts.mjs';

export default function contamination(s, c) {
  const title = heroTitle(['Changing a manifest leaves', 'trained weights intact'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.warn,
  });

  const vCopy = s.value(1);
  const vFrozen = s.value(0);
  const vHoldout = s.value(0);

  const copyReveal = s.value(0); // Beat 0: ticket-904 copied content
  const deleteManifest = s.value(0); // Beat 1: removes training manifest row while 3D weights stay tainted
  const freshWave = s.value(0); // Beat 2: spawns fresh sources 301, 302, 303

  // 3D orbiting frozen-weight core (shown ONLY during View 2 / Beat 1!)
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.6,
    unit: 82,
    focus: [0, 0, 0.1],
  }).at(385, -18);

  const floor3d = gridPlane3d({
    x: [-2.8, 2.8],
    y: [-2.4, 2.4],
    z: -1.6,
    step: 1,
    color: '#2b3d69',
    opacity: 0.4,
  });
  const outerWeights = wireframeSlab3d([0, 0, 0.1], 1.75, 1.45, 1.25, {
    color: ROLE.context,
    width: 2.6,
    glow: 8,
  });
  const innerImprint = wireframeSlab3d([0, 0, 0.1], 0.82, 0.72, 0.62, {
    color: ROLE.warn,
    width: 3.4,
    glow: 14,
  });
  view3d.add(floor3d, ...outerWeights, ...innerImprint);

  // VIEW 1: ID overlap vs copied-content overlap
  const copyLayer = guardedDynamic(vCopy, (alpha) => {
    const nodes = [];
    const cr = copyReveal.value;

    const lx = -560;
    const rx = 560;
    const topY = -125;
    const botY = 170;

    nodes.push(
      txt('Training corpus', lx, -255, 30, ROLE.context, 'mono', 'center').opacity(alpha),
      txt('Evaluation split', rx, -255, 30, ROLE.warn, 'mono', 'center').opacity(alpha),

      lumBar(lx, topY, 440, 96, {
        color: ROLE.context,
        fillOpacity: 0.28,
        strokeWidth: 2.8,
        glow: 10,
        radius: 12,
        opacity: alpha,
      }),
      txt('Train: ticket-103', lx, topY, 32, ROLE.context, 'mono', 'center').opacity(alpha),

      lumBar(rx, topY, 440, 96, {
        color: ROLE.warn,
        fillOpacity: 0.28,
        strokeWidth: 2.8,
        glow: 10,
        radius: 12,
        opacity: alpha,
      }),
      txt('Eval: ticket-103', rx, topY, 32, ROLE.warn, 'mono', 'center').opacity(alpha),

      // Direct ID match beam (clean gap between boxes!)
      glowingTrail(
        [
          [lx + 235, topY],
          [rx - 235, topY],
        ],
        { color: ROLE.warn, width: 4.5, glow: 12, opacity: alpha },
      ),
      txt('exact ID match', 0, topY - 42, 26, ROLE.warn, 'mono', 'center').opacity(alpha),
    );

    // Copied passage under new ID ticket-904 (clean arc completely clear of boxes & labels!)
    const arc = arcPts([lx + 235, topY + 34], [rx - 235, botY - 12], -10, 28);
    const nPts = Math.max(2, Math.round(arc.length * Math.max(0.15, cr)));
    nodes.push(
      glowingTrail(arc.slice(0, nPts), {
        gradientColors: [ROLE.context, ROLE.observed, ROLE.warn],
        width: 4.2,
        glow: 11,
        opacity: (0.25 + 0.75 * cr) * alpha,
      }),
      lumBar(rx, botY, 440, 96, {
        color: ROLE.observed,
        fillOpacity: 0.16 + 0.2 * cr,
        strokeWidth: 2.6,
        glow: 6 + 6 * cr,
        radius: 12,
        opacity: (0.35 + 0.65 * cr) * alpha,
      }),
      txt(
        cr > 0.45 ? 'Eval: ticket-904' : 'Renamed eval copy',
        rx,
        botY,
        32,
        ROLE.observed,
        'mono',
        'center',
      ).opacity((0.35 + 0.65 * cr) * alpha),
      txt(
        'same copied passage (bypasses ID check)',
        -80,
        botY + 56,
        26,
        ROLE.observed,
        'mono',
        'center',
      )
        .glow(6, ROLE.observed)
        .opacity(cr * alpha),
      txt(
        'Check normalized text, near-duplicates, and provenance, not IDs alone.',
        0,
        365,
        30,
        COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // VIEW 2: Training manifest deletion vs intact 3D frozen-weight memory
  const frozenLayer = guardedDynamic(vFrozen, (alpha) => {
    const nodes = [];
    const dm = deleteManifest.value;
    const lx = -455;

    nodes.push(
      txt('Training manifest (disk)', lx, -210, 32, COSMOS.muted, 'mono', 'center').opacity(alpha),
      lumBar(lx, -55, 620, 108, {
        color: dm > 0.5 ? ROLE.warn : ROLE.context,
        fillOpacity: dm > 0.5 ? 0.12 : 0.26,
        strokeWidth: 2.6,
        glow: dm > 0.5 ? 6 : 9,
        radius: 12,
        opacity: (dm > 0.5 ? 0.65 : 1) * alpha,
      }),
      txt(
        dm > 0.5 ? 'ticket-103  [DELETED]' : 'ticket-103  [in manifest]',
        lx,
        -55,
        32,
        dm > 0.5 ? ROLE.warn : ROLE.context,
        'mono',
        'center',
      ).opacity(alpha),
    );

    if (dm > 0.4) {
      nodes.push(
        glowingTrail(
          [
            [lx - 240, 14],
            [lx + 240, 14],
          ],
          { color: ROLE.warn, width: 3.5, glow: 8, opacity: dm * alpha },
        ),
      );
    }

    nodes.push(
      txt(
        dm > 0.5 ? 'Row removed AFTER training' : 'Checkpoint already trained on row',
        lx,
        90,
        28,
        dm > 0.5 ? ROLE.warn : ROLE.observed,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Repair: fresh independent holdout', lx, 165, 28, ROLE.good, 'sans', 'center').opacity(
        alpha,
      ),
      txt('or retrain without exposure.', lx, 215, 28, ROLE.good, 'sans', 'center').opacity(alpha),

      // Captions cleanly above and below the 3D frozen-weight cube on the right
      txt(
        'Frozen checkpoint weights (unchanged!)',
        385,
        -325,
        30,
        ROLE.context,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Inner rose core: ticket-103 memory intact', 385, 335, 28, ROLE.warn, 'mono', 'center')
        .glow(8, ROLE.warn)
        .opacity(alpha),
      txt(
        'Keep checkpoint-selection splits strictly separate from final test.',
        0,
        408,
        28,
        ROLE.observed,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // VIEW 3: Stable private regression tickets + rotating fresh challenge sources
  const holdoutLayer = guardedDynamic(vHoldout, (alpha) => {
    const nodes = [];
    const fw = freshWave.value;

    // Upper tier: Fixed private holdout (regression tracking)
    nodes.push(
      txt(
        'Stable private holdout (regression tracking across releases)',
        0,
        -255,
        30,
        ROLE.context,
        'mono',
        'center',
      ).opacity(alpha),
    );
    [
      { x: -320, num: '201' },
      { x: 320, num: '202' },
    ].forEach((p) => {
      nodes.push(
        glowRing(p.x, -125, 58, ROLE.context, { width: 3, glow: 10, opacity: alpha }),
        txt(p.num, p.x, -125, 30, ROLE.context, 'mono', 'center').opacity(alpha),
        txt(`Private ${p.num}`, p.x, -34, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    });

    // Lower tier: Rotating fresh challenge sources (301, 302, 303)
    nodes.push(
      txt(
        'Rotating fresh challenge sources (unfamiliar text + logged release dates)',
        0,
        55,
        30,
        ROLE.good,
        'mono',
        'center',
      ).opacity((0.4 + 0.6 * fw) * alpha),
    );

    const freshXs = [-520, 0, 520];
    [301, 302, 303].forEach((id, i) => {
      const lit = fw >= i * 0.28 + 0.05;
      const op = (lit ? 1 : 0.25) * alpha;
      nodes.push(
        glowRing(freshXs[i], 180, 62, ROLE.good, {
          width: 3.4,
          glow: lit ? 12 : 3,
          opacity: op,
        }),
        txt(String(id), freshXs[i], 180, 32, ROLE.good, 'mono', 'center')
          .glow(lit ? 7 : 0, ROLE.good)
          .opacity(op),
        txt(`Fresh ${id}`, freshXs[i], 274, 26, ROLE.good, 'mono', 'center').opacity(op),
      );
    });

    nodes.push(
      glowDot(-520, 318, { radius: 6, color: ROLE.prob, glow: 8, opacity: alpha }),
      glowDot(520, 318, { radius: 6, color: ROLE.prob, glow: 8, opacity: alpha }),
      txt(
        'Save dataset revision and release date alongside training history.',
        0,
        388,
        30,
        ROLE.observed,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.warn, ROLE.context), title, copyLayer, frozenLayer, holdoutLayer);

  // Beat 0: reveal copied ticket-904
  playCue(s, c, 'new-copy-id', (d) => s.play(copyReveal.to(1, { duration: d })), { dur: 0.75 });

  // Beat 1: swap to manifest deletion + show & orbit 3D frozen-weight core strictly AFTER vCopy fades out!
  c.show(1, view3d, { lead: -0.32 });
  c.onBeat(1, () => {
    s.play(swapVis(vCopy, vFrozen, 0.55));
    const beat2Start = c.beats[2].start;
    const dur3d = Math.max(0.8, beat2Start - c.beats[1].start - 0.8);
    s.play(view3d.orbit({ theta: -0.15, phi: 0.94, distance: 14.0 }, { duration: dur3d }));
  });
  playCue(s, c, 'manifest-delete', (d) => s.play(deleteManifest.to(1, { duration: d })), {
    dur: 0.75,
  });

  // Beat 2: hide 3D view & swap to stable + fresh holdout rings
  c.hide(2, view3d);
  c.onBeat(2, () => s.play(swapVis(vFrozen, vHoldout, 0.55)));
  playCue(s, c, 'fresh-challenges', (d) => s.play(freshWave.to(1, { duration: d })), { dur: 0.95 });
  void line;
}
