// Scene 01: intro: "What should the next call remember?"
// Failed callback trace-17 beside draft incident note, lock-check sliding under trace so R17 & t=100 align,
// prediction beat ("Would you keep the lock explanation?"), erasing guess -> checked finding -> working set.
import {
  COSMOS,
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
  lerp,
  line,
  playCue,
  recordGlyph,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const traceIn = s.value(0.25);
  const statusGlow = s.value(0);
  const lockSlide = s.value(0);
  const questionPulse = s.value(0);
  const eraseProg = s.value(0);
  const keepChecked = s.value(0);
  const assembleCall = s.value(0);

  const bgAura = aura(-240, 20, 780, '#14325c28', '#24184020');
  const title = heroTitle(['What should the next', 'call remember?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.evidence,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const tr = ease(traceIn.value);
    const st = ease(statusGlow.value);
    const lk = ease(lockSlide.value);
    const qp = ease(questionPulse.value);
    const er = ease(eraseProg.value);
    const kp = ease(keepChecked.value);
    const as = ease(assembleCall.value);

    const nodes = [];

    // Left column: source records (trace-17 top, lock-check sliding in underneath)
    const traceX = lerp(-860, -780, tr);
    nodes.push(
      txt('SOURCE EVIDENCE', -810, -250, 26, ROLE.evidence, 'mono', 'left').opacity(alpha),
      recordGlyph(traceX, -110, {
        name: 'trace-17',
        value: st > 0.2 ? `HTTP ${TRACE.status}  ${TRACE.path}` : TRACE.path,
        sub: `Request ${TRACE.trace}   Time ${TRACE.at}`,
        color: st > 0.2 ? ROLE.poison : ROLE.evidence,
        valueColor: st > 0.2 ? ROLE.poison : COSMOS.ink,
        valueSize: 52,
        opacity: alpha * (0.55 + 0.45 * tr),
      }),
    );

    // Lock-check slot: quiet skeleton from t=0, glides into alignment on intro-lock
    const lockX = lerp(-860, -780, lk);
    nodes.push(
      recordGlyph(lockX, 175, {
        name: 'lock-check',
        value: lk > 0.2 ? 'Migration lock: Absent' : 'Lock check pending',
        sub:
          lk > 0.2
            ? `Request ${LOCK.trace}   Time ${LOCK.at}   locked=false`
            : 'Awaiting lock observation',
        color: lk > 0.2 ? ROLE.note : ROLE.dim,
        valueColor: lk > 0.2 ? ROLE.note : COSMOS.muted,
        valueSize: 44,
        opacity: alpha * (0.48 + 0.52 * lk),
      }),
    );

    // Alignment tether linking Request R17 / Time 100 across both records
    if (lk > 0.25) {
      nodes.push(
        line([-810, -10], [-810, 82], { stroke: ROLE.note, width: 3 })
          .glow(8, ROLE.note)
          .opacity(alpha * lk),
        txt('Same R17, same t=100', -770, 36, 28, ROLE.note, 'mono', 'left').opacity(alpha * lk),
      );
    }

    // Center flow arrow from source evidence to working note
    nodes.push(
      glowArrow([-65, 30], [75, 30], kp > 0.4 ? ROLE.note : ROLE.units, {
        width: 4,
        opacity: alpha * 0.85,
      }),
    );

    // Right region: Draft note -> Checked finding -> Assembled next call (corner brackets, no box)
    const rightColor = as > 0.4 ? ROLE.evidence : kp > 0.4 ? ROLE.note : ROLE.units;
    nodes.push(
      cornerBrackets(490, 25, 760, 520, rightColor, { arm: 36, width: 3.2, opacity: alpha }),
      txt(
        as > 0.4
          ? 'NEXT MODEL WORKING SET'
          : kp > 0.4
            ? 'CHECKED INCIDENT FINDING'
            : 'DRAFT INCIDENT NOTE (RUN-842)',
        140,
        -190,
        28,
        rightColor,
        'mono',
        'left',
      ).opacity(alpha),
    );

    // Sequential content inside right frame: draft (kp < 0.35), checked finding (0.35..0.55..as<0.35), working set (as >= 0.35)
    if (kp < 0.35) {
      const draftAlpha = alpha * (1 - er) * (1 - kp * 2.8);
      if (draftAlpha > 0.04) {
        nodes.push(
          txt('Database migration lock', 140, -60, 48, COSMOS.ink, 'serif', 'left').opacity(
            draftAlpha,
          ),
          txt('caused the callback failure.', 140, 8, 46, COSMOS.ink, 'serif', 'left').opacity(
            draftAlpha,
          ),
          txt('Proposed action: rollback', 140, 96, 30, ROLE.units, 'mono', 'left').opacity(
            draftAlpha,
          ),
        );
      }
      if (er > 0.15 && er < 0.98) {
        nodes.push(
          line([140, -18], [140 + 520 * er, -18], { stroke: ROLE.poison, width: 5 })
            .glow(10, ROLE.poison)
            .opacity(alpha),
          crossMark(810, -56, 36, ROLE.poison, alpha * er),
        );
      }
    } else if (as < 0.35) {
      const kAlpha = alpha * Math.min(1, (kp - 0.35) / 0.45) * (1 - as * 2.8);
      if (kAlpha > 0.04) {
        nodes.push(
          checkMark(165, -72, 34, ROLE.note, kAlpha),
          txt('No migration lock observed', 210, -72, 44, ROLE.note, 'serif', 'left').opacity(
            kAlpha,
          ),
          txt(
            `for ${LOCK.trace} at time ${LOCK.at}.`,
            210,
            -6,
            42,
            COSMOS.ink,
            'serif',
            'left',
          ).opacity(kAlpha),
          txt('source: lock-check', 210, 82, 30, ROLE.evidence, 'mono', 'left').opacity(kAlpha),
          txt(
            'Next: inspect why /callback returned 403',
            140,
            178,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(kAlpha),
        );
      }
    } else {
      const aAlpha = alpha * Math.min(1, (as - 0.35) / 0.45);
      if (aAlpha > 0.04) {
        nodes.push(
          chip('instructions', 305, -75, {
            color: ROLE.evidence,
            size: 28,
            minW: 290,
            opacity: aAlpha,
          }),
          chip('trace_lookup', 665, -75, {
            color: ROLE.tool,
            size: 28,
            minW: 290,
            opacity: aAlpha,
          }),
          chip('trace-17 (403)', 305, 35, {
            color: ROLE.poison,
            size: 28,
            minW: 290,
            opacity: aAlpha,
          }),
          chip('checked note', 665, 35, { color: ROLE.note, size: 28, minW: 290, opacity: aAlpha }),
          txt(
            'Archived outside call: old lock guess + recaps',
            140,
            178,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(aAlpha),
        );
      }
    }

    // Bottom floating status / prediction prompt (never leaks verdict during B1!)
    const bottomText =
      as > 0.4
        ? 'The curated working set shapes the next model step.'
        : kp > 0.4
          ? 'Old guess erased; checked finding keeps its source ID.'
          : qp > 0.25
            ? 'Same request R17, same time 100. Would you keep the lock explanation?'
            : 'Trace evidence and draft note side by side before verification.';
    const bottomColor =
      as > 0.4 ? ROLE.evidence : kp > 0.4 ? ROLE.note : qp > 0.25 ? ROLE.units : COSMOS.muted;
    nodes.push(txt(bottomText, 0, 390, 34, bottomColor, 'serif', 'center').opacity(alpha));

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'intro-trace', (d) => s.play(traceIn.to(1, { duration: d })));
  playCue(s, c, 'intro-status', (d) => s.play(statusGlow.to(1, { duration: d })));
  playCue(s, c, 'intro-lock', (d) => s.play(lockSlide.to(1, { duration: d })));
  playCue(s, c, 'intro-question', (d) => s.play(questionPulse.to(1, { duration: d })));
  // Strict prediction withholding: verdict only reveals in B2 on intro-erase / intro-keep!
  playCue(s, c, 'intro-erase', (d) => s.play(eraseProg.to(1, { duration: d })));
  playCue(s, c, 'intro-keep', (d) => s.play(keepChecked.to(1, { duration: d })));
  playCue(s, c, 'intro-request', (d) => s.play(assembleCall.to(1, { duration: d })));
}
