// Scene 11: What changes when we reverse KL? (3D Forward vs Reverse KL landscape + bimodal mode choice)
import {
  BIMODAL_CANDIDATES,
  BIMODAL_FWD,
  BIMODAL_REV,
  BIMODAL_TEACHER,
  COSMOS,
  aura,
  buildKlLandscape3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainAfterDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function reverseCapacity(s, c) {
  const phase = s.value(0);
  const modeBimodal = s.value(0); // 0 = Beat 0 (2-token + 3D KL landscape), 1 = Beat 1-2 (3 bimodal shapes)
  const sFwdDraw = s.value(0);
  const sZeroFwd = s.value(0);
  const sRevDraw = s.value(0);
  const sZeroRev = s.value(0);
  const sFwdFam = s.value(0);
  const sRevFam = s.value(0);
  const sExact = s.value(0);

  const bgAura = aura(440, 35, 580, '#2a164c2a', '#12385c18');
  const kl3d = buildKlLandscape3d(phase, { x: 470, y: 40 });

  const title = heroTitle(['What Changes When We', 'Reverse KL Divergence?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.rose,
    eyebrow: 'FORWARD KL (MODE-COVERING) vs REVERSE KL (MODE-SEEKING)',
  });

  const eqFwdRev = glowTex('D_{\\mathrm{KL}}(q \\Vert p) \\neq D_{\\mathrm{KL}}(p \\Vert q)', {
    x: 470,
    y: -365,
    size: 38,
    color: COSMOS.gold,
    glow: 7,
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const bi = modeBimodal.value > 0.5;

    if (!bi) {
      // Beat 0: Two-token support asymmetry [0.5, 0.5] vs [1.0, 0.0] beside the 3D KL surface
      const fd = sFwdDraw.value;
      const zf = sZeroFwd.value;
      const rd = sRevDraw.value;
      const zr = sZeroRev.value;

      const barW = 240;
      const barH = 44;
      const tX = -690;
      const sX = -290;

      const nodes = [
        txt('TOKEN', -835, -172, 26, COSMOS.muted, 'mono', 'left'),
        txt('TEACHER q', tX, -172, 28, COSMOS.blue, 'mono', 'left'),
        txt('STUDENT p', sX, -172, 28, COSMOS.cyan, 'mono', 'left'),
      ];

      [
        { tok: 'A', q: 0.5, pVal: 1.0, y: -96, active: rd > 0.3 },
        { tok: 'B', q: 0.5, pVal: 0.0, y: 8, active: fd > 0.3 && rd < 0.3 },
      ].forEach(({ tok, q, pVal, y, active }) => {
        nodes.push(
          txt(tok, -810, y, 42, active ? COSMOS.gold : COSMOS.ink, 'mono'),
          // Teacher track
          rect(barW, barH, { fill: '#10182b', stroke: COSMOS.rule, width: 1.8, radius: 6 }).at(
            tX + barW * 0.5,
            y,
          ),
          rect(barW * q, barH, { fill: '#17386b', stroke: COSMOS.blue, width: 2.2, radius: 6 }).at(
            tX + barW * q * 0.5,
            y,
          ),
          txt(q.toFixed(1), tX + barW + 18, y, 28, COSMOS.blue, 'mono', 'left'),

          // Student track
          rect(barW, barH, { fill: '#10182b', stroke: COSMOS.rule, width: 1.8, radius: 6 }).at(
            sX + barW * 0.5,
            y,
          ),
        );
        if (pVal > 0) {
          nodes.push(
            rect(barW * pVal, barH, {
              fill: '#0e3c50',
              stroke: COSMOS.cyan,
              width: 2.2,
              radius: 6,
            }).at(sX + barW * pVal * 0.5, y),
          );
        } else {
          nodes.push(
            line([sX, y - 24], [sX, y + 24], { stroke: COSMOS.rose, width: 5 }).glow(
              8,
              COSMOS.rose,
            ),
          );
        }
        nodes.push(
          txt(
            pVal.toFixed(1),
            sX + barW + 18,
            y,
            28,
            pVal > 0 ? COSMOS.cyan : COSMOS.rose,
            'mono',
            'left',
          ),
        );
      });

      nodes.push(
        // Forward KL readout
        glassCell(-420, 166, 860, 96, zf > 0.5 ? COSMOS.rose : COSMOS.blue, {
          fill: zf > 0.5 ? '#2a121c' : '#101d35',
          glow: zf > 0.5 ? 10 * pulse : 4,
          opacity: Math.max(0.75, fd),
        }),
        txt('FORWARD KL (weights B by q=0.5)', -825, 140, 26, COSMOS.blue, 'mono', 'left'),
        txt(
          zf > 0.5
            ? 'p(B) -> 0  ==>  0.5 ln(0.5 / 0) = +INFINITY'
            : '0.5 x ln(0.5 / p(B))  as p(B) -> 0 ...',
          -825,
          186,
          28,
          zf > 0.5 ? COSMOS.rose : COSMOS.ink,
          'mono',
          'left',
        ),

        // Reverse KL readout (keep prefix steady; reveal crisp short answer after zero-mass-kl)
        glassCell(-420, 294, 860, 96, zr > 0.5 ? COSMOS.cyan : COSMOS.rule, {
          fill: zr > 0.5 ? '#0e2838' : '#10182b',
          glow: zr > 0.5 ? 9 * pulse : 2,
          opacity: Math.max(0.72, rd),
        }),
        txt('REVERSE KL (draws from student: only A)', -825, 268, 26, COSMOS.cyan, 'mono', 'left'),
        txt('1.0 x ln(1 / 0.5)', -825, 314, 28, COSMOS.ink, 'mono', 'left'),
        txt(
          zr > 0.5 ? '= ln 2 (0.693)' : '= ?',
          -495,
          314,
          28,
          zr > 0.5 ? COSMOS.emerald : COSMOS.muted,
          'mono',
          'left',
        ),

        txt('3D DIVERGENCE LANDSCAPE', 470, -296, 26, COSMOS.rose, 'mono'),
        txt(
          'Rose edge: Forward KL blows up · Cyan edge: Reverse KL <= ln 2',
          470,
          408,
          26,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes);
    }

    // Beats 1 & 2: Bimodal teacher [0.49, 0.02, 0.49] vs Left, Center, Right student shapes
    const ff = sFwdFam.value;
    const rf = sRevFam.value;
    const ex = sExact.value;

    const names = ['Left (mode-seek)', 'Center (mode-cover)', 'Right (mode-seek)'];
    const baseY = 128;
    const scale = 235;

    const nodes = [
      txt(
        'BIMODAL TEACHER TICKS:  [0.49,  0.02,  0.49]',
        -855,
        -206,
        28,
        COSMOS.blue,
        'mono',
        'left',
      ),
      txt('STUDENT CANDIDATE BARS', 195, -206, 28, COSMOS.cyan, 'mono', 'left'),
    ];

    BIMODAL_CANDIDATES.forEach((cand, i) => {
      const gx = -565 + i * 565;
      const isFwdWin = i === 1;
      const isRevWin = i === 0 || i === 2;
      const frameCol =
        ff > 0.5 && rf < 0.5 && isFwdWin
          ? COSMOS.gold
          : rf > 0.5 && isRevWin
            ? COSMOS.emerald
            : COSMOS.rule;

      nodes.push(
        glassCell(gx, 46, 510, 430, frameCol, {
          fill: '#0e1628',
          glow: frameCol !== COSMOS.rule ? 8 * pulse : 2,
        }),
        txt(names[i], gx, -132, 28, COSMOS.ink, 'mono'),
        line([gx - 210, baseY], [gx + 210, baseY], { stroke: COSMOS.rule, width: 2 }),
      );

      cand.forEach((v, j) => {
        const bx = gx + (j - 1) * 126;
        const bh = Math.max(8, v * scale);
        const tickY = baseY - BIMODAL_TEACHER[j] * scale;
        nodes.push(
          rect(74, bh, { fill: '#0e3c50', stroke: COSMOS.cyan, width: 2.2, radius: 5 }).at(
            bx,
            baseY - bh * 0.5,
          ),
          line([bx - 48, tickY], [bx + 48, tickY], { stroke: COSMOS.blue, width: 5.5 }).glow(
            7,
            COSMOS.blue,
          ),
          txt(v.toFixed(2), bx, baseY + 32, 26, COSMOS.cyan, 'mono'),
        );
      });

      // Withheld KL scores until forward-family / reverse-family finish!
      nodes.push(
        txt(
          ff > 0.5
            ? `Forward KL: ${BIMODAL_FWD[i].toFixed(3)}${isFwdWin ? '  WIN' : ''}`
            : 'Forward KL:  ?',
          gx,
          198,
          26,
          ff > 0.5 ? (isFwdWin ? COSMOS.gold : COSMOS.muted) : COSMOS.dim,
          'mono',
        ),
        txt(
          rf > 0.5
            ? `Reverse KL: ${BIMODAL_REV[i].toFixed(3)}${isRevWin ? '  WIN' : ''}`
            : 'Reverse KL:  ?',
          gx,
          236,
          26,
          rf > 0.5 ? (isRevWin ? COSMOS.emerald : COSMOS.muted) : COSMOS.dim,
          'mono',
        ),
      );
    });

    nodes.push(
      glassCell(0, 356, 1640, 88, ex > 0.5 ? COSMOS.emerald : COSMOS.gold, {
        fill: ex > 0.5 ? '#0f2c27' : '#201b0d',
        dash: ff < 0.5 ? [8, 6] : undefined,
        glow: 7 * pulse,
      }),
      txt(
        ex > 0.5
          ? 'Both KL = 0.000'
          : rf > 0.5
            ? 'Reverse KL penalizes valley mass (0.50 on 0.02) -> Either side wins!'
            : ff > 0.5
              ? 'Forward KL weights the two peaks -> Center covers both and wins!'
              : 'Which shape wins under Forward KL? Which wins under Reverse KL?',
        0,
        358,
        28,
        ex > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, kl3d, title, eqFwdRev, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, kl3d, { theta: -0.22, phi: 0.92 });

  c.on('forward-draw', () => s.play(sFwdDraw.to(1, { duration: 0.45 })));
  c.after('zero-forward', () =>
    s.play(sZeroFwd.to(1, { duration: remainAfterDuration(c, 'zero-forward', 0.4) })),
  );
  c.on('reverse-draw', () => s.play(sRevDraw.to(1, { duration: 0.45 })));
  c.after('zero-mass-kl', () =>
    s.play(sZeroRev.to(1, { duration: remainAfterDuration(c, 'zero-mass-kl', 0.4) })),
  );
  c.hide(1, kl3d);
  c.onBeat(1, () => s.play(modeBimodal.to(1, { duration: 0.35 })));
  c.after('forward-family', () =>
    s.play(sFwdFam.to(1, { duration: remainAfterDuration(c, 'forward-family', 0.45) })),
  );
  c.after('reverse-family', () =>
    s.play(sRevFam.to(1, { duration: remainAfterDuration(c, 'reverse-family', 0.45) })),
  );
  c.after('exact-family', () =>
    s.play(sExact.to(1, { duration: remainAfterDuration(c, 'exact-family', 0.45) })),
  );
}
