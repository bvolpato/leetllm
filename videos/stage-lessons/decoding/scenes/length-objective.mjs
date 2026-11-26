// Scene 8: length-objective: "Length normalization changes the search objective"
// Signature 3D orbiting GNMT length-penalty surface (cinematic3d + parametricSurface + orbitScene)
// + MathJax GNMT equation paired with completed S (len 2, log P = -1.00) and L (len 5, log P = -1.08),
// revealing -0.9117 vs -0.7949 strictly AFTER dec-length-scores.
import {
  COSMOS,
  glowTex,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  buildLengthSurface3d,
  cinemaAtmosphere,
  decodeLengthScore,
  fmt,
  lumBar,
  playCue,
} from '../parts.mjs';

export default function lengthObjective(s, c) {
  const title = heroTitle(['Length normalization', 'changes the objective'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.active,
  });

  const view3d = buildLengthSurface3d({ x: 470, y: 15, unit: 80 });

  const showDenom = s.value(0);
  const showNorm = s.value(0);
  const showAlphaNote = s.value(0);
  const stageVis = s.value(1);

  const sDen = Math.pow((5 + 2) / 6, 0.6);
  const lDen = Math.pow((5 + 5) / 6, 0.6);
  const sNorm = decodeLengthScore(-1.0, 2, 0.6);
  const lNorm = decodeLengthScore(-1.08, 5, 0.6);

  const leftLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const denVis = showDenom.value;
    const normReady = showNorm.value > 0.4;
    const aNote = showAlphaNote.value;

    // Right 3D surface caption cleanly above the orbiting surface
    nodes.push(
      txt('GNMT divisor ((5 + L) / 6)^α', 470, -340, 30, ROLE.active, 'mono', 'center')
        .glow(6, ROLE.active)
        .opacity(alpha),
      txt('L = 1..8   ·   α = 0..1', 470, 370, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    // Left comparison rows: Completed S vs Completed L
    const rows = [
      { id: 'S', len: 2, raw: -1.0, den: sDen, norm: sNorm, y: -155, col: ROLE.base, wins: false },
      { id: 'L', len: 5, raw: -1.08, den: lDen, norm: lNorm, y: 65, col: ROLE.valid, wins: true },
    ];

    rows.forEach((r) => {
      const col = normReady && r.wins ? ROLE.winner : r.col;
      nodes.push(
        txt(`Candidate ${r.id}  (len ${r.len})`, -845, r.y - 60, 30, col, 'mono', 'left').opacity(
          alpha,
        ),
        // Raw score bar (magnitude of negative log-prob)
        lumBar(-645, r.y, 400, 62, {
          color: r.col,
          fillOpacity: 0.24,
          strokeWidth: 2.2,
          glow: 7,
          radius: 10,
          opacity: alpha,
        }),
        txt(`log P = ${fmt(r.raw, 2)}`, -645, r.y, 30, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );

      if (denVis > 0.1) {
        nodes.push(
          lumBar(-235, r.y, 340, 62, {
            color: ROLE.active,
            fillOpacity: 0.2 * denVis,
            strokeWidth: 2.2,
            glow: 7 * denVis,
            radius: 10,
            opacity: denVis * alpha,
          }),
          txt(`÷ ${fmt(r.den, 4)}`, -235, r.y, 30, ROLE.active, 'mono', 'center').opacity(
            denVis * alpha,
          ),
        );
      }

      if (normReady) {
        nodes.push(
          txt(`→  ${fmt(r.norm, 4)}${r.wins ? '  ★' : ''}`, -845, r.y + 62, 34, col, 'mono', 'left')
            .glow(r.wins ? 9 : 3, col)
            .opacity(alpha),
        );
      } else if (denVis > 0.1) {
        nodes.push(
          txt('normalized score = ?', -845, r.y + 62, 28, COSMOS.muted, 'mono', 'left').opacity(
            denVis * alpha,
          ),
        );
      }
    });

    nodes.push(
      txt(
        normReady
          ? 'At α = 0.6, longer L wins (-0.7949 > -0.9117)'
          : 'Every added token adds log p <= 0 to raw score',
        -845,
        260,
        28,
        normReady ? ROLE.winner : COSMOS.muted,
        'serif',
        'left',
      )
        .glow(normReady ? 6 : 0, ROLE.winner)
        .opacity(alpha),
    );

    if (aNote > 0.1) {
      nodes.push(
        txt(
          'α = 0 restores raw log-prob  |  length excludes EOS',
          -845,
          325,
          26,
          ROLE.active,
          'mono',
          'left',
        ).opacity(aNote * alpha),
      );
    }

    return nodes;
  });

  const gnmtEq = glowTex('\\text{score}(Y) = \\frac{\\log P(Y)}{((5 + |Y|)/6)^{\\alpha}}', {
    x: -445,
    y: 410,
    size: 36,
    color: ROLE.winner,
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.winner), title, view3d, leftLayer);

  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.22, phi: 0.94, distance: 14.8 },
    { startOffset: 0.2, endMargin: 0.65 },
  );

  playCue(s, c, 'dec-length-objective-1', (d) => s.play(showDenom.to(0.05, { duration: d })), {
    dur: 0.4,
  });
  c.show('dec-length-objective-2', gnmtEq);
  playCue(s, c, 'dec-length-objective-2', (d) => s.play(showDenom.to(1, { duration: d })), {
    dur: 0.7,
  });
  playCue(s, c, 'dec-length-scores', (d) => s.play(showNorm.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'dec-length-objective-3', (d) => s.play(showAlphaNote.to(1, { duration: d })), {
    dur: 0.6,
  });
}
