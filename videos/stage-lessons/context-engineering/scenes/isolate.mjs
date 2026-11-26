// Scene 13: isolate: "What comes back from the search?"
// 50-commit isolated worker grid on the left, 200-byte handoff gate + archive check in center,
// clean lead conversation on the right. Walks 3 payloads: valid -> admitted; missing source ->
// rejected; real source contradicted by HTTP 403 -> rejected.
import {
  COSMOS,
  ISOLATE_PAYLOADS,
  ISOLATE_RESULTS,
  ROLE,
  TRACE,
  aura,
  checkMark,
  circle,
  cornerBrackets,
  crossMark,
  ease,
  glowArrow,
  group,
  guardedDynamic,
  heroTitle,
  playBeat,
  playCue,
  txt,
} from '../parts.mjs';

export default function isolate(s, c) {
  const scanCommits = s.value(0.25);
  const attempt = s.value(0); // 0 = valid, 1 = missing source, 2 = contradicted
  const revealAdmit = s.value(0);
  const copyToLead = s.value(0);
  const revealMissing = s.value(0);
  const revealMismatch = s.value(0);

  const bgAura = aura(-280, 0, 800, '#14335c2a', '#1e164026');
  const title = heroTitle(['What comes back', 'from the search?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.tool,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sc = ease(scanCommits.value);
    const at = attempt.value;
    const step = at < 0.5 ? 0 : at < 1.5 ? 1 : 2;
    const adm = ease(revealAdmit.value);
    const cpy = ease(copyToLead.value);
    const mis = ease(revealMissing.value);
    const mm = ease(revealMismatch.value);

    const payload = ISOLATE_PAYLOADS[step];
    const check = ISOLATE_RESULTS[step];
    const decided = step === 0 ? adm > 0.4 : step === 1 ? mis > 0.4 : mm > 0.4;
    const gateCol = !decided ? ROLE.units : check.accepted ? ROLE.note : ROLE.poison;

    const nodes = [
      // Left: Worker window with 50 inspected commits (10 x 5 glowing dots)
      cornerBrackets(-590, 25, 530, 480, ROLE.tool, { arm: 30, width: 3, opacity: alpha }),
      txt('WORKER WINDOW (50 COMMITS)', -820, -180, 26, ROLE.tool, 'mono', 'left').opacity(alpha),
      txt('Stays isolated behind handoff', -820, 215, 26, COSMOS.muted, 'sans', 'left').opacity(
        alpha,
      ),
    ];

    const lit = Math.max(8, Math.round(50 * sc));
    for (let i = 0; i < 50; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const dx = -795 + col * 45;
      const dy = -110 + row * 64;
      const isHit = i === 36;
      const dotCol = isHit ? ROLE.evidence : i < lit ? ROLE.tool : '#243154';
      const d = circle(isHit ? 11 : 8, { fill: dotCol, stroke: null })
        .at(dx, dy)
        .opacity(alpha * (i < lit ? 0.92 : 0.48));
      if (isHit) d.glow(10, ROLE.evidence);
      nodes.push(d);
    }

    // Center: 200-byte reply + archive verification gate
    nodes.push(
      glowArrow([-305, 25], [-235, 25], gateCol, { opacity: alpha }),
      cornerBrackets(25, 25, 490, 480, gateCol, { arm: 30, width: 3, opacity: alpha }),
      txt(`TRY ${step + 1} / 3  (<= 200 B)`, -195, -180, 26, gateCol, 'mono', 'left').opacity(
        alpha,
      ),
      txt(`claim: "${payload.claim}"`, -195, -100, 27, COSMOS.ink, 'mono', 'left').opacity(alpha),
      txt(`source: "${payload.source}"`, -195, -42, 27, ROLE.evidence, 'mono', 'left').opacity(
        alpha,
      ),
      txt(`${check.bytes} bytes (limit 200)`, -195, 16, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha,
      ),

      // Archive verification row
      txt('ARCHIVE CHECK', -195, 92, 26, ROLE.units, 'mono', 'left').opacity(alpha),
      txt(
        !decided
          ? 'Checking authorized source...'
          : step === 0
            ? `trace-17 -> HTTP ${TRACE.status} (matches)`
            : step === 1
              ? 'No readable record for "missing"'
              : `trace-17 -> HTTP ${TRACE.status} (contradicts)`,
        -195,
        146,
        26,
        gateCol,
        'mono',
        'left',
      ).opacity(alpha),
    );

    if (decided) {
      nodes.push(
        check.accepted
          ? checkMark(-175, 212, 26, ROLE.note, alpha)
          : crossMark(-175, 212, 26, ROLE.poison, alpha),
        txt(
          check.accepted ? 'SUPPORTED -> ADMIT' : 'REJECTED -> DO NOT COPY',
          -140,
          212,
          28,
          gateCol,
          'mono',
          'left',
        ).opacity(alpha),
      );
    }

    // Right: Lead conversation window
    const leadCol = step === 0 && cpy > 0.3 ? ROLE.note : ROLE.evidence;
    nodes.push(
      glowArrow([290, 25], [360, 25], leadCol, { opacity: alpha }),
      cornerBrackets(625, 25, 490, 480, leadCol, { arm: 30, width: 3, opacity: alpha }),
      txt('LEAD CONVERSATION', 410, -180, 26, leadCol, 'mono', 'left').opacity(alpha),
      txt('50 commits stay out', 410, -110, 28, COSMOS.muted, 'sans', 'left').opacity(alpha),
    );

    if (step === 0 && cpy > 0.3) {
      nodes.push(
        checkMark(430, -15, 28, ROLE.note, alpha * cpy),
        txt('Copied 2 fields:', 470, -15, 28, ROLE.note, 'mono', 'left').opacity(alpha * cpy),
        txt('claim: auth error', 410, 52, 30, COSMOS.ink, 'mono', 'left').opacity(alpha * cpy),
        txt('source: trace-17', 410, 108, 30, ROLE.evidence, 'mono', 'left').opacity(alpha * cpy),
        txt('Both windows count toward cost', 410, 200, 26, ROLE.units, 'sans', 'left').opacity(
          alpha * cpy,
        ),
      );
    } else if (step === 1) {
      nodes.push(
        txt(
          mis > 0.4 ? 'No finding admitted' : 'Waiting on source check...',
          410,
          30,
          32,
          mis > 0.4 ? ROLE.poison : COSMOS.muted,
          'serif',
          'left',
        ).opacity(alpha),
        txt('Missing source blocks transfer', 410, 105, 26, COSMOS.muted, 'sans', 'left').opacity(
          alpha,
        ),
      );
    } else if (step === 2) {
      nodes.push(
        txt(
          mm > 0.4 ? 'Contradicted claim withheld' : 'Opening trace-17...',
          410,
          30,
          32,
          mm > 0.4 ? ROLE.poison : COSMOS.muted,
          'serif',
          'left',
        ).opacity(alpha),
        txt('Host still enforces ACL & tools', 410, 105, 26, COSMOS.muted, 'sans', 'left').opacity(
          alpha,
        ),
      );
    } else {
      nodes.push(
        txt('Needs only a checked finding', 410, 30, 30, COSMOS.muted, 'sans', 'left').opacity(
          alpha,
        ),
      );
    }

    // Bottom footer
    nodes.push(
      txt(
        step === 2 && mm > 0.4
          ? 'Separate windows keep search noise out; host verification guards truth & access.'
          : 'Worker inspects 50 commits; lead receives only a verified 2-field finding.',
        0,
        395,
        30,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'worker-search', (d) => s.play(scanCommits.to(1, { duration: Math.max(d, 1.0) })));
  playCue(s, c, 'worker-admit', (d) => s.play(revealAdmit.to(1, { duration: d })));
  playCue(s, c, 'worker-copy', (d) => s.play(copyToLead.to(1, { duration: d })));

  // Beat 2: switch to missing-source attempt, reveal rejection on worker-missing after
  playBeat(s, c, 2, (d) => s.play(attempt.to(1, { duration: d })));
  playCue(s, c, 'worker-missing', (d) => s.play(revealMissing.to(1, { duration: d })), {
    after: true,
  });

  // Beat 3: switch to contradicted claim, reveal rejection on worker-mismatch
  playBeat(s, c, 3, (d) => s.play(attempt.to(2, { duration: d })));
  playCue(s, c, 'worker-mismatch', (d) => s.play(revealMismatch.to(1, { duration: d })));
}
