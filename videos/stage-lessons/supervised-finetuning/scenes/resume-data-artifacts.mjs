// Scene 18: Can you reproduce the next update?: Serving vs Resumable state + payload scan + restore drill track.
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function resumeDataArtifacts(s, c) {
  const phase = s.value(0);
  const showResumeRing = s.value(0);
  const verifyScan = s.value(0);
  const drillView = s.value(0);

  const bgAura = aura(0, 30, 620, '#60a5fa1e', '#ffd16614');
  const title = heroTitle(['Serving Export vs.', 'Resumable Checkpoint'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'STATE ARTIFACTS & RESTORE DRILL',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const rr = showResumeRing.value;
    const vs = verifyScan.value;
    const dv = drillView.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const nodes = [];

    if (dv < 0.5) {
      const a = 1 - dv * 2;
      // Top track: Serving export (3 glowing state capsules)
      const serveY = -125;
      const xs = [-550, 0, 550];
      const serveItems = [
        'Weights + Architecture',
        'Tokenizer + Chat Template',
        'Adapter Config + Base Rev',
      ];
      nodes.push(
        txt('1 · SERVING EXPORT (INFERENCE ONLY)', -825, -225, 28, COSMOS.cyan, 'mono', 'left')
          .glow(5, COSMOS.cyan)
          .opacity(a),
      );
      serveItems.forEach((label, i) => {
        nodes.push(
          glassCell(xs[i], serveY, 500, 108, COSMOS.cyan, { fill: '#0e1f30', glow: 7, opacity: a }),
          txt(label, xs[i], serveY, 28, COSMOS.ink, 'mono').opacity(a),
        );
      });

      // Bottom track: Continuation state (lights up on resume-data-artifacts-b1)
      const resY = 145;
      const resumeItems = [
        'AdamW Moments + Step',
        'LR Schedule + Scaler',
        'Sampler + RNG + Manifests',
      ];
      nodes.push(
        txt('2 · RESUMABLE CONTINUATION STATE', -825, 42, 28, COSMOS.gold, 'mono', 'left')
          .glow(5, COSMOS.gold)
          .opacity(Math.max(0.3, rr) * a),
      );
      resumeItems.forEach((label, i) => {
        const scanned = vs > 0.3;
        const col = scanned ? COSMOS.emerald : COSMOS.gold;
        nodes.push(
          glassCell(xs[i], resY, 500, 108, col, {
            fill: scanned ? '#0c2624' : '#1f1910',
            glow: rr > 0.3 ? 10 * pulse : 2,
            opacity: Math.max(0.25, rr) * a,
          }),
          txt(label, xs[i], resY, 28, col, 'mono').opacity(Math.max(0.25, rr) * a),
        );
      });

      // Verification rail below the capsules (never crossing text!)
      if (vs > 0.05) {
        nodes.push(
          line([-760, 248], [760, 248], { stroke: COSMOS.emerald, width: 3 })
            .glow(8, COSMOS.emerald)
            .opacity(vs * a * 0.75),
        );
      }

      const footCol = vs > 0.5 ? COSMOS.emerald : COSMOS.gold;
      const footMsg =
        vs > 0.5
          ? 'Open & verify actual file contents (a manifest key alone can point to a missing file)'
          : 'A seed restarts a shuffle; resuming mid-epoch requires live RNG & sampler position';
      nodes.push(
        glassCell(0, 355, 1640, 96, footCol, { fill: '#101829', glow: 8, opacity: a }),
        txt(footMsg, 0, 355, 28, footCol, 'mono').opacity(a),
      );
    } else {
      // Beat 2: Uninterrupted vs Restored parallel drill timeline
      const a = Math.min(1, (dv - 0.5) * 2);
      const ptsX = [-240, 220, 680];
      const labels = ['Next Batch & LR', 'Loss & Gradients', 'Updated Weights (N+1)'];

      nodes.push(
        txt(
          'RESTORE DRILL · INTERRUPT JUST AFTER AN OPTIMIZER STEP',
          0,
          -225,
          28,
          COSMOS.cyan,
          'mono',
        ).opacity(a),
      );
      labels.forEach((lbl, j) => {
        nodes.push(txt(lbl, ptsX[j], -125, 28, COSMOS.muted, 'mono').opacity(a));
      });

      const tracks = [
        { name: 'UNINTERRUPTED RUN', y: -20, col: COSMOS.cyan },
        { name: 'RESTORED RUN', y: 175, col: COSMOS.gold },
      ];
      tracks.forEach((tr) => {
        nodes.push(
          txt(tr.name, -835, tr.y, 30, tr.col, 'mono', 'left').opacity(a),
          line([-410, tr.y], [780, tr.y], { stroke: tr.col, width: 4 }).glow(7, tr.col).opacity(a),
        );
        ptsX.forEach((px, j) => {
          nodes.push(
            glowDot(px, tr.y, { radius: 12, color: j === 2 ? COSMOS.emerald : tr.col, opacity: a }),
          );
        });
      });

      // Vertical tolerance match beams linking the two tracks
      ptsX.forEach((px, j) => {
        const col = j === 2 ? COSMOS.emerald : COSMOS.cyan;
        nodes.push(
          line([px, 0], [px, 155], { stroke: col, width: 3, dash: [8, 6] })
            .glow(8 * pulse, col)
            .opacity(a),
          txt('≈', px + 26, 78, 34, col, 'mono').opacity(a),
        );
      });

      nodes.push(
        glassCell(0, 355, 1660, 102, COSMOS.emerald, { fill: '#0c2424', glow: 9, opacity: a }),
        txt(
          'First loss can match even if step N+1 diverges · Verify updated weights within tolerance',
          0,
          355,
          28,
          COSMOS.emerald,
          'mono',
        ).opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('resume-data-artifacts-b1', () => s.play(showResumeRing.to(1, { duration: 0.6 })));
  c.on('resume-data-artifacts-b2', () => s.play(verifyScan.to(1, { duration: 0.6 })));
  c.on('resume-data-artifacts-b3', () =>
    s.play(drillView.to(1, { duration: remainDuration(c, 'resume-data-artifacts-b3', 0.5) })),
  );
}
