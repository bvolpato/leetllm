// Scene 05: verified-note-state: "A stored note carries scope and a verifier result"
// B0: Three confirmed values ("true", 1, true) -> strict Boolean guard rejects first two, host sets true.
// B1-B2: Scoped note (rev 7, R17, t=100) vs later rev 8 triggering recheck + admission checks on reload.
import {
  COSMOS,
  ROLE,
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
  swapVis,
  txt,
} from '../parts.mjs';

export default function verifiedNoteState(s, c) {
  const viewType = s.value(1);
  const viewScope = s.value(0);
  const flagScan = s.value(0.2);
  const flagReject = s.value(0);
  const revChange = s.value(0);
  const showReload = s.value(0);

  const bgAura = aura(0, 0, 800, '#14335c28', '#14352822');
  const title = heroTitle(['A stored note carries', 'scope & verifier state'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.note,
  });

  // B0 view: three candidate values for `confirmed`
  const typeLayer = guardedDynamic(viewType, (alpha) => {
    const sc = ease(flagScan.value);
    const rj = ease(flagReject.value);

    const cols = [
      { val: '"true"', kind: 'string', x: -560, ok: false },
      { val: '1', kind: 'integer', x: 0, ok: false },
      { val: 'true', kind: 'Boolean', x: 560, ok: true },
    ];
    const nodes = [
      txt(
        'CANDIDATE VALUES FOR confirmed FIELD',
        -855,
        -230,
        26,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    cols.forEach((col) => {
      const border = rj < 0.35 ? ROLE.evidence : col.ok ? ROLE.note : ROLE.poison;
      nodes.push(
        cornerBrackets(col.x, -40, 440, 250, border, { arm: 28, width: 3, opacity: alpha }),
        txt(col.val, col.x, -80, 56, border, 'mono', 'center').opacity(alpha * (0.65 + 0.35 * sc)),
        txt(col.kind, col.x, 8, 30, COSMOS.muted, 'sans', 'center').opacity(alpha),
      );
      if (rj > 0.3) {
        if (col.ok) {
          nodes.push(
            checkMark(col.x - 165, 130, 24, ROLE.note, alpha * rj),
            txt('Host verifies', col.x + 15, 130, 28, ROLE.note, 'mono', 'center').opacity(
              alpha * rj,
            ),
          );
        } else {
          nodes.push(
            crossMark(col.x - 80, 130, 26, ROLE.poison, alpha * rj),
            txt('REJECT', col.x + 30, 130, 30, ROLE.poison, 'mono', 'center').opacity(alpha * rj),
          );
        }
      } else {
        nodes.push(
          txt('Type check pending', col.x, 130, 26, COSMOS.muted, 'mono', 'center').opacity(
            alpha * 0.65,
          ),
        );
      }
    });

    nodes.push(
      txt(
        'HOST SOURCE COMPARISON:  trace-17 (R17, t=100, 403)  +  lock-check (R17, t=100, locked=false)',
        0,
        290,
        28,
        ROLE.evidence,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'A tool-supplied string or integer flag cannot certify its own claim.',
        0,
        380,
        32,
        rj > 0.3 ? ROLE.units : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  // B1-B2 view: scoped metadata + revision 7 -> revision 8 + reload admission gate
  const scopeLayer = guardedDynamic(viewScope, (alpha) => {
    const rv = ease(revChange.value);
    const rl = ease(showReload.value);

    const nodes = [
      // Left: Stored note metadata
      cornerBrackets(-450, -60, 780, 320, ROLE.note, { arm: 32, width: 3, opacity: alpha }),
      txt('CHECKED NOTE RECORD', -800, -175, 26, ROLE.note, 'mono', 'left').opacity(alpha),
      txt(
        'trace: R17   time: 100   source: lock-check',
        -800,
        -105,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        'revision: 7   status: confirmed (host)',
        -800,
        -45,
        28,
        ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        'scope: no lock in inspected transaction',
        -800,
        15,
        28,
        ROLE.note,
        'sans',
        'left',
      ).opacity(alpha),
      txt(
        '!= no lock at every time (uncertainty kept)',
        -800,
        65,
        26,
        ROLE.poison,
        'mono',
        'left',
      ).opacity(alpha),

      // Right: Live source revision
      cornerBrackets(450, -60, 780, 320, rv > 0.4 ? ROLE.units : ROLE.evidence, {
        arm: 32,
        width: 3,
        opacity: alpha,
      }),
      txt(
        rv > 0.4 ? 'LIVE SOURCE: REVISION 8' : 'ARCHIVED SOURCE: REVISION 7',
        100,
        -175,
        26,
        rv > 0.4 ? ROLE.units : ROLE.evidence,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        rv > 0.4 ? 'Revision mismatch (7 vs 8)' : 'Matches stored note revision 7',
        100,
        -90,
        34,
        rv > 0.4 ? ROLE.units : ROLE.note,
        'serif',
        'left',
      ).opacity(alpha),
      txt(
        rv > 0.4
          ? 'Later revision requires a fresh host check.'
          : 'Path to full archived observation preserved.',
        100,
        -10,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),

      // Bottom admission gate for selective reload (illuminates on B2)
      txt(
        'BEFORE RELOADING INTO NEXT CALL',
        -855,
        190,
        26,
        rl > 0.3 ? ROLE.units : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * rl)),
      chip('1. Caller may read', -615, 280, {
        color: rl > 0.3 ? ROLE.note : ROLE.dim,
        size: 26,
        minW: 390,
        opacity: alpha * (0.55 + 0.45 * rl),
      }),
      glowArrow([-395, 280], [-305, 280], ROLE.evidence, { opacity: alpha * (0.5 + 0.5 * rl) }),
      chip('2. Source is current', -85, 280, {
        color: rl > 0.3 ? ROLE.units : ROLE.dim,
        size: 26,
        minW: 400,
        opacity: alpha * (0.55 + 0.45 * rl),
      }),
      glowArrow([135, 280], [225, 280], ROLE.evidence, { opacity: alpha * (0.5 + 0.5 * rl) }),
      chip('3. Answers question', 455, 280, {
        color: rl > 0.3 ? ROLE.evidence : ROLE.dim,
        size: 26,
        minW: 410,
        opacity: alpha * (0.55 + 0.45 * rl),
      }),
      txt(
        rl > 0.3
          ? 'Reloaded note words count toward the next call input budget.'
          : 'Record source revision, trace identity, observation time, status, uncertainty.',
        0,
        395,
        30,
        rl > 0.3 ? ROLE.units : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, typeLayer, scopeLayer);

  playCue(s, c, 'ce-verified-note-state-1', (d) => s.play(flagScan.to(1, { duration: d })));
  playCue(s, c, 'ce-flag-rejected', (d) => s.play(flagReject.to(1, { duration: d })));
  playCue(s, c, 'ce-verified-note-state-2', (d) => s.play(swapVis(viewType, viewScope, d)));
  playCue(s, c, 'ce-note-revision', (d) => s.play(revChange.to(1, { duration: d })));
  playCue(s, c, 'ce-verified-note-state-3', (d) => s.play(showReload.to(1, { duration: d })));
}
