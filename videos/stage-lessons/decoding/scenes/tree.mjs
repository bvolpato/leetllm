// Scene 2: tree: "Follow each pair through the fork"
// Glowing branching probability tree comparing ran home (0.420) vs slept soundly (0.360),
// then smoothly splitting home (0.70 -> 0.35 + outside 0.35) so slept soundly wins (0.360 > 0.210).
// Strict withholding: every product and winner appears strictly AFTER its spoken cue.
import { guardedDynamic, heroTitle } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, glowDogTree, playCue } from '../parts.mjs';

export default function tree(s, c) {
  const title = heroTitle(['Follow each pair', 'through the fork'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.winner,
  });

  const showHomeProd = s.value(0);
  const showSoundlyProd = s.value(0);
  const showOrigWinner = s.value(0);
  const showAllLeaves = s.value(0);
  const askSplit = s.value(0);
  const focusRan = s.value(0);
  const splitBlend = s.value(0); // 0 -> 1 moves 0.35 from home to outside
  const showSplitProds = s.value(0);
  const showSplitWinner = s.value(0);

  const stageVis = s.value(1);

  const treeLayer = guardedDynamic(stageVis, (alpha) => {
    const outsidePct = Math.round(splitBlend.value * 35);
    const homeVal = (70 - outsidePct) / 100;
    const outVal = outsidePct / 100;
    const values = [0.3, homeVal, outVal, 0.9, 0.1];

    const allOpen = showAllLeaves.value > 0.4;
    const expanded = allOpen ? (outsidePct > 0 ? [0, 1, 2, 3, 4] : [0, 1, 3, 4]) : [1, 3];

    const scores = [];
    if (allOpen) {
      if (outsidePct === 0 || showSplitProds.value > 0.4) {
        scores.push(...expanded);
      } else {
        // Keep ran-branch split products hidden until tree-final-path-product
        scores.push(0, 3, 4);
      }
    } else {
      if (showHomeProd.value > 0.4) scores.push(1);
      if (showSoundlyProd.value > 0.4) scores.push(3);
    }

    const selected = [];
    if (showSplitWinner.value > 0.4) {
      selected.push(3);
    } else if (showOrigWinner.value > 0.4 && focusRan.value < 0.3) {
      selected.push(1);
    }

    let note = 'Multiply step 1 by step 2 along each path.';
    let noteColor = ROLE.muted;
    if (showSplitWinner.value > 0.4) {
      note = 'slept soundly wins at 0.360 (both ran paths fell to 0.210)';
      noteColor = ROLE.winner;
    } else if (focusRan.value > 0.4) {
      note = 'Splitting home (0.70) into home (0.35) + outside (0.35)';
      noteColor = ROLE.active;
    } else if (askSplit.value > 0.4) {
      note = 'Share home (0.70) equally with outside. Which pair will lead?';
      noteColor = ROLE.winner;
    } else if (showOrigWinner.value > 0.4) {
      note = 'ran home leads: 0.420 > 0.360';
      noteColor = ROLE.winner;
    }

    return [
      glowDogTree({
        values,
        expanded,
        scores,
        selected,
        kept: focusRan.value > 0.4 && showSplitWinner.value < 0.4 ? [0] : [],
        note,
        noteColor,
        alpha,
      }),
    ];
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.winner), title, treeLayer);

  // Beat 0: reveal 0.42, 0.36, original winner strictly AFTER cues
  playCue(s, c, 'tree-home', (d) => s.play(showHomeProd.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'tree-soundly', (d) => s.play(showSoundlyProd.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'tree-original-winner', (d) => s.play(showOrigWinner.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });

  // Beat 1: reveal remaining endings & ask split prediction (withhold split!)
  c.onBeat(1, () => s.play(showAllLeaves.to(1, { duration: 0.5 })));
  playCue(s, c, 'tree-split-question', (d) => s.play(askSplit.to(1, { duration: d })), {
    dur: 0.5,
  });

  // Beat 2: focus ran, split 0.70 -> 0.35 + 0.35, reveal 0.210, crown slept soundly
  playCue(s, c, 'tree-b3-1', (d) => s.play(focusRan.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'tree-branch-spread', (d) => s.play(splitBlend.to(1, { duration: d })), {
    dur: 1.0,
  });
  playCue(s, c, 'tree-final-path-product', (d) => s.play(showSplitProds.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'tree-split-winner', (d) => s.play(showSplitWinner.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
}
