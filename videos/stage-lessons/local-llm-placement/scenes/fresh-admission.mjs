// Scene 25: fresh-admission: 8x33k logs vs 16 GB limit (9.6 fixed + 6.4 KV -> 7 logs fit @ 15.7 GB, queue 8th) + 5-check candidate HOLD + offline field replay.
import {
  ADM_7,
  ADM_8,
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  releaseCases,
  swapVis,
  txt,
} from '../parts.mjs';

export default function freshAdmission(s, c) {
  const view1Vis = s.value(1); // 8 logs vs 16 GB limit -> 7 admitted, 8th queued
  const view2Vis = s.value(0); // 5 paired checks -> rollback regression -> HOLD + local fallback
  const revealEight = s.value(0);
  const revealSeven = s.value(0);
  const revealHold = s.value(0); // strictly withheld until AFTER inspect-command!
  const showField = s.value(0);

  const cases = releaseCases();

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Final Admission Gate:', 'VRAM Limit + Release Policy'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.ok,
  });

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const r8 = revealEight.value;
    const r7 = revealSeven.value;
    const barX = -780;
    const maxW = 1440;
    const maxGb = 18;
    const px = maxW / maxGb;
    const lim16X = barX + 16 * px;
    const fixedW = 9.6 * px;

    const nodes = [
      txt(
        '16.0 GB LIMIT  |  FIXED WEIGHTS + WORKSPACE = 9.6 GB  |  8 LOGS (~0.87 GB KV EACH)',
        -855,
        -220,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),

      lumBar(lim16X - 2, -112, 4, 42, ROLE.gold, { opacity: alpha, glow: 8 }),
      lumBar(lim16X - 2, 22, 4, 42, ROLE.gold, { opacity: alpha, glow: 8 }),
      txt('16.0 GB LIMIT', lim16X, -162, 26, ROLE.gold, 'mono', 'center').opacity(alpha),

      // Fixed 9.6 GB bar + 8 KV strips
      rect(fixedW, 66, { fill: ROLE.weights, stroke: null, radius: 8 })
        .at(barX + fixedW * 0.5, -45)
        .opacity(alpha),
      txt('Fixed 9.6 GB', barX + fixedW * 0.5, -45, 28, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),
    ];

    const perLogGb = ADM_7.kv / 7;
    for (let i = 0; i < 8; i++) {
      const segW = perLogGb * px - 4;
      const cx = barX + fixedW + (i + 0.5) * (perLogGb * px);
      const isEighth = i === 7;
      const shown = r8 > 0.35;
      const queued = isEighth && r7 > 0.35;
      nodes.push(
        rect(segW, 66, {
          fill: queued ? '#1a1622' : isEighth && shown ? '#4a182c' : '#103528',
          stroke: queued ? ROLE.gold : isEighth && shown ? ROLE.work : ROLE.ok,
          width: 2.4,
          radius: 6,
        })
          .at(cx, -45)
          .opacity(alpha * (shown ? (queued ? 0.35 : 1) : 0.25)),
        txt(`L${i + 1}`, cx, -45, 26, queued ? COSMOS.dim : COSMOS.ink, 'mono', 'center').opacity(
          alpha * (shown ? 1 : 0.35),
        ),
      );
    }

    nodes.push(
      chipPill(
        r7 > 0.4
          ? `ADMIT 7 LOGS (${ADM_7.total.toFixed(1)} GB <= 16.0 GB)  |  QUEUE LOG 8`
          : r8 > 0.4
            ? `8 logs = ${ADM_8.total.toFixed(1)} GB -> CROSSES 16.0 GB! (6.4 GB KV budget)`
            : 'With 9.6 GB fixed & 16.0 GB limit, how many ~0.87 GB logs fit?',
        0,
        135,
        {
          w: 1460,
          h: 80,
          color: r7 > 0.4 ? ROLE.ok : r8 > 0.4 ? ROLE.work : ROLE.gold,
          fill: r7 > 0.4 ? '#0f2d24' : r8 > 0.4 ? '#321420' : '#261e10',
          size: 28,
          glow: 10,
          opacity: alpha,
        },
      ),
      txt(
        'Test the 7-log workload for real peak VRAM and latency on the installed worker',
        0,
        265,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const rh = revealHold.value;
    const fld = showField.value;

    const nodes = [
      txt(
        '5 PAIRED CHECKS (POLICY: >= 4/5 PASS AND PROTECTED ROLLBACK MUST PASS)',
        -855,
        -220,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    cases.rows.forEach((row, i) => {
      const cx = -680 + i * 340;
      const isCritFail = row.id === 'Rollback' && rh > 0.35;
      const col = isCritFail ? ROLE.work : row.after ? ROLE.ok : ROLE.gold;
      nodes.push(
        chipPill(`${row.id}: ${row.after ? 'PASS' : 'FAIL'}`, cx, -95, {
          w: 310,
          h: 78,
          color: col,
          fill: isCritFail ? '#361422' : '#10182d',
          size: 26,
          glow: isCritFail ? 12 : 4,
          opacity: alpha,
        }),
      );
    });

    nodes.push(
      chipPill(
        rh > 0.4
          ? 'HOLD CANDIDATE! Rollback lacks --confirm -> keep logs inside network + local fallback!'
          : 'Candidate scores 4/5: can it serve the 7 admitted logs?',
        0,
        75,
        {
          w: 1560,
          h: 82,
          color: rh > 0.4 ? ROLE.work : ROLE.gold,
          fill: rh > 0.4 ? '#321420' : '#261e10',
          size: 28,
          glow: 10,
          opacity: alpha,
        },
      ),
      txt(
        fld > 0.3
          ? 'Field laptop check: replay on battery as device warms -> disconnect network -> verify offline runbook!'
          : 'Memory fit and protected quality policy must BOTH pass before promoting a smaller model',
        0,
        235,
        28,
        fld > 0.3 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'new-workload', (d) => s.play(revealEight.to(0, { duration: d })));
  playCue(s, c, 'session-question', (d) => s.play(revealEight.to(0, { duration: d })));
  // Strict prediction withholding #1: reveal 8-log overflow & 7-log fit only on Beat 2 cues!
  playCue(s, c, 'count-eight', (d) => s.play(revealEight.to(1, { duration: d })));
  playCue(s, c, 'eight-total', (d) => s.play(revealEight.to(1, { duration: d })), { after: true });
  playCue(s, c, 'cache-allowance', (d) => s.play(revealEight.to(1, { duration: d })));
  playCue(s, c, 'divide-allowance', (d) => s.play(revealSeven.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'queue-eight', (d) => s.play(revealSeven.to(1, { duration: d })));
  playCue(s, c, 'seven-fit', (d) => s.play(revealSeven.to(1, { duration: d })), { after: true });
  playCue(s, c, 'case-grid', (d) => s.play(swapVis(view1Vis, view2Vis, d)));
  playCue(s, c, 'ask-promote', (d) => s.play(revealHold.to(0, { duration: d })));
  // Strict prediction withholding #2: reveal HOLD only after inspect-command!
  playCue(s, c, 'inspect-command', (d) => s.play(revealHold.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'local-handoff', (d) => s.play(showField.to(0.5, { duration: d })));
  playCue(s, c, 'field-replay', (d) => s.play(showField.to(0.8, { duration: d })));
  playCue(s, c, 'offline-check', (d) => s.play(showField.to(1, { duration: d })));
}
