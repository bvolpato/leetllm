// Scene 11: prune-cutoff: "Replace only old output whose finding is already preserved"
// MathJax cutoff = max(0, N - keep_recent) = 2 over 4 indexed tool results [true, false, true, true].
// Only index 0 is replaced in place; index 1 stays raw (unrecorded); indices 2 & 3 stay raw (recent).
import {
  COSMOS,
  PRUNED,
  ROLE,
  aura,
  checkMark,
  cornerBrackets,
  ease,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  limitMarker,
  playCue,
  txt,
} from '../parts.mjs';

export default function pruneCutoff(s, c) {
  const showFormula = s.value(0.35);
  const showFour = s.value(0);
  const showCutoff = s.value(0);
  const replaceZero = s.value(0);
  const highlightOne = s.value(0);
  const highlightRecent = s.value(0);
  const showTranscript = s.value(0);

  const bgAura = aura(0, 0, 800, '#14335c28', '#2a163222');
  const title = heroTitle(['Replace only old output', 'whose finding is saved'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.evidence,
  });

  const eq = glowTex(
    String.raw`\mathrm{cutoff} = \max(0,\; N - k_{\mathrm{recent}}) = \max(0,\; 4 - 2) = 2`,
    { x: 350, y: -395, size: 32, color: ROLE.units, glow: 7 },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const fm = ease(showFormula.value);
    const f4 = ease(showFour.value);
    const ct = ease(showCutoff.value);
    const r0 = ease(replaceZero.value);
    const h1 = ease(highlightOne.value);
    const hr = ease(highlightRecent.value);
    const tr = ease(showTranscript.value);

    const xs = [-645, -215, 215, 645];
    const nodes = [
      eq.opacity(alpha * (0.45 + 0.55 * Math.max(fm, ct))),
      txt(
        'PREDICATE:  index < cutoff   AND   finding_recorded === true (exact Boolean)',
        -855,
        -245,
        28,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    // Four indexed tool-result slots
    PRUNED.rows.forEach((row, i) => {
      const cx = xs[i];
      const isReplaced = i === 0 && r0 > 0.4;
      const isUnrec = i === 1 && h1 > 0.4;
      const isRecent = i >= 2 && hr > 0.4;

      const col = isReplaced
        ? ROLE.note
        : isUnrec
          ? ROLE.units
          : isRecent
            ? ROLE.evidence
            : ROLE.cache;

      const op = alpha * (0.55 + 0.45 * Math.max(f4, isReplaced ? r0 : isUnrec ? h1 : hr));

      nodes.push(
        cornerBrackets(cx, 20, 360, 330, col, { arm: 26, width: 3, opacity: op }),
        txt(
          `idx ${i} (${row.id})`,
          cx - (isReplaced ? 22 : 0),
          -100,
          28,
          col,
          'mono',
          'center',
        ).opacity(op),
        txt(
          `recorded: ${row.recorded}`,
          cx,
          -35,
          28,
          row.recorded ? ROLE.note : ROLE.poison,
          'mono',
          'center',
        ).opacity(op),
        txt(
          isReplaced ? '[pruned] S0' : `raw payload (${row.raw})`,
          cx,
          42,
          28,
          isReplaced ? ROLE.note : COSMOS.ink,
          'mono',
          'center',
        ).opacity(op),
        txt(
          isReplaced
            ? 'REPLACED IN PLACE'
            : i === 1
              ? 'KEPT RAW (unrecorded)'
              : i >= 2
                ? 'KEPT RAW (recent)'
                : 'ELIGIBLE (old + true)',
          cx,
          122,
          26,
          isReplaced ? ROLE.note : i === 1 ? ROLE.units : ROLE.evidence,
          'mono',
          'center',
        ).opacity(op),
      );
      if (isReplaced) {
        nodes.push(checkMark(cx + 138, -100, 22, ROLE.note, alpha * r0));
      }
    });

    // Cutoff divider between index 1 and index 2
    nodes.push(
      limitMarker(0, -160, 215, ROLE.units, ct > 0.3 ? 'cutoff = 2' : 'cutoff', {
        size: 28,
        opacity: alpha * (0.45 + 0.55 * ct),
      }),
      txt('OLD (index < 2)', -430, 245, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('KEEP RECENT (last 2)', 430, 245, 28, ROLE.evidence, 'mono', 'center').opacity(alpha),

      // Bottom provider transcript contract
      txt(
        tr > 0.3
          ? 'Real transcript: preserve tool-call & tool-result IDs, order, and archived raw payload.'
          : 'Only index 0 satisfies both index < 2 and finding_recorded === true.',
        0,
        375,
        30,
        tr > 0.3 ? ROLE.note : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'ce-prune-cutoff-1', (d) => s.play(showFormula.to(1, { duration: d })));
  playCue(s, c, 'ce-prune-cutoff-2', (d) => s.play(showFour.to(1, { duration: d })));
  playCue(s, c, 'ce-prune-cutoff', (d) => s.play(showCutoff.to(1, { duration: d })));
  playCue(s, c, 'ce-prune-first', (d) => s.play(replaceZero.to(1, { duration: d })));
  playCue(s, c, 'ce-prune-unrecorded', (d) => s.play(highlightOne.to(1, { duration: d })));
  playCue(s, c, 'ce-prune-recent', (d) => s.play(highlightRecent.to(1, { duration: d })));
  playCue(s, c, 'ce-prune-cutoff-3', (d) => s.play(showTranscript.to(1, { duration: d })));
}
