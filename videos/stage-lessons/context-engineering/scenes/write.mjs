// Scene 04: write: "Store a finding, then reload what is useful"
// Source predicates against trace-17 and lock-check -> serialize two narrow findings to JSON note store
// -> bulky raw trace archived outside -> selective reload puts note tokens back into next input.
import {
  COSMOS,
  FINDINGS,
  LOCK,
  ROLE,
  TRACE,
  aura,
  checkMark,
  chip,
  cornerBrackets,
  crossMark,
  ease,
  glowArrow,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  recordGlyph,
  txt,
} from '../parts.mjs';

export default function write(s, c) {
  const checkSources = s.value(0.2);
  const authPred = s.value(0);
  const lockPred = s.value(0);
  const dropOld = s.value(0);
  const writeStore = s.value(0);
  const keepArchive = s.value(0);
  const reloadNext = s.value(0);

  const bgAura = aura(0, 20, 780, '#12384c2a', '#10352824');
  const title = heroTitle(['Store a finding,', 'reload what is useful'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.note,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cs = ease(checkSources.value);
    const ap = ease(authPred.value);
    const lp = ease(lockPred.value);
    const dr = ease(dropOld.value);
    const ws = ease(writeStore.value);
    const ar = ease(keepArchive.value);
    const rl = ease(reloadNext.value);

    const nodes = [
      // Left column: Source records & archive state
      txt('1. SOURCE RECORDS', -855, -240, 26, ROLE.evidence, 'mono', 'left').opacity(alpha),
      recordGlyph(-820, -105, {
        name: 'trace-17',
        value: `status: ${TRACE.status}`,
        sub: `${TRACE.trace}  ${TRACE.path}  t=${TRACE.at}`,
        color: ap > 0.2 ? ROLE.evidence : ROLE.dim,
        valueColor: ap > 0.2 ? ROLE.poison : COSMOS.ink,
        valueSize: 46,
        opacity: alpha * (0.6 + 0.4 * cs),
      }),
      recordGlyph(-820, 140, {
        name: 'lock-check',
        value: `locked: ${LOCK.locked}`,
        sub: `${LOCK.trace}  t=${LOCK.at}`,
        color: lp > 0.2 ? ROLE.note : ROLE.dim,
        valueColor: lp > 0.2 ? ROLE.note : COSMOS.ink,
        valueSize: 46,
        opacity: alpha * (0.6 + 0.4 * Math.max(cs, lp)),
      }),

      // Archive status tag under sources
      chip(ar > 0.3 ? 'RAW TRACE: ARCHIVED OUTSIDE' : 'RAW TRACE: IN ARCHIVE', -610, 320, {
        color: ar > 0.3 ? ROLE.units : ROLE.dim,
        size: 26,
        minW: 460,
        opacity: alpha * (0.5 + 0.5 * ar),
      }),

      // Arrow 1 -> Center JSON Note Store
      glowArrow([-340, 20], [-235, 20], ws > 0.2 ? ROLE.note : ROLE.evidence, {
        opacity: alpha * (0.55 + 0.45 * ws),
      }),

      // Center column: External JSON Note Store
      cornerBrackets(20, 25, 480, 490, ws > 0.2 ? ROLE.note : ROLE.evidence, {
        arm: 30,
        width: 3,
        opacity: alpha * (0.55 + 0.45 * ws),
      }),
      txt('2. EXTERNAL NOTE STORE', -190, -180, 26, ROLE.note, 'mono', 'left').opacity(alpha),
      txt('JSON round-trip', -190, -135, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha * (0.55 + 0.45 * ws),
      ),
      checkMark(-175, -50, 24, ROLE.evidence, alpha * (0.4 + 0.6 * ap)),
      txt('Auth callback error', -140, -58, 28, COSMOS.ink, 'sans', 'left').opacity(
        alpha * (0.45 + 0.55 * ap),
      ),
      txt(`source: ${FINDINGS[0].source}`, -140, -16, 26, ROLE.evidence, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * ap),
      ),

      checkMark(-175, 78, 24, ROLE.note, alpha * (0.4 + 0.6 * lp)),
      txt('Migration lock absent', -140, 70, 28, COSMOS.ink, 'sans', 'left').opacity(
        alpha * (0.45 + 0.55 * lp),
      ),
      txt(`source: ${FINDINGS[1].source}`, -140, 112, 26, ROLE.note, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * lp),
      ),

      // Old lock claim crossed out
      crossMark(-175, 205, 24, ROLE.poison, alpha * (0.35 + 0.65 * dr)),
      txt(
        dr > 0.3 ? 'Old lock guess dropped' : 'Drop disproven claim',
        -140,
        205,
        26,
        dr > 0.3 ? ROLE.poison : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * dr)),

      // Arrow 2 -> Right Next Call Working Set
      glowArrow([280, 20], [385, 20], rl > 0.2 ? ROLE.units : ROLE.dim, {
        opacity: alpha * (0.5 + 0.5 * rl),
      }),

      // Right column: Selective Reload into Next Call
      cornerBrackets(630, 25, 450, 490, rl > 0.2 ? ROLE.units : ROLE.rule, {
        arm: 30,
        width: 3,
        opacity: alpha * (0.5 + 0.5 * rl),
      }),
      txt(
        '3. NEXT CALL INPUT',
        435,
        -180,
        26,
        rl > 0.2 ? ROLE.units : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      chip('note: auth error', 630, -70, {
        color: ROLE.evidence,
        size: 26,
        minW: 360,
        opacity: alpha * (0.45 + 0.55 * rl),
      }),
      chip('note: lock absent', 630, 35, {
        color: ROLE.note,
        size: 26,
        minW: 360,
        opacity: alpha * (0.45 + 0.55 * rl),
      }),
      txt(
        rl > 0.3 ? 'Reloaded notes count as input tokens' : 'App chooses what to reload',
        630,
        155,
        26,
        rl > 0.3 ? ROLE.units : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha * (0.55 + 0.45 * rl)),
      txt('Keep time, revision, uncertainty', 630, 215, 26, COSMOS.muted, 'mono', 'center').opacity(
        alpha * (0.45 + 0.55 * rl),
      ),

      // Footer
      txt(
        rl > 0.3
          ? 'External storage keeps raw logs out while reloading exact checked findings.'
          : 'Write verified findings with source IDs to durable note storage.',
        0,
        420,
        30,
        rl > 0.3 ? ROLE.note : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'write-beat-1-focus-1', (d) => s.play(checkSources.to(1, { duration: d })));
  playCue(s, c, 'ce-core-source-fields', (d) => s.play(authPred.to(1, { duration: d })));
  playCue(s, c, 'write-beat-1-focus-2', (d) => s.play(lockPred.to(0.6, { duration: d })));
  playCue(s, c, 'ce-core-lock-negative', (d) => s.play(lockPred.to(1, { duration: d })));
  playCue(s, c, 'ce-core-drop-lock', (d) => s.play(dropOld.to(1, { duration: d })));

  playCue(s, c, 'write-beat-2-focus-1', (d) => s.play(writeStore.to(0.6, { duration: d })));
  playCue(s, c, 'ce-core-write-store', (d) => s.play(writeStore.to(1, { duration: d })));
  playCue(s, c, 'write-beat-2-focus-2', (d) => s.play(keepArchive.to(0.6, { duration: d })));
  playCue(s, c, 'ce-core-archive', (d) => s.play(keepArchive.to(1, { duration: d })));

  playCue(s, c, 'write-beat-3-focus-1', (d) => s.play(reloadNext.to(0.6, { duration: d })));
  playCue(s, c, 'ce-core-reload', (d) => s.play(reloadNext.to(1, { duration: d })));
}
