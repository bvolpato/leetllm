// Scene 10 (context-budget): "Which complete sections fit?"
// Glowing sentence-window lens + 400-char optical packing channel (E1 217 -> Appendix +297 red
// overflow -> prediction pause -> skip appendix & admit E2 +121 = 338 -> duplicate zero delta)
// + 1024-token full-request budget bar + U-shaped "lost in the middle" attention curve!
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  callerTag,
  cinemaAtmosphere,
  glowDot,
  glowingTrail,
  heroTitle,
  lumBar,
  parentPackingFixture,
  playCue,
  runPhase,
  seq,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function contextBudget(s, c) {
  const fixture = parentPackingFixture();
  const capChars = 400;
  const e1Chars = 217;
  const appendixChars = 297;
  const e2Chars = 121;
  const totalChars = e1Chars + e2Chars; // 338

  const phase = s.value(0);
  const windowExpand = s.value(0);
  const e1Fill = s.value(0);
  const appFill = s.value(0); // tries appendix (297 -> overflows 400!)
  const e2Fill = s.value(0); // admits E2 (121 -> 338 <= 400)
  const dedupPulse = s.value(0); // duplicate E1 hit leaves 338 unchanged
  const tokenFill = s.value(0); // 501 input + 256 output reserve
  const posCurve = s.value(0); // U-shaped lost-in-the-middle curve
  // Footer mode: 0=window, 1=E1 217, 2=appendix question (297 > 183), 3=skip & admit E2 (338), 4=dedup unchanged, 5=tokens+position
  const footMode = s.value(0);

  const title = heroTitle(['Which Complete', 'Sections Fit?'], {
    x: -855,
    y: -440,
    size: 54,
    lineHeight: 64,
    accent: ROLE.policy,
    eyebrow: 'CONTEXT PACKING · CHARACTER & TOKEN BUDGETS',
  });

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const we = windowExpand.value;
    const e1 = e1Fill.value;
    const ap = appFill.value;
    const e2 = e2Fill.value;
    const dp = dedupPulse.value;
    const tf = tokenFill.value;
    const pc = posCurve.value;
    const fm = Math.round(footMode.value);

    const nodes = [callerTag(1)];

    // Top-left: Sentence window lens (center hit + +/-3 neighbors vs distant definition)
    const winY = -175;
    nodes.push(
      txt('SENTENCE WINDOW (+/-3 NEIGHBORS)', -855, winY - 56, 26, COSMOS.muted, 'mono', 'left'),
    );
    const segXs = [-820, -720, -620, -520, -420, -320, -220, -85];
    segXs.forEach((sx, i) => {
      const isHit = i === 3;
      const isNeighbor = i >= 1 && i <= 5 && i !== 3;
      const isDistant = i === 7;
      const lit = isHit || (isNeighbor && we > 0.3);
      const col = isDistant ? ROLE.session : isHit ? ROLE.focus : lit ? ROLE.policy : '#384a70';
      nodes.push(
        lumBar(sx, winY, 76, 46, {
          color: col,
          fillAlpha: isHit ? 0.35 : lit ? 0.2 : 0.07,
          strokeWidth: isHit ? 2.8 : 1.8,
          glow: lit ? 8 : 0,
          radius: 7,
        }),
        txt(
          isDistant ? 's+10' : isHit ? 'HIT' : `s${i - 3 > 0 ? '+' : ''}${i - 3}`,
          sx,
          winY,
          26,
          col,
          'mono',
          'center',
        ),
      );
    });
    nodes.push(txt('distant def outside', -85, winY + 46, 26, ROLE.session, 'mono', 'center'));

    // Top-right: U-shaped "Lost in the Middle" position attention curve (always subtly present, lights up on `pr-position`)
    const uX0 = 140;
    const uY0 = -255;
    const uW = 680;
    const uH = 165;
    const uPts = [];
    for (let i = 0; i <= 36; i++) {
      const t = i / 36;
      const acc = 0.28 + 0.68 * Math.pow(2 * t - 1, 2); // U-curve: high start/end, dip in middle
      uPts.push([uX0 + t * uW, uY0 + uH - acc * uH]);
    }
    const uOp = 0.35 + 0.65 * pc;
    nodes.push(
      txt(
        'POSITION ACCURACY (LOST IN THE MIDDLE)',
        uX0,
        uY0 - 24,
        26,
        pc > 0.3 ? ROLE.focus : COSMOS.muted,
        'mono',
        'left',
      ).opacity(uOp),
      line([uX0, uY0 + uH], [uX0 + uW, uY0 + uH], { stroke: '#2c3d63', width: 2 }).opacity(uOp),
      glowingTrail(uPts, {
        gradientColors: [ROLE.admitted, ROLE.danger, ROLE.admitted],
        width: 4.2,
        glow: 9 * uOp,
        opacity: uOp,
      }),
      txt('START', uX0, uY0 + uH + 28, 26, ROLE.admitted, 'mono', 'left').opacity(uOp),
      txt('MIDDLE DIP', uX0 + uW * 0.5, uY0 + uH + 28, 26, ROLE.danger, 'mono', 'center').opacity(
        uOp,
      ),
      txt('END', uX0 + uW, uY0 + uH + 28, 26, ROLE.admitted, 'mono', 'right').opacity(uOp),
    );

    // Middle: 400-character Evidence Channel (max visual scale = 550 chars so 514 overflow is vivid!)
    const chL = -855;
    const chY = 58;
    const chMaxScale = 550;
    const chFullW = 1690;
    const chPx = (val) => (val / chMaxScale) * chFullW;
    const capX = chL + chPx(capChars);

    const wE1 = chPx(e1Chars * e1);
    const wApp = chPx(appendixChars * ap);
    const wE2 = chPx(e2Chars * e2);
    const currentChars = Math.round(e1Chars * e1 + appendixChars * ap + e2Chars * e2);

    nodes.push(
      txt(
        `LABELED EVIDENCE BUDGET:  ${currentChars} / ${capChars} CHARS`,
        chL,
        chY - 56,
        28,
        ap > 0.3 ? ROLE.danger : ROLE.policy,
        'mono',
        'left',
      ),
      // Background track up to 400 cap
      lumBar(chL + chPx(capChars) * 0.5, chY, chPx(capChars), 62, {
        color: '#2c3d63',
        fillAlpha: 0.2,
        strokeWidth: 2,
        glow: 0,
        radius: 9,
      }),
    );

    if (wE1 > 4) {
      nodes.push(
        lumBar(chL + wE1 * 0.5, chY, wE1 - 3, 52, {
          color: ROLE.policy,
          fillAlpha: 0.55,
          strokeWidth: 2.2,
          glow: 9 + dp * 6,
          radius: 7,
        }),
      );
      if (wE1 > 195) {
        nodes.push(txt('[E1] 217', chL + wE1 * 0.5, chY, 26, COSMOS.ink, 'mono', 'center'));
      }
    }

    if (wApp > 4) {
      nodes.push(
        lumBar(chL + wE1 + wApp * 0.5, chY, wApp - 3, 52, {
          color: ROLE.danger,
          fillAlpha: 0.52,
          strokeWidth: 2.4,
          glow: 11 * pulse,
          radius: 7,
        }),
      );
      if (chL + wE1 + wApp > capX + 265) {
        nodes.push(
          txt('Appendix +297', capX + 24, chY, 26, COSMOS.ink, 'mono', 'left').opacity(ap),
        );
      }
    }

    if (wE2 > 4) {
      nodes.push(
        lumBar(chL + wE1 + wE2 * 0.5, chY, wE2 - 3, 52, {
          color: ROLE.session,
          fillAlpha: 0.58,
          strokeWidth: 2.2,
          glow: 9,
          radius: 7,
        }),
      );
      if (wE2 > 195) {
        nodes.push(txt('[E2] +121', chL + wE1 + wE2 * 0.5, chY, 26, COSMOS.ink, 'mono', 'center'));
      }
    }

    // 400-char glowing gold cap laser wall
    nodes.push(
      line([capX, chY - 40], [capX, chY + 46], { stroke: ROLE.focus, width: 4.2 }).glow(
        10 * pulse,
        ROLE.focus,
      ),
      txt('400 CHAR CAP', capX + 18, chY - 58, 26, ROLE.focus, 'mono', 'left'),
    );

    // Duplicate hit indicator (adds 0 chars)
    if (dp > 0.1) {
      nodes.push(
        glowDot(chL + wE1 + wE2, chY, {
          radius: 9,
          color: ROLE.admitted,
          glow: 13 * pulse,
          opacity: dp,
        }),
        txt(
          '2nd E1 hit -> +0 chars (deduplicated)',
          chL + wE1 + wE2 + 24,
          chY + 56,
          26,
          ROLE.admitted,
          'mono',
          'left',
        ).opacity(dp),
      );
    }

    // Lower: Whole-request token budget (1024 total = 501 input + 256 output reserve + 267 spare)
    const tokY = 252;
    const tokTotal = fixture.budget.limit + fixture.budget.reservedOutput; // 1024
    const tPx = (val) => (val / tokTotal) * chFullW;
    const wIn = tPx(fixture.budget.total * tf);
    const wOut = tPx(fixture.budget.reservedOutput * tf);

    nodes.push(
      txt(
        `WHOLE-REQUEST TOKEN BUDGET (TOY BYTES):  ${Math.round(fixture.budget.total * tf)} INPUT  +  ${Math.round(fixture.budget.reservedOutput * tf)} OUTPUT RESERVE  /  ${tokTotal}`,
        chL,
        tokY - 52,
        26,
        tf > 0.2 ? ROLE.request : COSMOS.muted,
        'mono',
        'left',
      ),
      lumBar(chL + chFullW * 0.5, tokY, chFullW, 54, {
        color: '#2c3d63',
        fillAlpha: 0.2,
        strokeWidth: 2,
        glow: 0,
        radius: 8,
      }),
    );
    if (wIn > 4) {
      nodes.push(
        lumBar(chL + wIn * 0.5, tokY, wIn - 3, 46, {
          color: ROLE.request,
          fillAlpha: 0.56,
          strokeWidth: 2,
          glow: 8,
          radius: 6,
        }),
      );
      if (wIn > 315) {
        nodes.push(
          txt('Input 501 tokens', chL + wIn * 0.5, tokY, 26, COSMOS.ink, 'mono', 'center'),
        );
      }
    }
    if (wOut > 4) {
      nodes.push(
        lumBar(chL + wIn + wOut * 0.5, tokY, wOut - 3, 46, {
          color: ROLE.violet,
          fillAlpha: 0.52,
          strokeWidth: 2,
          glow: 7,
          radius: 6,
        }),
      );
      if (wOut > 345) {
        nodes.push(
          txt('Output reserve 256', chL + wIn + wOut * 0.5, tokY, 26, COSMOS.ink, 'mono', 'center'),
        );
      }
    }

    // Discrete bottom verdict (strict prediction withholding before `pr-skip`)
    const footMap = [
      {
        text: 'Check actual clause boundaries before widening a local sentence window',
        col: COSMOS.muted,
        font: 'sans',
      },
      {
        text: 'Key section E1 uses 217 chars  ·  183 chars remain free',
        col: ROLE.policy,
        font: 'mono',
      },
      {
        text: 'Appendix needs 297 chars (only 183 free). What should the packer do?',
        col: ROLE.focus,
        font: 'serif',
      },
      {
        text: `Skip whole appendix  ->  admit complete E2 (+121)  =  ${totalChars} / ${capChars} chars`,
        col: ROLE.admitted,
        font: 'mono',
      },
      {
        text: `Duplicate E1 hit adds 0 chars  ·  occupancy stays ${totalChars}`,
        col: ROLE.admitted,
        font: 'mono',
      },
      {
        text: 'Count tokens with target tokenizer  ·  test placement & coverage',
        col: ROLE.focus,
        font: 'mono',
      },
    ];
    const ft = footMap[Math.max(0, Math.min(footMap.length - 1, fm))];
    nodes.push(txt(ft.text, -855, 412, 30, ft.col, ft.font, 'left').glow(fm >= 2 ? 7 : 0, ft.col));

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.request), title, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'pr-window', windowExpand, 1, { dur: 0.65 });
  playCue(
    s,
    c,
    'pr-characters',
    (d) => s.play(e1Fill.to(1, { duration: d }), footMode.to(1, { duration: 0.05 })),
    { dur: 0.75 },
  );
  playCue(
    s,
    c,
    'pr-oversized',
    (d) => s.play(appFill.to(1, { duration: d }), footMode.to(2, { duration: 0.05 })),
    { dur: 0.8 },
  );
  playCue(
    s,
    c,
    'pr-skip',
    (d) =>
      s.play(
        seq(appFill.to(0, { duration: d * 0.45 }), e2Fill.to(1, { duration: d * 0.55 })),
        footMode.to(3, { duration: 0.05 }),
      ),
    { after: true, dur: 0.9 },
  );
  playCue(
    s,
    c,
    'pr-dedup',
    (d) => s.play(dedupPulse.to(1, { duration: d }), footMode.to(4, { duration: 0.05 })),
    { after: true, dur: 0.55 },
  );
  playCue(
    s,
    c,
    'pr-tokens',
    (d) => s.play(tokenFill.to(1, { duration: d }), footMode.to(5, { duration: 0.05 })),
    { dur: 0.85 },
  );
  tweenCue(s, c, 'pr-position', posCurve, 1, { dur: 0.65 });
}
