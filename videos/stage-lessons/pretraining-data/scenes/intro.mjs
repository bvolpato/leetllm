// Scene 01: Two records from a web crawl: glowing classifier score laser rail & cutoff shift.
import {
  CODE_RECORD,
  COSMOS,
  MENU_RECORD,
  aura,
  extractionFixture,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  laserRail,
  line,
  photonStream,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const menuPulse = s.value(0);
  const chooseGlow = s.value(0);
  const activeCutoff = s.value(0); // 0 = withheld (prediction), 1 = active
  const cutoffPos = s.value(0.5);
  const raised = s.value(0);

  const codeLines = extractionFixture.filter((row) => row.code).map((row) => row.text);

  const bgAura = aura(0, 40, 660, '#1e2c5c30', '#4c2f8a12');
  const title = heroTitle(['Two Records From', 'a Web Crawl'], {
    x: -855,
    y: -435,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.cyan,
    eyebrow: 'PRETRAINING DATA PIPELINE · CLASSIFIER CUTOFF',
  });

  const live = guardedDynamic(s.value(1), () => {
    const ph = phase.value;
    const mp = menuPulse.value;
    const cg = chooseGlow.value;
    const act = activeCutoff.value;
    const cut = cutoffPos.value;
    const rz = raised.value;

    const railX0 = -760;
    const railX1 = 760;
    const railY = 175;
    const scoreToX = (v) => railX0 + (railX1 - railX0) * v;

    const menuX = scoreToX(MENU_RECORD.score);
    const codeX = scoreToX(CODE_RECORD.score);
    const menuDrop = act > 0.5 && MENU_RECORD.score < cut;
    const codeDrop = act > 0.5 && CODE_RECORD.score < cut;

    const menuCol = menuDrop ? COSMOS.dim : COSMOS.rose;
    const codeCol = codeDrop ? COSMOS.dim : COSMOS.violet;

    const nodes = [];

    // Background flowing crawl photons converging onto both records
    nodes.push(
      ...photonStream([-900, -140], [menuX - 240, -100], -35, ph, {
        color: menuCol,
        count: 4,
        opacity: menuDrop ? 0.25 : 0.72,
      }),
      ...photonStream([900, -140], [codeX + 260, -100], -35, ph + 1.5, {
        color: codeCol,
        count: 4,
        opacity: codeDrop ? 0.25 : 0.8,
      }),
    );

    // Laser score ruler
    nodes.push(...laserRail(railX0, railX1, railY, { activeFrom: act > 0.5 ? cut : null }));

    // Menu record specimen floating above score 0.10
    const menuCx = Math.max(-545, menuX);
    nodes.push(
      glassCell(menuCx, -92, 540, 210, menuCol, {
        fill: menuDrop ? '#0b0e19' : '#181020',
        glow: menuDrop ? 0 : 8 + mp * 8,
        opacity: menuDrop ? 0.48 : 0.94,
      }),
      txt('MENU EXCERPT · D', menuCx - 235, -158, 26, menuCol, 'mono', 'left'),
      txt(`${MENU_RECORD.tokens} tokens`, menuCx + 235, -158, 26, COSMOS.muted, 'mono', 'right'),
      txt('menu   menu', menuCx, -88, 36, menuDrop ? COSMOS.dim : COSMOS.ink, 'mono'),
      txt('menu   menu', menuCx, -32, 36, menuDrop ? COSMOS.dim : COSMOS.ink, 'mono'),
      // Stem down to score 0.10 (gapped cleanly around numeric label)
      glowingTrail(
        [
          [menuX, 18],
          [menuX, 60],
        ],
        { color: menuCol, width: 3.2, glow: menuDrop ? 0 : 8, opacity: menuDrop ? 0.4 : 0.9 },
      ),
      glowingTrail(
        [
          [menuX, 134],
          [menuX, railY - 12],
        ],
        { color: menuCol, width: 3.2, glow: menuDrop ? 0 : 8, opacity: menuDrop ? 0.4 : 0.9 },
      ),
      glowDot(menuX, railY, {
        radius: 10 + mp * 4,
        color: menuCol,
        glow: menuDrop ? 2 : 14,
      }),
      txt(MENU_RECORD.score.toFixed(2), menuX, 96, 38, menuCol, 'mono'),
    );

    // Code record specimen floating above score 0.70
    const codeCx = Math.min(430, codeX);
    nodes.push(
      glassCell(codeCx, -92, 620, 210, codeCol, {
        fill: codeDrop ? '#0b0e19' : '#13162b',
        glow: codeDrop ? 0 : 10,
        opacity: codeDrop ? 0.48 : 0.95,
      }),
      txt('PYTHON EXCERPT · C', codeCx - 275, -158, 26, codeCol, 'mono', 'left'),
      txt(`${CODE_RECORD.tokens} tokens`, codeCx + 275, -158, 26, COSMOS.muted, 'mono', 'right'),
      txt(codeLines[0], codeCx - 255, -88, 36, codeDrop ? COSMOS.dim : COSMOS.ink, 'mono', 'left'),
      txt(codeLines[1], codeCx - 255, -32, 36, codeDrop ? COSMOS.dim : COSMOS.cyan, 'mono', 'left'),
      glowingTrail(
        [
          [codeX, 18],
          [codeX, 60],
        ],
        { color: codeCol, width: 3.2, glow: codeDrop ? 0 : 8, opacity: codeDrop ? 0.4 : 0.9 },
      ),
      glowingTrail(
        [
          [codeX, 134],
          [codeX, railY - 12],
        ],
        { color: codeCol, width: 3.2, glow: codeDrop ? 0 : 8, opacity: codeDrop ? 0.4 : 0.9 },
      ),
      glowDot(codeX, railY, {
        radius: 11,
        color: codeCol,
        glow: codeDrop ? 2 : 14,
      }),
      txt(CODE_RECORD.score.toFixed(2), codeX, 96, 38, codeCol, 'mono'),
    );

    // Cutoff gates: before pt-intro-first, show BOTH candidate cutoffs neutrally (withheld!)
    if (act < 0.5) {
      for (const candidate of [0.5, 0.85]) {
        const cx = scoreToX(candidate);
        nodes.push(
          line([cx, railY - 34], [cx, railY + 86], {
            stroke: COSMOS.gold,
            width: 3 + cg * 2,
            dash: [10, 6],
          }).glow(6 + cg * 6, COSMOS.gold),
          txt(candidate.toFixed(2), cx, railY + 132, 42, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
        );
      }
      nodes.push(
        txt('Keep score >= cutoff: choose 0.50 or 0.85?', 0, 410, 36, COSMOS.ink, 'serif'),
      );
    } else {
      // Active moving cutoff beam (strictly between score label y=96 and verdict y=258 so it never sweeps across text)
      const cx = scoreToX(cut);
      nodes.push(
        glowingTrail(
          [
            [cx, 134],
            [cx, 220],
          ],
          { color: COSMOS.gold, width: 5, glow: 14 },
        ),
        txt(`CUTOFF ${cut.toFixed(2)}`, cx, 326, 38, COSMOS.gold, 'mono').glow(10, COSMOS.gold),
        txt(
          menuDrop ? 'DROP' : 'KEEP',
          menuX,
          258,
          32,
          menuDrop ? COSMOS.rose : COSMOS.emerald,
          'mono',
        ),
        txt(
          codeDrop ? 'DROP' : 'KEEP',
          codeX,
          258,
          32,
          codeDrop ? COSMOS.rose : COSMOS.emerald,
          'mono',
        ),
      );

      // Pool readout at bottom
      const keptTokens = (menuDrop ? 0 : MENU_RECORD.tokens) + (codeDrop ? 0 : CODE_RECORD.tokens);
      const statusText =
        rz > 0.5
          ? '0 code tokens remain · save source ID C to trace and restore'
          : `${keptTokens} code tokens enter the training pool`;
      nodes.push(
        txt(statusText, 0, 412, 34, rz > 0.5 ? COSMOS.amber : COSMOS.emerald, 'sans').glow(
          6,
          rz > 0.5 ? COSMOS.amber : COSMOS.emerald,
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('pt-intro-menu', () =>
    s.play(menuPulse.to(1, { duration: remainDuration(c, 'pt-intro-menu', 0.6) })),
  );
  c.on('pt-intro-choose', () =>
    s.play(chooseGlow.to(1, { duration: remainDuration(c, 'pt-intro-choose', 0.6) })),
  );
  // Strict prediction withholding: reveal active cutoff 0.50 only after "Try point five"
  c.after('pt-intro-first', () =>
    s.play(activeCutoff.to(1, { duration: remainAfterDuration(c, 'pt-intro-first', 0.4) })),
  );
  c.on('pt-intro-raise', () => {
    const dur = remainDuration(c, 'pt-intro-raise', 1.2);
    s.play(cutoffPos.to(0.85, { duration: dur }));
    s.play(raised.to(1, { duration: dur }));
  });
}
