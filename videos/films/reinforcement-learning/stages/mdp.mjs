import { mdpSnapshot } from '../model.mjs';
import {
  flow,
  line,
  optionalFocusTarget,
  rectangle,
  retainedEquation,
  retainedText,
  text,
} from '../defaults.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  {
    const current = mdpSnapshot(currentBeat, progress);
    if (currentBeat === 2) {
      const receipt = current.receipt;
      retainedText(
        ctx,
        api,
        'Supplied teaching transition · request REQ-10234 · event E17',
        960,
        280,
        30,
        themeColors.muted,
        'center',
      );
      const nodes = [
        {
          id: 'before',
          label: 'Input state: new request\nElapsed wait 45 s',
          x: 180,
          y: 345,
          width: 500,
          height: 120,
          color: themeColors.blue,
        },
        {
          id: 'agent',
          label: current.actionProgress
            ? 'Router chooses\nask evidence'
            : 'Router · action pending',
          x: 180,
          y: 555,
          width: 500,
          height: 120,
          color: themeColors.yellow,
        },
        {
          focusTarget: 'mdp-node-environment',
          id: 'environment',
          label: 'Environment\nrequester + verification',
          x: 1110,
          y: 405,
          width: 610,
          height: 150,
          color: themeColors.cyan,
        },
        {
          focusTarget: 'mdp-node-receipt',
          id: 'receipt',
          label: receipt
            ? 'E17 · evidence received\nNext state: evidence ready · reward −4'
            : 'Observation + reward\nAwaiting environment event',
          x: 1060,
          y: 705,
          width: 710,
          height: 145,
          color: receipt ? themeColors.green : themeColors.muted,
        },
        {
          id: 'observed',
          label: `Router observes: ${current.current.stage}\nElapsed wait ${current.current.elapsedWait} s`,
          x: 180,
          y: 785,
          width: 650,
          height: 140,
          color: current.observed ? themeColors.green : themeColors.blue,
        },
      ];
      const shapes = Object.fromEntries(
        nodes.map((node) => [
          node.id,
          api.components.card({
            ...node,
            stroke: node.color,
            fill: themeColors.panel,
            textColor: themeColors.ink,
            fontSize: 29,
            baselineOffset: -16,
            padding: 14,
          }),
        ]),
      );
      const edges = [
        {
          from: 'before',
          to: 'agent',
          progress: current.actionProgress,
          color: themeColors.blue,
        },
        {
          from: 'agent',
          to: 'environment',
          progress: current.actionProgress,
          color: themeColors.yellow,
        },
        {
          from: 'environment',
          to: 'receipt',
          progress: current.environmentReady ? 1 : 0,
          color: themeColors.cyan,
        },
        {
          from: 'receipt',
          to: 'observed',
          progress: current.returnProgress,
          color: themeColors.green,
        },
      ];
      for (const edge of edges)
        api.teaching.transfer({
          source: {
            shape: shapes[edge.from],
            opacity: 1,
          },
          target: {
            shape: shapes[edge.to],
            opacity: 1,
          },
          progress: edge.progress,
          color: edge.progress > 0 ? edge.color : themeColors.muted,
          particle: {
            radius: 7,
            fill: edge.color,
          },
          margin: 4,
        });
      retainedText(
        ctx,
        api,
        current.observed
          ? 'Observed wait: 45 + 20 = 65 s · reward −4 belongs to the ask action'
          : 'The router chooses an action; the environment supplies the next observation and reward.',
        960,
        995,
        28,
        current.observed ? themeColors.green : themeColors.ink,
        'center',
      );
      return;
    }
    const rows = [
      {
        focusTarget: 'mdp-node-start',
        id: 'start',
        label: 'new request',
        x: 190,
        y: 465,
        width: 360,
        height: 120,
        color: themeColors.yellow,
      },
      {
        id: 'evidence',
        label: 'evidence ready',
        x: 780,
        y: 315,
        width: 385,
        height: 120,
        color: themeColors.cyan,
      },
      {
        id: 'review',
        label: 'review queue',
        x: 780,
        y: 625,
        width: 385,
        height: 120,
        color: themeColors.blue,
      },
      {
        id: 'closed',
        label: 'closed',
        x: 1410,
        y: 465,
        width: 300,
        height: 120,
        color: themeColors.green,
      },
    ];
    flow(ctx, api, rows, [
      {
        from: 'start',
        to: 'evidence',
        progress: phaseForBeat(0),
        color: themeColors.cyan,
      },
      {
        from: 'start',
        to: 'review',
        progress: phaseForBeat(0),
        color: themeColors.blue,
      },
      {
        from: 'evidence',
        to: 'closed',
        progress: phaseForBeat(1),
        color: themeColors.green,
      },
      {
        from: 'review',
        to: 'closed',
        progress: phaseForBeat(1),
        color: themeColors.green,
      },
    ]);
    if (currentBeat === 0)
      retainedEquation(
        ctx,
        api,
        String.raw`(\mathcal{S},\mathcal{A},\mathcal{P},\mathcal{R},\gamma)`,
        960,
        810,
        46,
        themeColors.ink,
        'center',
      );
    else {
      retainedText(
        ctx,
        api,
        'Constructed request state',
        960,
        790,
        30,
        themeColors.muted,
        'center',
      );
      optionalFocusTarget(ctx, api, 'mdp-simulation-14', () =>
        [
          ['Request', 'REQ-10234'],
          ['Stage', 'new request'],
          ['Elapsed wait', current.fieldVisible ? `${current.elapsedWait} s` : 'add when needed'],
        ].forEach(([label, value], i) =>
          api.components.card({
            label: `${label}\n${value}`,
            x: 200 + i * 530,
            y: 825,
            width: 460,
            height: 100,
            baselineOffset: -15,
            fill: themeColors.panel,
            stroke: i === 2 && current.fieldVisible ? themeColors.yellow : themeColors.muted,
            textColor: i === 2 && current.fieldVisible ? themeColors.yellow : themeColors.ink,
            fontSize: 28,
            padding: 12,
          }),
        ),
      );
    }
    retainedText(
      ctx,
      api,
      currentBeat === 0
        ? 'State stores every fact needed to predict the next step.'
        : 'Include elapsed wait when it changes the transition probabilities.',
      960,
      995,
      29,
      themeColors.yellow,
      'center',
    );
  }
}
export function drawMdp(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const custom = currentBeat === 3;
  if (!custom) {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  const body = () => {
    text(
      ctx,
      api,
      'Same stage label; a different elapsed wait',
      960,
      280,
      37,
      themeColors.yellow,
      'center',
    );
    [45, 65].forEach((seconds, i) => {
      const x = 490 + i * 930;
      rectangle(ctx, api, x - 260, 390, 520, 325, i ? themeColors.pink : themeColors.blue);
      text(ctx, api, 'REQ-10234 · new request', x, 455, 33, themeColors.ink, 'center');
      text(
        ctx,
        api,
        `${seconds} seconds`,
        x,
        580,
        68,
        i ? themeColors.pink : themeColors.blue,
        'center',
      );
      text(ctx, api, 'abandonment distribution', x, 675, 29, themeColors.muted, 'center');
      line(ctx, api, x, 730, x, 830, i ? themeColors.pink : themeColors.blue, 5);
    });
    text(
      ctx,
      api,
      'If wait changes the next outcome, stage alone is insufficient state',
      960,
      970,
      36,
      themeColors.yellow,
      'center',
    );
  };
  if (api.focus) api.focus.target('mdp-construction', body);
  else body();
}
export default {
  id: 'mdp',
  draw: drawMdp,
  cues: [
    'mdp-beat-1-focus-1',
    'mdp-beat-2-focus-1',
    'mdp-beat-2-focus-2',
    'mdp-beat-3-focus-1',
    'mdp-beat-3-focus-2',
    'mdp-wait-counterexample',
  ],
};
