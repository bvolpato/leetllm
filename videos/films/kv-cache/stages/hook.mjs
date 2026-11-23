import {
  circle,
  dynamic,
  fadeIn,
  indicate,
  lagged,
  line,
  linear,
  Node,
  rect,
  text,
} from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';

/** Why is the second word so fast?. */
export function buildHook(stage, narration, { T, M, place, clearScene, fadeOut, brief }) {
  const hook = narration.scene('hook');
  sceneHeading(stage, hook, narration.title('hook'));
  const page = rect(500, 800, {
    radius: 14,
    stroke: 'gridStrong',
    width: 2.5,
    fill: 'surface',
  }).at(-600, 60);
  const lines = Array.from(
    {
      length: 21,
    },
    (_, i) =>
      rect(i % 5 === 4 ? 270 : 410 - ((i * 37) % 70), 15, {
        radius: 4,
        fill: 'faint',
        stroke: null,
      }).at(-600 - (i % 5 === 4 ? 70 : (i * 37) % 35), -270 + i * 33),
  );
  const BAR_LEFT = -300,
    WAIT_W = 860,
    BAR_Y = -170;
  const waited = stage.value(0),
    TICK = 26;
  const clock = dynamic(() => {
    const angle = (waited.value / WAIT_W) * Math.PI * 4 - Math.PI / 2;
    return new Node().add(
      circle(26, { stroke: 'yellow', width: 3 }).at(BAR_LEFT + WAIT_W - 34, BAR_Y - 74),
      line(
        [BAR_LEFT + WAIT_W - 34, BAR_Y - 74],
        [BAR_LEFT + WAIT_W - 34 + 20 * Math.cos(angle), BAR_Y - 74 + 20 * Math.sin(angle)],
        { stroke: 'yellow', width: 4 },
      ),
    );
  });
  const waitBar = dynamic(() =>
    waited.value < 1
      ? null
      : rect(waited.value, 54, {
          radius: 8,
          fill: 'yellow',
          stroke: null,
        }).moveTo([BAR_LEFT + waited.value / 2, BAR_Y]),
  );
  const waitLabel = text('Waiting for the first word', {
    size: 52,
    color: 'yellow',
  });
  waitLabel.at(BAR_LEFT + waitLabel.width / 2, BAR_Y - 74);
  const restLabel = text('The rest', {
    size: 52,
    color: 'green',
  });
  restLabel.at(BAR_LEFT + WAIT_W + 14 + restLabel.width / 2, BAR_Y - 74);
  const barTrack = rect(WAIT_W, 54, {
    radius: 8,
    fill: 'surface',
    stroke: 'dim',
    width: 2,
  }).moveTo([BAR_LEFT + WAIT_W / 2, BAR_Y]);
  const answerBox = rect(1230, 240, {
    radius: 18,
    fill: 'surface',
    stroke: 'dim',
    width: 2,
  }).moveTo([BAR_LEFT + 585, 35]);
  const WORDS = [
    'The',
    'contract',
    'renews',
    'in',
    'March',
    'unless',
    'either',
    'side',
    'gives',
    'notice.',
  ];
  const answers = WORDS.map((word) =>
    T(word, {
      size: 82,
    }),
  );
  let cursor = BAR_LEFT;
  answers.forEach((node, i) => {
    if (i === 5) cursor = BAR_LEFT;
    // at() keeps the words on one baseline. Centering each word's ink would not.
    node.at(cursor + 26 + node.width / 2, i < 5 ? -30 : 90);
    cursor += node.width + 26;
  });
  const ticks = answers.map((_, i) =>
    rect(TICK - 8, 54, {
      radius: 3,
      fill: 'green',
      stroke: null,
    }).moveTo([BAR_LEFT + WAIT_W + 22 + i * TICK, BAR_Y]),
  );
  const question = place(
    T('When does this contract renew?', {
      italic: true,
      size: 86,
    }),
    BAR_LEFT,
    -350,
  );
  hook.at(0.05, () =>
    stage.play(
      fadeIn(page, {
        shift: [-30, 0],
      }),
      fadeIn(question, {
        shift: [0, 12],
      }),
      fadeIn([barTrack, answerBox]),
      lagged(
        lines.map((node) => fadeIn(node)),
        {
          lag: 0.12,
        },
      ),
      {
        duration: 1.1,
      },
    ),
  );
  hook.on('paste', () =>
    stage.play(indicate(page, { color: 'yellow', scale: 1.02 }), { duration: 0.6 }),
  );
  hook.on('wait', () => {
    stage.play(fadeIn(waitBar), fadeIn(waitLabel), fadeIn(clock), {
      duration: 0.15,
    });
    stage.play(
      waited.to(WAIT_W, {
        duration: hook.cue('first-word').end - hook.cue('wait').start - 0.15,
        ease: linear,
      }),
    );
  });
  hook.after('first-word', () =>
    stage.play(fadeIn([answers[0], ticks[0]], { shift: [0, 8] }), { duration: 0.2 }),
  );
  hook.on('pour', () =>
    stage.play(
      fadeIn(restLabel),
      lagged(
        answers.slice(1).map((node, i) =>
          fadeIn([node, ticks[i + 1]], {
            shift: [0, 8],
          }),
        ),
        {
          lag: 0.45,
        },
      ),
      {
        duration: 2,
      },
    ),
  );
  const PROMPT_CELLS = 9;
  const cacheCells = Array.from({ length: PROMPT_CELLS + 1 }, (_, i) =>
    rect(90, 78, {
      radius: 8,
      fill: i === PROMPT_CELLS ? 'green' : 'blue',
      stroke: null,
    }).at(BAR_LEFT + 46 + i * 102, 295),
  );
  const cacheLabel = place(
    T('Prompt keys and values (schematic)', { size: 40, color: 'blue' }),
    BAR_LEFT,
    200,
  );
  const promptTag = place(M('prompt (schematic)', { size: 32, color: 'blue' }), BAR_LEFT, 355);
  const cachedNew = M(WORDS[0], { size: 34, color: 'bg' }).at(...cacheCells.at(-1).center);
  const oneNew = place(M('+ 1 new token', { size: 40, color: 'green' }), BAR_LEFT + 840, 355);
  hook.on('whole-doc', () =>
    stage.play(
      lagged(
        lines.map((node) =>
          indicate(node, {
            color: 'yellow',
            scale: 1.02,
          }),
        ),
        {
          lag: 0.06,
        },
      ),
      fadeIn([cacheLabel, promptTag, ...cacheCells.slice(0, -1)]),
      {
        duration: 1.6,
      },
    ),
  );
  hook.on('one-new', () =>
    stage.play(
      fadeIn([cacheCells.at(-1), cachedNew, oneNew]),
      indicate(ticks[1], {
        color: 'yellow',
        scale: 1.5,
      }),
      indicate(answers[0], {
        color: 'green',
        scale: 1.08,
      }),
      {
        duration: 0.9,
      },
    ),
  );
  const cacheName = place(
    T('the key value cache', {
      italic: true,
      size: 58,
      color: 'yellow',
    }),
    BAR_LEFT,
    200,
  );
  hook.on('the-cache', () =>
    stage.play(fadeOut(cacheLabel, { duration: 0.15 }), brief(fadeIn(cacheName), 0.3, 0.15), {
      duration: 0.5,
    }),
  );
  const fitFrame = rect(1230, 92, {
    radius: 14,
    fill: 'surface',
    stroke: 'dim',
    width: 2,
  }).moveTo([BAR_LEFT + 585, 458]);
  const fitName = place(
    M('one GPU', {
      size: 40,
      color: 'dim',
    }),
    BAR_LEFT + 24,
    458,
  );
  const fitChats = Array.from(
    {
      length: 8,
    },
    (_, i) =>
      rect(104, 52, {
        radius: 26,
        fill: 'teal',
        stroke: null,
      }).at(BAR_LEFT + 296 + i * 120, 458),
  );
  hook.on('fit', () =>
    stage.play(
      fadeIn([fitFrame, fitName]),
      lagged(
        fitChats.map((node) =>
          fadeIn(node, {
            scale: 0.7,
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      {
        duration: 1.6,
      },
    ),
  );
  const sizeRule = place(
    M('tokens × bytes per token', { size: 44, color: 'yellow' }),
    BAR_LEFT,
    380,
  );
  const blockFrames = [0, 1, 2].map((i) =>
    rect(4 * 102 - 12, 98, {
      radius: 12,
      stroke: 'yellow',
      width: 4,
    }).at(BAR_LEFT + 198 + i * 4 * 102, 295),
  );
  // Equal blocks keep their capacity even when the last block is partial.
  blockFrames.push(
    ...[10, 11].map((i) =>
      rect(90, 78, {
        radius: 8,
        stroke: 'blue',
        width: 2,
      }).at(BAR_LEFT + 46 + i * 102, 295),
    ),
  );
  const budget = line([BAR_LEFT + 1120, 410], [BAR_LEFT + 1120, 506], { stroke: 'red', width: 6 });
  const assumed = place(
    T('Attention first:', {
      size: 38,
      color: 'dim',
    }),
    -825,
    190,
  );
  const assumedChips = ['query', 'key', 'value'].map((name, i) =>
    chip(name, {
      w: 150,
      h: 72,
      color: ['yellow', 'blue', 'green'][i],
      size: 36,
    }).at(-750 + i * 165, 285),
  );
  hook.on('goal-size', () =>
    stage.play(
      fadeOut([oneNew, promptTag], { duration: 0.15 }),
      brief(fadeIn(sizeRule), 0.3, 0.15),
      {
        duration: 0.5,
      },
    ),
  );
  hook.on('goal-blocks', () =>
    stage.play(fadeIn(blockFrames), {
      duration: 0.5,
    }),
  );
  hook.on('goal-out', () =>
    stage.play(fadeIn(budget), indicate(fitChats.at(-1), { color: 'red', scale: 1.08 }), {
      duration: 0.5,
    }),
  );
  hook.on('assume', () =>
    stage.play(
      fadeIn(assumed),
      fadeOut([page, ...lines], { duration: 0.2 }),
      lagged(
        assumedChips.map((node) =>
          fadeIn(node, {
            scale: 0.8,
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      {
        duration: 0.9,
      },
    ),
  );
  clearScene(hook, [
    page,
    ...lines,
    barTrack,
    answerBox,
    waitBar,
    waitLabel,
    clock,
    restLabel,
    ...answers,
    ...ticks,
    cacheName,
    cacheLabel,
    question,
    ...cacheCells,
    cachedNew,
    promptTag,
    oneNew,
    sizeRule,
    fitFrame,
    fitName,
    ...fitChats,
    ...blockFrames,
    budget,
    assumed,
    ...assumedChips,
  ]);
  return {
    WORDS,
  };
}
