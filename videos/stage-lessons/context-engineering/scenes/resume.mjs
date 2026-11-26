// Scene 21: resume: "Bind a resume receipt to its actual inputs"
// Orbiting 3D dual-hash checkpoint prism + live SHA-256 verification across 3 beats:
// B0: Unchanged artifact & deploy rev 7 -> receipt matches -> select next task.
// B1: Deploy rev 8 -> artifact matches, input digest fails -> stale checkpoint blocked.
// B2: Input restored, artifact edited -> artifact digest fails -> integrity check stops resume.
import {
  COSMOS,
  RESUME_CHANGED_ARTIFACT,
  RESUME_CHANGED_INPUT,
  RESUME_OK,
  ROLE,
  aura,
  checkMark,
  cinematic3d,
  cornerBrackets,
  crossMark,
  ease,
  glowTex,
  gridPlane3d,
  group,
  guardedDynamic,
  heroTitle,
  hash,
  orbitScene,
  originalArtifact,
  originalInputs,
  playCue,
  receipt,
  short,
  txt,
  wireframeSlab3d,
} from '../parts.mjs';

export default function resume(s, c) {
  const stateIdx = s.value(0); // 0 = ok, 1 = input changed, 2 = artifact changed
  const showNext = s.value(0);

  const bgAura = aura(340, 20, 780, '#1435282c', '#14335c28');
  const title = heroTitle(['Bind a resume receipt', 'to its actual inputs'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.note,
  });

  const eq = glowTex(
    String.raw`\mathrm{valid} \iff H(\mathrm{artifact}) = h_a \;\land\; H(\mathrm{inputs}) = h_i`,
    { x: 345, y: -395, size: 32, color: ROLE.units, glow: 7 },
  );

  // Orbiting 3D dual-layer checkpoint receipt prism on lower-right
  const view3d = cinematic3d({
    theta: -0.74,
    phi: 1.04,
    distance: 15.2,
    unit: 70,
    focus: [0, 0, 0.3],
  }).at(510, 25);
  const floor3d = gridPlane3d({
    x: [-2.6, 2.6],
    y: [-2.0, 2.0],
    z: -0.9,
    step: 0.85,
    color: '#2c3d69',
    opacity: 0.48,
  });
  const inputSlab = wireframeSlab3d([0, 0, -0.25], 1.55, 1.15, 0.32, {
    color: ROLE.evidence,
    width: 2.5,
    glow: 8,
  });
  const artifactSlab = wireframeSlab3d([0, 0, 0.72], 1.55, 1.15, 0.32, {
    color: ROLE.note,
    width: 2.8,
    glow: 10,
  });
  view3d.add(floor3d, ...inputSlab, ...artifactSlab);
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.94, distance: 14.0 });

  const changedArtHash = hash(`${originalArtifact} changed`);
  const changedInpHash = hash(JSON.stringify({ revision: 8 }));

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = stateIdx.value;
    const step = st < 0.5 ? 0 : st < 1.5 ? 1 : 2;
    const nx = ease(showNext.value);

    const artHash = step === 2 ? changedArtHash : receipt.artifact;
    const inpHash = step === 1 ? changedInpHash : receipt.inputs.deploy;
    const res =
      step === 0 ? RESUME_OK : step === 1 ? RESUME_CHANGED_INPUT : RESUME_CHANGED_ARTIFACT;

    const x0 = -855;
    const nodes = [
      eq.opacity(alpha),

      // Artifact hash comparison
      cornerBrackets(-340, -105, 1020, 170, res.artifactMatch ? ROLE.note : ROLE.poison, {
        arm: 26,
        width: 3,
        opacity: alpha,
      }),
      txt(
        'ARTIFACT SHA-256  (report.json)',
        x0 + 20,
        -155,
        26,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        `Saved:   ${short(receipt.artifact, 12)}   Current: ${short(artHash, 12)}`,
        x0 + 20,
        -95,
        30,
        res.artifactMatch ? COSMOS.ink : ROLE.poison,
        'mono',
        'left',
      ).opacity(alpha),
      res.artifactMatch
        ? checkMark(120, -95, 28, ROLE.note, alpha)
        : crossMark(120, -95, 28, ROLE.poison, alpha),
      txt(
        step === 2 ? 'Artifact bytes altered -> MISMATCH' : 'Artifact bytes unchanged -> MATCH',
        x0 + 20,
        -44,
        26,
        res.artifactMatch ? ROLE.note : ROLE.poison,
        'mono',
        'left',
      ).opacity(alpha),

      // Input hash comparison
      cornerBrackets(-340, 115, 1020, 170, res.inputMatch ? ROLE.note : ROLE.poison, {
        arm: 26,
        width: 3,
        opacity: alpha,
      }),
      txt(
        step === 1
          ? 'INPUT SHA-256  (deploy.json -> rev 8)'
          : 'INPUT SHA-256  (deploy.json -> rev 7)',
        x0 + 20,
        65,
        26,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        `Saved:   ${short(receipt.inputs.deploy, 12)}   Current: ${short(inpHash, 12)}`,
        x0 + 20,
        125,
        30,
        res.inputMatch ? COSMOS.ink : ROLE.poison,
        'mono',
        'left',
      ).opacity(alpha),
      res.inputMatch
        ? checkMark(120, 125, 28, ROLE.note, alpha)
        : crossMark(120, 125, 28, ROLE.poison, alpha),
      txt(
        step === 1
          ? 'Input revision changed -> RECEIPT STALE'
          : 'Input revision unchanged -> MATCH',
        x0 + 20,
        176,
        26,
        res.inputMatch ? ROLE.note : ROLE.poison,
        'mono',
        'left',
      ).opacity(alpha),

      // Verdict readout
      txt(
        res.passed
          ? nx > 0.3
            ? 'RECEIPT VALID -> ADVANCE TO NEXT DEPENDENT TASK'
            : 'RECEIPT VALID (BOTH DIGESTS MATCH)'
          : step === 1
            ? 'STOP RESUME: INPUT CHANGED (RECHECK AGAINST REV 8)'
            : 'STOP RESUME: ARTIFACT DIGEST MISMATCH',
        x0,
        285,
        32,
        res.passed ? ROLE.note : ROLE.poison,
        'mono',
        'left',
      )
        .glow(8, res.passed ? ROLE.note : ROLE.poison)
        .opacity(alpha),

      // Right 3D caption
      txt('DUAL-LAYER CHECKPOINT PRISM', 510, 318, 26, ROLE.note, 'mono', 'center').opacity(alpha),
      txt('Top: Artifact  |  Bottom: Inputs', 510, 360, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),

      // Bottom footer
      txt(
        step === 2
          ? 'Hashes verify byte consistency; freshness, evaluator identity & permissions sit around the receipt.'
          : 'Recompute both artifact and input digests before reusing prior work across restarts.',
        0,
        420,
        29,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, view3d, layer);

  playCue(s, c, 'resume-beat-1-focus-1', (d) => s.play(stateIdx.to(0, { duration: d })));
  playCue(s, c, 'resume-beat-1-focus-2', (d) => s.play(showNext.to(1, { duration: d })));
  playCue(s, c, 'resume-beat-2-focus-1', (d) => s.play(stateIdx.to(1, { duration: d })));
  playCue(s, c, 'resume-beat-3-focus-1', (d) => s.play(stateIdx.to(2, { duration: d })));
}
