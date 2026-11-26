// Scene 23: fresh-detail-boundary: Fresh null-direction patch ([4.5,1] + 3rd coord -4 vs -2) & fresh ID req_7f8a.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  labeledId,
  nextId,
  nextStrip,
  pixelStripNodes,
  playCue,
  rect,
  swapVis,
  txt,
  visionProject,
} from '../parts.mjs';

export default function freshDetailBoundary(s, c) {
  const view1Vis = s.value(1); // Fresh 2x2 patch null direction + 3rd coordinate
  const view2Vis = s.value(0); // Fresh incident ID req_7f8a verification
  const moveUnit = s.value(0);
  const revealEqual = s.value(0);
  const showThird = s.value(0);
  const revealDist = s.value(0);
  const showCheck = s.value(0);
  const showMatch = s.value(0);
  const showLookup = s.value(0);

  const refPatch = [2, 3, 6, 7];
  const editPatch = [3, 3, 5, 7];
  const ref2 = visionProject(refPatch, false); // [4.5, 1]
  const ref3 = visionProject(refPatch, true); // [4.5, 1, -4]
  const edit3 = visionProject(editPatch, true); // [4.5, 1, -2]

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Where Did the Detail', 'Disappear? (Fresh Check)'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.ok,
  });

  function patchBox(cx, cy, vals, label, color, alpha) {
    const cell = 105;
    const nodes = [txt(label, cx, cy - 135, 28, color, 'mono', 'center').opacity(alpha)];
    vals.forEach((v, idx) => {
      const r = Math.floor(idx / 2);
      const col = idx % 2;
      const x = cx + (col === 0 ? -56 : 56);
      const y = cy + (r === 0 ? -56 : 56);
      nodes.push(
        rect(cell, cell, { fill: '#101d36', stroke: color, width: 2.6, radius: 10 })
          .at(x, y)
          .opacity(alpha),
        txt(String(v), x, y, 42, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    });
    return group(...nodes);
  }

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const mv = moveUnit.value;
    const eq = revealEqual.value;
    const th = showThird.value;
    const ds = revealDist.value;
    const shownEdit = mv > 0.35 ? editPatch : refPatch;

    const nodes = [
      patchBox(-480, -35, refPatch, 'REFERENCE PATCH', ROLE.patch, alpha),
      patchBox(
        80,
        -35,
        shownEdit,
        mv > 0.35 ? 'EDITED (+1 UP LEFT COL)' : 'COPY OF PATCH',
        ROLE.pos,
        alpha,
      ),

      // Output tokens (withheld until fresh-projection-equality!)
      txt('PROJECTED TOKENS', 420, -170, 26, ROLE.ok, 'mono', 'left').opacity(alpha),
      chipPill(
        ds > 0.4
          ? `[${ref3[0].toFixed(1)}, ${ref3[1].toFixed(0)}, ${ref3[2].toFixed(0)}]`
          : eq > 0.4
            ? `[${ref2[0].toFixed(1)}, ${ref2[1].toFixed(0)}]`
            : '[ ?, ? ]',
        620,
        -75,
        {
          w: 390,
          h: 74,
          color: ds > 0.4 ? ROLE.ok : ROLE.patch,
          size: 32,
          opacity: alpha,
        },
      ),
      chipPill(
        ds > 0.4
          ? `[${edit3[0].toFixed(1)}, ${edit3[1].toFixed(0)}, ${edit3[2].toFixed(0)}]`
          : eq > 0.4
            ? `[${ref2[0].toFixed(1)}, ${ref2[1].toFixed(0)}]`
            : '[ ?, ? ]',
        620,
        30,
        {
          w: 390,
          h: 74,
          color: ds > 0.4 ? ROLE.ok : ROLE.pos,
          size: 32,
          opacity: alpha,
        },
      ),

      txt(
        ds > 0.4
          ? '3rd coord (top-left minus bottom-left): -4 vs -2 -> DISTINGUISHABLE!'
          : th > 0.3
            ? 'Add 3rd coordinate: top-left minus bottom-left...'
            : eq > 0.4
              ? 'Identical [4.5, 1] -> bridge cannot recover what projection erased!'
              : 'Could the same token-wise bridge tell these patches apart?',
        0,
        245,
        30,
        ds > 0.4 ? ROLE.ok : eq > 0.4 ? ROLE.warn : ROLE.pos,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const chk = showCheck.value;
    const mat = showMatch.value;
    const lkp = showLookup.value;

    const nodes = [
      txt(
        'FRESH INCIDENT CROP: READ THE DIGIT BETWEEN F AND A',
        -855,
        -215,
        26,
        ROLE.patch,
        'mono',
        'left',
      ).opacity(alpha),
      pixelStripNodes(nextStrip, -855, -170, 26, 15, { tint: ROLE.patch, opacity: alpha }),

      txt('SUPPLIED READINGS', -855, 25, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      chipPill(`Upper:  ${labeledId}`, -500, 120, {
        w: 440,
        h: 78,
        color: chk > 0.4 ? ROLE.warn : ROLE.patch,
        fill: chk > 0.4 ? '#2b1420' : '#10182d',
        size: 34,
        opacity: alpha * (1 - 0.35 * mat),
      }),
      chipPill(`Lower:  ${nextId}`, -500, 225, {
        w: 440,
        h: 78,
        color: mat > 0.4 ? ROLE.ok : ROLE.patch,
        fill: mat > 0.4 ? '#0f2d24' : '#10182d',
        size: 34,
        glow: mat > 0.4 ? 14 : 6,
        opacity: alpha,
      }),

      chipPill(
        lkp > 0.4 ? `OPEN TRACE: ${nextId}` : mat > 0.4 ? 'MATCH!' : 'Which ID opens the trace?',
        330,
        175,
        {
          w: 690,
          h: 92,
          color: mat > 0.4 ? ROLE.ok : ROLE.pos,
          fill: lkp > 0.4 ? '#103528' : '#10182d',
          size: 32,
          glow: lkp > 0.4 ? 16 : 6,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'fresh-move', (d) => s.play(moveUnit.to(1, { duration: d })));
  // Strict prediction withholding #1: reveal [4.5, 1] equality only after cue!
  playCue(s, c, 'fresh-projection-equality', (d) => s.play(revealEqual.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'fresh-third-coordinate', (d) => s.play(showThird.to(1, { duration: d })));
  playCue(s, c, 'fresh-distinguishable', (d) => s.play(revealDist.to(1, { duration: d })));
  playCue(s, c, 'fresh-reference', (d) => s.play(swapVis(view1Vis, view2Vis, d)));
  // Strict prediction withholding #2: reveal req_7f8a match only after cues!
  playCue(s, c, 'fresh-check-strings', (d) => s.play(showCheck.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'fresh-match', (d) => s.play(showMatch.to(1, { duration: d })), { after: true });
  playCue(s, c, 'fresh-lookup', (d) => s.play(showLookup.to(1, { duration: d })));
}
