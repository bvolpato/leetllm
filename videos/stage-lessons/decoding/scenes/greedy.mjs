// Scene 3: greedy: "Make one commitment at a time"
// Commits to ran (0.60), dims/prunes the slept branch (losing 0.360), highlights the
// 0.35 tie between home and outside, then reveals "The dog ran home" AFTER greedy-pick.
import { guardedDynamic, heroTitle } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, glowDogTree, playCue } from '../parts.mjs';

export default function greedy(s, c) {
  const title = heroTitle(['Make one commitment', 'at a time'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.pruned,
  });

  const committed = s.value(0);
  const tied = s.value(0);
  const picked = s.value(0);
  const stageVis = s.value(1);

  const treeLayer = guardedDynamic(stageVis, (alpha) => {
    const isCom = committed.value > 0.4;
    const isTie = tied.value > 0.4;
    const isPick = picked.value > 0.4;

    const expanded = isCom ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4];
    const pruned = isCom ? [1] : [];
    const kept = isCom ? [0] : [];
    const selected = isPick ? [1] : isTie ? [1, 2] : [];

    let note = 'Compare 0.60 (ran) vs 0.40 (slept) at step 1.';
    let noteColor = ROLE.muted;
    if (isPick) {
      note = 'Greedy outputs: "The dog ran home" (0.210)  |  slept soundly (0.360) was pruned';
      noteColor = ROLE.winner;
    } else if (isTie) {
      note =
        'home (0.35) and outside (0.35) tie  |  vocab order lists home first. Which sentence comes out?';
      noteColor = ROLE.active;
    } else if (isCom) {
      note = 'Committed to "The dog ran ..."  |  slept branch closed';
      noteColor = ROLE.pruned;
    }

    return [
      glowDogTree({
        values: [0.3, 0.35, 0.35, 0.9, 0.1],
        expanded,
        scores: isCom ? [0, 1, 2] : [0, 1, 2, 3, 4],
        pruned,
        kept,
        selected,
        note,
        noteColor,
        alpha,
      }),
    ];
  });

  s.add(cinemaAtmosphere(ROLE.base, ROLE.pruned), title, treeLayer);

  playCue(s, c, 'greedy-commit', (d) => s.play(committed.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  playCue(s, c, 'greedy-tie', (d) => s.play(tied.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  playCue(s, c, 'greedy-pick', (d) => s.play(picked.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
}
