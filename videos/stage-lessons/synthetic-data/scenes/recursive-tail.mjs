// Scene 15: Can a rare search disappear in one round? (Orbiting 3D tail-collapse surface + 8-draw omission 0.95^8)
import {
  COMMON_MASS,
  COSMOS,
  FITTED_RARE_MASS,
  RARE_MASS,
  TAIL_DRAWS,
  TAIL_OMISSION_8,
  aura,
  buildCollapseSurface3d,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function recursiveTail(s, c) {
  const phase = s.value(0);
  const collapseMode = s.value(0); // 0 = recursive replacement collapse
  const sPremise = s.value(0);
  const sPredict = s.value(0);
  const sMissRule = s.value(0);
  const sAnswer = s.value(0);
  const drawsProg = s.value(0); // 0..8 animated draws
  const sEmpZero = s.value(0);
  const sRepZero = s.value(0);
  const dropProg = s.value(0); // 0..1 draw at 0.99 dropping from rose to blue
  const sToyLimit = s.value(0);

  const bgAura = aura(440, 20, 560, '#3a14282a', '#12385c18');
  const surf3d = buildCollapseSurface3d(phase, collapseMode, { x: 470, y: 20 });

  const title = heroTitle(['Can a Rare Search', 'Disappear in One Round?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'MODEL COLLAPSE · RECURSIVE TAIL OMISSION (SHUMAILOV ET AL.)',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const prm = Math.max(0.75, sPremise.value);
    const prd = sPredict.value;
    const msr = sMissRule.value;
    const ans = sAnswer.value > 0.5;
    const dp = drawsProg.value;
    const emp = sEmpZero.value > 0.5;
    const rep = sRepZero.value > 0.5;
    const drp = dropProg.value;
    const lim = sToyLimit.value > 0.3;

    const stripX = -830;
    const stripW = 860;
    const stripY = -126;
    const stripH = 66;
    const blueW = stripW * COMMON_MASS;
    const roseW = stripW * RARE_MASS;

    const nodes = [
      // 3D caption top/bottom right (strictly clear of 3D mesh)
      txt('3D RECURSIVE COLLAPSE SURFACE', 470, -370, 26, COSMOS.rose, 'mono'),
      txt(
        'Rose tail vanishes across synthetic replacement rounds',
        470,
        412,
        26,
        COSMOS.muted,
        'sans',
      ),

      // Original probability strip (95% ordinary blue, 5% retry rose)
      txt(
        'ORIGINAL MODEL:  95% ordinary  ·  5% retry',
        stripX,
        stripY - 56,
        26,
        COSMOS.blue,
        'mono',
        'left',
      ),
      rect(blueW, stripH, { fill: '#123266', stroke: COSMOS.blue, width: 2.4, radius: 6 })
        .at(stripX + blueW * 0.5, stripY)
        .opacity(prm),
      rect(roseW, stripH, { fill: '#5c142c', stroke: COSMOS.rose, width: 2.6, radius: 6 })
        .at(stripX + blueW + roseW * 0.5, stripY)
        .glow(8 * pulse, COSMOS.rose)
        .opacity(prm),
    ];

    // 8 draw markers on the original strip + 8 batch slots below
    const slotY = 66;
    const drawnCount = Math.min(TAIL_DRAWS.length, Math.floor(dp + 0.05));
    nodes.push(
      txt(
        drawnCount > 0
          ? `BATCH OF 8 DRAWS (${drawnCount} / 8 LANDED IN BLUE)`
          : 'NEXT ROUND: 8 INDEPENDENT DRAWS',
        stripX,
        slotY - 56,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    );

    TAIL_DRAWS.forEach((d, idx) => {
      const sx = stripX + idx * 108 + 46;
      const landed = idx < drawnCount;
      nodes.push(
        glassCell(sx, slotY, 92, 64, landed ? COSMOS.blue : COSMOS.rule, {
          fill: landed ? '#123266' : '#0c1222',
          glow: landed ? 5 : 0,
        }),
        txt(
          landed ? d.uniform.toFixed(1) : d.id,
          sx,
          slotY + 2,
          26,
          landed ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),
      );
      if (landed) {
        const dotX = stripX + d.uniform * stripW;
        nodes.push(glowDot(dotX, stripY, { radius: 6, color: COSMOS.gold }));
      }
    });

    // Empirical fitted strip (collapses to 100% blue, 0% rose)
    const fitY = 236;
    nodes.push(
      txt(
        rep || emp
          ? `NEXT MODEL FIT TO BATCH:  100% ordinary  ·  ${Math.round(FITTED_RARE_MASS * 100)}% retry`
          : 'NEXT MODEL (EXACT FIT TO 8-DRAW BATCH)',
        stripX,
        fitY - 56,
        26,
        rep || emp ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ),
      rect(stripW, stripH, {
        fill: rep || emp ? '#123266' : '#0c1222',
        stroke: rep || emp ? COSMOS.rose : COSMOS.rule,
        width: 2.4,
        radius: 6,
      }).at(stripX + stripW * 0.5, fitY),
      txt(
        rep || emp ? '100% ordinary   ·   P(retry) = 0' : 'awaiting 8 draws...',
        stripX + stripW * 0.5,
        fitY + 2,
        28,
        rep || emp ? COSMOS.rose : COSMOS.dim,
        'mono',
      ),
    );

    // Draw at 0.99 dropping from original rose tip straight down into new blue strip!
    if (drp > 0.05) {
      const x99 = stripX + 0.99 * stripW;
      const curY = stripY + (fitY - stripY) * drp;
      nodes.push(
        line([x99, stripY], [x99, curY], { stroke: COSMOS.gold, width: 4.2 }).glow(9, COSMOS.gold),
        glowDot(x99, curY, { radius: 9, color: COSMOS.gold }),
        txt('u = 0.99', x99 - 22, 142, 26, COSMOS.gold, 'mono', 'right'),
      );
    }

    // Bottom status bar (strictly withholds 66.3% until c.after('omission-answer')!)
    let statusMsg = 'Every draw has a 5% chance of hitting the pink retry tail';
    let statusCol = COSMOS.cyan;
    if (prd > 0.3 && !ans && msr < 0.3) {
      statusMsg = 'PREDICT: Chance all 8 draws miss the 5% retry tail?';
      statusCol = COSMOS.gold;
    } else if (msr > 0.3 && !ans) {
      statusMsg = 'One draw misses at p = 0.95 -> 8 misses = 0.95^8';
      statusCol = COSMOS.gold;
    } else if (ans && drawnCount === 0) {
      statusMsg = `P(0 retries) = 0.95^8 = ${TAIL_OMISSION_8.toFixed(4)} (~66%, 2 of 3 batches)`;
      statusCol = COSMOS.gold;
    } else if (drawnCount > 0 && !rep) {
      statusMsg = 'All 8 draws landed in blue (0 retries in batch)';
      statusCol = COSMOS.cyan;
    } else if (rep && !lim) {
      statusMsg = '0 retries -> replacement fit sets P(retry) = 0';
      statusCol = COSMOS.rose;
    } else if (lim) {
      statusMsg = 'Test retries separately: common score hides lost tail';
      statusCol = COSMOS.amber;
    }

    nodes.push(
      glassCell(-400, 382, 860, 86, statusCol, { fill: '#10182b', glow: 6 }),
      txt(statusMsg, -400, 384, 26, statusCol, 'sans'),
    );

    return group(...nodes);
  });

  const eqOmit = glowTex(`P(0\\text{ retries}) = 0.95^8 \\approx ${TAIL_OMISSION_8.toFixed(4)}`, {
    x: -195,
    y: -236,
    size: 36,
    color: COSMOS.gold,
    glow: 7,
  });

  s.add(bgAura, surf3d, title, live);
  runPhase(s, c, phase, 16);
  orbitScene(s, c, surf3d, { theta: -0.2, phi: 0.92 });

  c.on('tail-premise', () => s.play(sPremise.to(1, { duration: 0.4 })));
  c.on('tail-predict', () => s.play(sPredict.to(1, { duration: 0.4 })));
  c.on('miss-rule', () => s.play(sMissRule.to(1, { duration: 0.4 })));
  c.show('omission-answer', eqOmit, { after: true });
  c.after('omission-answer', () => s.play(sAnswer.to(1, { duration: 0.35 })));
  c.on('sample-eight', () => s.play(drawsProg.to(8, { duration: 1.8 })));
  c.after('empirical-zero', () => s.play(sEmpZero.to(1, { duration: 0.35 })));
  c.after('replacement-zero', () => s.play(sRepZero.to(1, { duration: 0.35 })));
  c.on('tail-limit', () => s.play(dropProg.to(1, { duration: 0.9 })));
  c.on('tail-toy-limit', () =>
    s.play(sToyLimit.to(1, { duration: remainDuration(c, 'tail-toy-limit', 0.45) })),
  );
}
