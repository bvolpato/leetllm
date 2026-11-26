// Scene 13: negatives - "Which caption belongs in the negative pool?"
// Pure Cinema: glowing unit-circle cosine mining ring paired with floating candidate lanes.
// Strict prediction withholding: both 0.76 captions stay neutral gold until after the spoken reveal!
import { circle, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowVector,
  guardedDynamic,
  heroTitle,
  lumBar,
  playAfter,
  playOn,
  rule,
  txt,
  verifyInvariant,
} from '../parts.mjs';

export default function negatives(s, c) {
  const candidates = [
    { caption: 'A dog sleeps', score: 0.76, matches: false, angle: Math.acos(0.76) },
    { caption: 'A hound sprints', score: 0.76, matches: true, angle: -Math.acos(0.76) },
    { caption: 'The sky is blue', score: -0.32, matches: false, angle: Math.acos(-0.32) },
  ];
  const hard = candidates.filter((x) => !x.matches).reduce((a, b) => (b.score > a.score ? b : a));
  verifyInvariant(hard.caption === 'A dog sleeps', 'highest-scoring verified non-match');

  const showEasy = s.value(0);
  const showPair = s.value(0);
  const showChoose = s.value(0);
  const showSleeper = s.value(0);
  const showSprinter = s.value(0);

  const title = heroTitle(['Which caption belongs', 'in the negative pool?'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.competitor,
  });

  const stageLayer = guardedDynamic(s.value(1), () => {
    const se = showEasy.value;
    const sp = showPair.value;
    const sc = showChoose.value;
    const sl = showSleeper.value;
    const sr = showSprinter.value;
    const nodes = [];

    // Left: Glowing cosine mining circle centered at (-465, 25)
    const cx = -465;
    const cy = 25;
    const rad = 205;
    const tip = (a) => [cx + rad * Math.cos(a), cy - rad * Math.sin(a)];

    nodes.push(
      circle(rad, { fill: '#0e162b55', stroke: '#445c8f', width: 2.6 }).at(cx, cy),
      line([cx - rad - 16, cy], [cx + rad + 16, cy], { stroke: '#2c3d64', width: 1.5 }),
      line([cx, cy - rad - 16], [cx, cy + rad + 16], { stroke: '#2c3d64', width: 1.5 }),
      // Query ray at angle 0 (cos = 1.0)
      glowVector([cx, cy], tip(0), { color: ROLE.anchor, width: 5.2, glow: 10 }),
      txt('Query: dog running (cos 1.0)', cx, cy + rad + 52, 26, ROLE.anchor, 'mono', 'center'),
      // Sky vector always visible
      line([cx, cy], tip(candidates[2].angle), { stroke: ROLE.unrelated, width: 3.6 }).glow(
        6,
        ROLE.unrelated,
      ),
      glowDot(...tip(candidates[2].angle), { radius: 8, color: ROLE.unrelated, glow: 11 }),
      txt(
        'sky (−0.32)',
        tip(candidates[2].angle)[0] - 24,
        tip(candidates[2].angle)[1] - 32,
        26,
        ROLE.unrelated,
        'mono',
        'right',
      ),
    );

    // Mined tied pair (0.76): neutral gold until individually revealed!
    if (sp > 0.05) {
      const col0 = sl > 0.3 ? ROLE.competitor : ROLE.focus;
      const col1 = sr > 0.3 ? ROLE.positive : ROLE.focus;
      const p0 = tip(candidates[0].angle);
      const p1 = tip(candidates[1].angle);
      nodes.push(
        line([cx, cy], p0, { stroke: col0, width: 4 }).glow(8, col0).opacity(sp),
        glowDot(p0[0], p0[1], { radius: 9, color: col0, glow: 12, opacity: sp }),
        txt('sleeps (0.76)', p0[0] + 24, p0[1] - 30, 26, col0, 'mono', 'left').opacity(sp),
        line([cx, cy], p1, { stroke: col1, width: 4 }).glow(8, col1).opacity(sp),
        glowDot(p1[0], p1[1], { radius: 9, color: col1, glow: 12, opacity: sp }),
        txt('sprints (0.76)', p1[0] + 24, p1[1] + 32, 26, col1, 'mono', 'left').opacity(sp),
      );
    }

    // Right: Floating candidate audit table (clean typographic columns, zero prose cards)
    nodes.push(
      rule(-40, -320, -40, 315, COSMOS.rule, 1.8).opacity(0.55),
      txt(
        'Query: "Find footage of a dog running."',
        10,
        -295,
        32,
        ROLE.anchor,
        'sans',
        'left',
      ).glow(5, ROLE.anchor),
      txt('CAPTION', 10, -215, 26, COSMOS.dim, 'mono', 'left'),
      txt('COSINE', 415, -215, 26, COSMOS.dim, 'mono', 'center'),
      txt('TRAINING ROLE', 690, -215, 26, COSMOS.dim, 'mono', 'center'),
      rule(10, -182, 855, -182, COSMOS.rule, 1.4).opacity(0.55),
    );

    const rowYs = [-105, 25, 155];
    candidates.forEach((cand, idx) => {
      const ry = rowYs[idx];
      const vis = idx === 2 ? 1 : sp;
      if (vis < 0.05) return;

      const roleShown = idx === 2 ? se : idx === 0 ? sl : sr;
      const roleCol = idx === 2 ? ROLE.unrelated : idx === 0 ? ROLE.competitor : ROLE.positive;
      const roleText = idx === 2 ? 'easy negative' : idx === 0 ? 'hard negative' : 'valid answer';

      nodes.push(
        txt(
          cand.caption,
          10,
          ry,
          34,
          roleShown > 0.3 ? roleCol : COSMOS.ink,
          'sans',
          'left',
        ).opacity(vis),
        txt(cand.score.toFixed(2), 415, ry, 34, COSMOS.muted, 'mono', 'center').opacity(vis),
      );

      if (roleShown > 0.05) {
        nodes.push(
          lumBar(690, ry, 280, 52, {
            color: roleCol,
            fillAlpha: 0.24,
            strokeWidth: 2.2,
            glow: 8,
            radius: 10,
            opacity: roleShown * vis,
          }),
          txt(roleText, 690, ry, 28, roleCol, 'mono', 'center').opacity(roleShown * vis),
        );
      } else {
        nodes.push(txt('?', 690, ry, 34, ROLE.focus, 'mono', 'center').opacity(vis));
      }
    });

    // Footer prompt / audit principle
    nodes.push(rule(-850, 325, 850, 325, COSMOS.rule, 1.6).opacity(0.55));
    if (sr > 0.05) {
      nodes.push(
        txt(
          'High cosine puts candidates on the review list; auditing the action decides who enters the negative pool.',
          0,
          388,
          28,
          ROLE.positive,
          'sans',
          'center',
        )
          .glow(5, ROLE.positive)
          .opacity(sr),
      );
    } else if (sc > 0.05) {
      nodes.push(
        txt(
          'Both score 0.76. Which high scorer can you use as a negative?',
          0,
          388,
          36,
          ROLE.focus,
          'serif',
          'center',
        )
          .glow(7, ROLE.focus)
          .opacity(sc),
      );
    } else {
      nodes.push(
        txt(
          'Easy negatives far from the query give almost zero learning signal.',
          0,
          388,
          30,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.competitor), title, stageLayer);

  playOn(s, c, 'mine-easy', (d) => showEasy.to(1, { duration: d }), 0.45);
  playOn(s, c, 'mine-pair', (d) => showPair.to(1, { duration: d }), 0.55);
  playOn(s, c, 'mine-choose', (d) => showChoose.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'mine-sleeper', (d) => showSleeper.to(1, { duration: d }), 0.45);
  playAfter(
    s,
    c,
    'mine-sprinter',
    (d) => [showChoose.to(0, { duration: d * 0.35 }), showSprinter.to(1, { duration: d })],
    0.5,
  );
}
