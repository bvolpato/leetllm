// Scene 09: search-completion: Two search pools (Active unfinished 0.9 vs Completed 0.8) -> return Completed 0.8 at deadline + parser/verifier checks.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function searchCompletion(s, c) {
  const showDeadline = s.value(0);
  const showParser = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Two-Pool Tree Search:', 'Never Return an Unfinished Fragment'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.search,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const dl = showDeadline.value;
    const pr = showParser.value;

    const nodes = [
      txt(
        'SEPARATE UNFINISHED FRONTIER FROM COMPLETED ANSWERS REACHING FINAL MARKER',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      rect(700, 200, { fill: '#261e10', stroke: ROLE.gold, width: 2.8, radius: 14 })
        .at(-460, -55)
        .opacity(alpha),
      txt('ACTIVE POOL (UNFINISHED)', -460, -112, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('Path A: score = 0.90', -460, -55, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt(
        'Still mid-derivation (no final answer)',
        -460,
        4,
        26,
        ROLE.err,
        'sans',
        'center',
      ).opacity(alpha),

      arrow([-90, -55], [90, -55], { stroke: ROLE.ok, width: 4, head: 12 }).opacity(alpha),
      txt('final marker', 0, -90, 26, ROLE.ok, 'mono', 'center').opacity(alpha),

      rect(700, 200, {
        fill: dl > 0.35 ? '#0f2d24' : '#101c36',
        stroke: ROLE.ok,
        width: 3,
        radius: 14,
      })
        .at(460, -55)
        .opacity(alpha),
      txt('COMPLETED POOL (FINISHED)', 460, -112, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Answer B: score = 0.80', 460, -55, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt(
        dl > 0.35 ? 'RETURNED AT DEADLINE!' : 'Ready to verify & return',
        460,
        4,
        26,
        ROLE.ok,
        'mono',
        'center',
      ).opacity(alpha),

      chipPill(
        dl > 0.35
          ? 'At deadline: return completed 0.80 over unfinished 0.90 (if empty, mark partial as incomplete!)'
          : 'Move paths into Completed once they emit the final marker; spend next round extending Active',
        0,
        130,
        {
          w: 1620,
          h: 74,
          color: dl > 0.35 ? ROLE.ok : ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),
      chipPill(
        'Parser strips whitespace & checks nonempty answer; reject NaN/inf scores & run task checker!',
        0,
        240,
        {
          w: 1620,
          h: 72,
          color: pr > 0.35 ? ROLE.search : COSMOS.muted,
          size: 26,
          opacity: alpha * (0.5 + 0.5 * pr),
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-search-completion-0', (d) => s.play(showDeadline.to(0, { duration: d })));
  playCue(s, c, 'tt-pool-transfer', (d) => s.play(showDeadline.to(0.2, { duration: d })));
  playCue(s, c, 'tt-search-completion-1', (d) => s.play(showDeadline.to(0.6, { duration: d })));
  playCue(s, c, 'tt-completed-return', (d) => s.play(showDeadline.to(1, { duration: d })));
  playCue(s, c, 'tt-search-completion-2', (d) => s.play(showParser.to(1, { duration: d })));
}
