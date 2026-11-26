// Scene 1: intro: "What does the first word decide?"
// View 1 (Beats 0-1): "The dog ___ ___" sentence constellation + 60/40 probability strip.
//   Lifts "ran" into the first blank on intro-commit, drops "slept" on intro-drop.
// View 2 (Beat 2): Reopens both branches as a glowing probability tree with "home 0.70"
//   and "soundly 0.90", withholding the product comparison for the next scene.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  BRANCHES,
  ROLE,
  cinemaAtmosphere,
  glowDogTree,
  lumBar,
  playCue,
  swapVis,
} from '../parts.mjs';

export default function intro(s, c) {
  const title = heroTitle(['What does the', 'first word decide?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.active,
  });

  const vStrip = s.value(1);
  const vTree = s.value(0);

  // View 1 animated state
  const hiRan = s.value(0);
  const hiSlept = s.value(0);
  const commit = s.value(0); // 0 -> 1 lifts "ran" into slot 1
  const dropSlept = s.value(0); // 0 -> 1 fades "slept" out

  // View 2 animated state
  const showHome = s.value(0);
  const showSoundly = s.value(0);
  const askPair = s.value(0);

  const stripLayer = guardedDynamic(vStrip, (alpha) => {
    const nodes = [];
    const rHi = hiRan.value;
    const sHi = hiSlept.value;
    const lift = commit.value;
    const drop = dropSlept.value;

    // Sentence constellation: "The dog"  [blank 1]  [blank 2]
    const sentY = -140;
    const slot1X = 70;
    const slot2X = 460;
    nodes.push(
      txt('The dog', -230, sentY, 82, COSMOS.ink, 'serif', 'right').opacity(alpha),
      line([slot1X - 145, sentY + 68], [slot1X + 145, sentY + 68], {
        stroke: lift > 0.5 ? ROLE.winner : ROLE.active,
        width: 4.5,
      })
        .glow(8, lift > 0.5 ? ROLE.winner : ROLE.active)
        .opacity(alpha),
      line([slot2X - 145, sentY + 68], [slot2X + 145, sentY + 68], {
        stroke: COSMOS.dim,
        width: 3.2,
      }).opacity(alpha),
      txt('token 1', slot1X, sentY + 112, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('token 2', slot2X, sentY + 112, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    // Probability strip below: ran 60% | slept 40%
    const stripL = -680;
    const stripW = 1360;
    const stripY = 225;
    const stripH = 88;
    const ranW = stripW * BRANCHES[0].p;
    const sleptW = stripW * BRANCHES[1].p;
    const ranCx = stripL + ranW / 2;
    const sleptCx = stripL + ranW + sleptW / 2;

    nodes.push(
      txt('First-word probability', stripL, stripY - 126, 28, COSMOS.muted, 'mono', 'left').opacity(
        alpha,
      ),
      lumBar(ranCx, stripY, ranW - 8, stripH, {
        color: lift > 0.5 ? ROLE.winner : ROLE.base,
        fillOpacity: 0.36 + 0.16 * rHi,
        strokeWidth: 2.6 + rHi,
        glow: 10 + 4 * rHi,
        radius: 10,
        opacity: alpha,
      }),
      txt('60%', ranCx, stripY, 44, COSMOS.ink, 'mono', 'center').opacity(alpha),
    );

    // Strip label "ran" stays cleanly above strip; committed "ran" glows in slot 1 (zero overlap in motion!)
    const stripRanAlpha = (1 - 0.55 * lift) * alpha;
    nodes.push(
      txt('ran', ranCx, stripY - 94, 48, lift > 0.4 ? ROLE.winner : ROLE.base, 'serif', 'center')
        .glow(5, ROLE.base)
        .opacity(stripRanAlpha),
    );
    if (lift > 0.08) {
      nodes.push(
        txt('ran', slot1X, sentY, 76, ROLE.winner, 'serif', 'center')
          .glow(10, ROLE.winner)
          .opacity(lift * alpha),
      );
    }

    // "slept" slice fades cleanly on intro-drop
    const sleptAlpha = (1 - 0.84 * drop) * alpha;
    if (sleptAlpha > 0.04) {
      nodes.push(
        lumBar(sleptCx, stripY, sleptW - 8, stripH, {
          color: drop > 0.4 ? ROLE.pruned : ROLE.valid,
          fillOpacity: 0.34 + 0.14 * sHi,
          strokeWidth: 2.4 + sHi,
          glow: drop > 0.4 ? 3 : 10,
          radius: 10,
          opacity: sleptAlpha,
        }),
        txt('40%', sleptCx, stripY, 44, COSMOS.ink, 'mono', 'center').opacity(sleptAlpha),
        txt(
          'slept',
          sleptCx,
          stripY - 94,
          48,
          drop > 0.4 ? ROLE.pruned : ROLE.valid,
          'serif',
          'center',
        ).opacity(sleptAlpha),
      );
    }

    if (drop > 0.5) {
      nodes.push(
        txt(
          'Greedy decoding: commit to the step-1 argmax (ran)',
          0,
          385,
          32,
          ROLE.winner,
          'serif',
          'center',
        )
          .glow(6, ROLE.winner)
          .opacity(drop * alpha),
      );
    } else if (sHi > 0.2) {
      nodes.push(
        glowingTrail(
          [
            [stripL + ranW + 8, stripY + 62],
            [stripL + stripW - 8, stripY + 62],
          ],
          { color: ROLE.valid, width: 4, glow: 8, opacity: sHi * alpha },
        ),
        txt(
          'If you take the likelier word, which endings disappear?',
          0,
          385,
          32,
          ROLE.active,
          'serif',
          'center',
        ).opacity(sHi * alpha),
      );
    } else if (rHi > 0.2) {
      nodes.push(
        glowDot(ranCx, stripY + 62, {
          radius: 7,
          color: ROLE.base,
          glow: 12,
          opacity: rHi * alpha,
        }),
      );
    }

    return nodes;
  });

  const treeLayer = guardedDynamic(vTree, (alpha) => {
    const expanded = [];
    if (showHome.value > 0.4) expanded.push(1);
    if (showSoundly.value > 0.4) expanded.push(3);
    return [
      glowDogTree({
        values: [0.3, 0.7, 0, 0.9, 0.1],
        expanded,
        scores: [],
        cover: true,
        note:
          askPair.value > 0.4
            ? 'Which pair is more likely: ran home or slept soundly?'
            : 'Look one word further before committing.',
        noteColor: askPair.value > 0.4 ? ROLE.winner : COSMOS.muted,
        alpha,
      }),
    ];
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.winner), title, stripLayer, treeLayer);

  // Beat 0: highlight ran (60%) then slept (40%)
  playCue(s, c, 'intro-ran', (d) => s.play(hiRan.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'intro-slept', (d) => s.play(hiSlept.to(1, { duration: d })), { dur: 0.65 });

  // Beat 1: lift ran into blank, drop slept
  playCue(s, c, 'intro-commit', (d) => s.play(commit.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'intro-drop', (d) => s.play(dropSlept.to(1, { duration: d })), {
    after: true,
    dur: 0.65,
  });

  // Beat 2: swap to two-word lookahead tree (withholding products!)
  c.onBeat(2, () => s.play(swapVis(vStrip, vTree, 0.55)));
  playCue(s, c, 'intro-home', (d) => s.play(showHome.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'intro-soundly', (d) => s.play(showSoundly.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'intro-pair', (d) => s.play(askPair.to(1, { duration: d })), { dur: 0.5 });
}
