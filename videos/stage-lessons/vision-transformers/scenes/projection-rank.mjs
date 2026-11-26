// Scene 06: projection-rank: Null direction [+1, 0, -1, 0] keeps [2.5, 1.0] unchanged vs across-column move dropping contrast to 0!
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
  visionProject,
} from '../parts.mjs';

export default function projectionRank(s, c) {
  const trial = s.value(0); // 0=within-column edit [1,1,3,5], 1=across-column edit [1,0,4,5]
  const revealNull = s.value(0); // strictly withheld until AFTER `rank-equal`!
  const revealContrast = s.value(0); // strictly withheld until AFTER `rank-contrast`!

  const bgAura = aura(0, 0, 740, '#123a5e28', '#3c1a3618');
  const title = heroTitle(['Projection Rank:', 'what a linear map erases'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.pos,
  });

  const refPatch = [0, 1, 4, 5];
  const editNull = [1, 1, 3, 5]; // +1 top-left, -1 bottom-left -> same column sums (4, 6)
  const editAcross = [1, 0, 4, 5]; // +1 top-left, -1 top-right -> column sums (5, 5)
  const refOut = visionProject(refPatch);

  const draw2x2 = (vals, cx, cy, col, alpha) => {
    const items = [];
    const offsets = [
      [-64, -64],
      [64, -64],
      [-64, 64],
      [64, 64],
    ];
    vals.forEach((v, i) => {
      items.push(
        rect(112, 112, { fill: '#111b33', stroke: col, width: 2.8, radius: 10 })
          .at(cx + offsets[i][0], cy + offsets[i][1])
          .glow(7, col)
          .opacity(alpha),
        txt(
          String(v),
          cx + offsets[i][0],
          cy + offsets[i][1],
          40,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });
    return items;
  };

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const isAcross = trial.value > 0.5;
    const rn = revealNull.value;
    const rc = revealContrast.value;
    const curEdit = isAcross ? editAcross : editNull;
    const curOut = visionProject(curEdit);
    const solved = isAcross ? rc > 0.5 : rn > 0.5;
    const nodes = [
      txt('REFERENCE PATCH', -520, -225, 28, ROLE.patch, 'mono', 'center').opacity(alpha),
      ...draw2x2(refPatch, -520, -45, ROLE.patch, alpha),
      txt(
        `Col sums: 4, 6  →  Token [${refOut[0].toFixed(1)}, ${refOut[1].toFixed(1)}]`,
        -520,
        130,
        30,
        ROLE.patch,
        'mono',
        'center',
      ).opacity(alpha),

      txt(
        isAcross ? 'EDITED (ACROSS COLUMNS)' : 'EDITED (UP LEFT COLUMN)',
        360,
        -225,
        28,
        ROLE.pos,
        'mono',
        'center',
      ).opacity(alpha),
      ...draw2x2(curEdit, 360, -45, ROLE.pos, alpha),
      txt(
        solved
          ? `Col sums: ${curEdit[0] + curEdit[2]}, ${curEdit[1] + curEdit[3]}  →  Token [${curOut[0].toFixed(1)}, ${curOut[1].toFixed(1)}]`
          : 'Token = [ ? , ? ]',
        360,
        130,
        30,
        solved ? ROLE.ok : ROLE.pos,
        'mono',
        'center',
      )
        .glow(8, solved ? ROLE.ok : ROLE.pos)
        .opacity(alpha),
    ];

    if (!isAcross && rn < 0.2) {
      nodes.push(
        txt(
          'Does mean change, contrast, both, or neither?',
          0,
          290,
          36,
          ROLE.pos,
          'serif',
          'center',
        )
          .glow(8, ROLE.pos)
          .opacity((1 - rn * 5) * alpha),
      );
    } else if (!isAcross && rn >= 0.2) {
      nodes.push(
        txt(
          'Neither moves! [+1, 0, −1, 0] is a null direction erased by E',
          0,
          290,
          32,
          ROLE.ok,
          'mono',
          'center',
        )
          .glow(8, ROLE.ok)
          .opacity(rn * alpha),
      );
    } else if (isAcross && rc < 0.2) {
      nodes.push(
        txt(
          'Move 1 unit from top-right to top-left: which output changes now?',
          0,
          290,
          34,
          ROLE.pos,
          'serif',
          'center',
        )
          .glow(8, ROLE.pos)
          .opacity((1 - rc * 5) * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Contrast drops 1.0 → 0.0 (mean stays 2.5); full rank is required to preserve all pixel deltas',
          0,
          290,
          28,
          ROLE.ok,
          'mono',
          'center',
        )
          .glow(8, ROLE.ok)
          .opacity(rc * alpha),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  // Strictly withhold both answers!
  playCue(s, c, 'rank-equal', (d) => s.play(revealNull.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'rank-across', (d) => s.play(trial.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'rank-contrast', (d) => s.play(revealContrast.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  bindCueBeat(s, c, s.value(0), ['rank-within']);
}
