import {
  assertEqual,
  arrow,
  boxOf,
  column,
  indicate,
  graph,
  beside,
  place,
  tokens,
} from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { probabilityStrip, updatedPolicy } from '../parts.mjs';
export default function llmPolicy(s, c) {
  const [stripArea, work, foot] = area.rows([3, 5, 1], 'loose');
  const strip = probabilityStrip(s, stripArea, updatedPolicy);
  const tokenStrip = probabilityStrip(s, stripArea, updatedPolicy, [
    'Approve',
    'Request',
    'Review',
  ]);
  const [prefixArea, rolesArea] = work.rows([1, 4], 'normal');
  const prefix = place(
    tokens(
      [
        { text: 'REQ-10234', color: 'cyan' },
        { text: '→', color: 'dim' },
      ],
      { size: 40, width: prefixArea.width - 40 },
    ),
    prefixArea,
  );
  const w = rolesArea.width,
    h = rolesArea.height;
  const roles = place(
    graph(
      [
        { id: 'actor', label: 'Actor', at: [-w * 0.35, 0], width: 240, height: 70, color: 'cyan' },
        ...[
          ['critic', 'Critic', 'dim'],
          ['reward', 'Reward model', 'dim'],
          ['rollout', 'Rollout policy', 'dim'],
          ['reference', 'Frozen reference', 'dim'],
        ].map(([id, label, color], i) => ({
          id,
          label,
          color,
          at: [0, (h * (i - 1.5)) / 4],
          width: 300,
          height: 66,
        })),
      ],
      ['critic', 'reward', 'rollout', 'reference'].map((to) => ({ from: 'actor', to })),
      {
        layout: 'manual',
        labelSize: 34,
        edgeColor: 'dim',
      },
    ),
    rolesArea,
  );
  const branchNotes = ['Prefix value', 'Completion score', 'PPO denominator', 'Reference KL'].map(
    (words, i) =>
      beside(
        note(words, { color: 'dim' }),
        roles.node(['critic', 'reward', 'rollout', 'reference'][i]),
        'right',
        'wide',
      ),
  );
  const groupPrompt = place(
    label('REQ-10234: Route this access request.', { color: 'cyan' }),
    prefixArea,
  );
  const completionRows = rolesArea.rows(3, 'tight');
  const texts = [
    ['Approve', 'access', '.'],
    ['Request', 'evidence', '.'],
    ['Review', 'this', 'request'],
  ];
  const epsilon = 1e-6;
  function normalizeRewards(rewards) {
    const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
    const sd = Math.sqrt(rewards.reduce((a, b) => a + (b - mean) ** 2, 0) / rewards.length);
    return rewards.map((reward) => (reward - mean) / (sd + epsilon));
  }
  const rewards = [0, 1, 2];
  const relative = normalizeRewards(rewards);
  const tied = rewards.map(() => 1);
  const tiedScores = normalizeRewards(tied);
  assertEqual(relative.map((x) => x.toFixed(3)).join(','), '-1.225,0.000,1.225', 'group scores');
  assertEqual(tiedScores.join(','), '0,0,0', 'equal rewards');
  const completionColors = ['pink', 'green', 'blue'];
  const sequences = [],
    badges = [],
    relativeBadges = [],
    tiedInputs = [],
    equalBadges = [];
  for (let i = 0; i < texts.length; i++) {
    const [sequenceArea, badgeArea] = completionRows[i].columns([3, 2], 'loose');
    sequences.push(
      place(
        tokens(
          texts[i].map((text) => ({ text, color: completionColors[i] })),
          {
            size: 34,
            rowSize: 29,
            minWidth: 175,
            rows: { score: [null, null, null] },
          },
        ),
        sequenceArea,
      ),
    );
    badges.push(place(mono('Reward = ' + rewards[i], { color: completionColors[i] }), badgeArea));
    relativeBadges.push(
      place(
        column(
          [
            note('Reward = ' + rewards[i], { color: completionColors[i] }),
            mono('Score = ' + relative[i].toFixed(3), {
              color: completionColors[i],
            }),
          ],
          { gap: 'tight' },
        ),
        badgeArea,
      ),
    );
    tiedInputs.push(place(mono('Reward = ' + tied[i]), badgeArea));
    equalBadges.push(
      place(
        column([note('Reward = ' + tied[i]), mono('Score = ' + tiedScores[i])], { gap: 'tight' }),
        badgeArea,
      ),
    );
  }
  const badgeLinks = sequences.map((sequence, i) => {
    const a = boxOf(sequence),
      b = boxOf(relativeBadges[i]);
    return arrow([b.left - 24, a.cy], [a.right + 20, a.cy], { stroke: completionColors[i] });
  });
  const [equationArea, constantsArea] = stripArea.rows(2, 'normal');
  const rule = place(mono('Score = (reward − group mean) / (group SD + ε)'), equationArea);
  const groupNodes = [rule, ...sequences];
  const cost = place(
    note('Actor generates. Critic estimates. Reference stays frozen. Reward scores.'),
    foot,
  );
  const [clipSetup, ratioCell, scoreCell] = foot.columns([2, 1, 1], 'normal');
  const advantage = 1;
  const upperClip = 1.2;
  const ratio = 1.4;
  const clippedScore = Math.min(ratio, upperClip) * advantage;
  assertEqual(clippedScore, 1.2, 'positive advantage above the upper clip');
  const clip = place(
    mono(`Advantage +${advantage}   Upper clip ${upperClip}`, { size: 36 }),
    clipSetup,
  );
  const raised = place(mono('Ratio ' + ratio, { color: 'yellow' }), ratioCell);
  const score = place(mono('Score ' + clippedScore, { color: 'green' }), scoreCell);
  const normalize = place(
    mono('Mean = 1    SD = √(2/3)    ε = 0.000001', { color: 'yellow' }),
    constantsArea,
  );
  const equal = place(note('Equal rewards: reward signal = 0. The KL term can still act.'), foot);
  const ask = place(label('What normalized score reaches each token?', { color: 'yellow' }), foot);
  const tiedRule = place(mono('Group mean = 1    SD = 0    ε = 0.000001'), constantsArea);
  s.add(heading(c.title), prefix, roles, branchNotes, cost);
  c.take(strip.nodes);
  c.swap('tokens', strip.nodes, tokenStrip.nodes);
  c.on('append', () =>
    s.play(
      prefix.append(
        { text: 'Request', color: 'green' },
        {
          from: [tokenStrip.bar.region({ label: 'Request' }).cx, prefixArea.top + 40],
          duration: 1.1,
        },
      ),
    ),
  );
  c.on('actor', () => s.play(indicate(roles.node('actor'), { scale: 1 })));
  c.on('critic', () =>
    s.play(roles.pulseEdge('actor', 'critic', { color: 'yellow', duration: 0.8 })),
  );
  c.on('reference', () =>
    s.play(roles.pulseEdge('actor', 'reference', { color: 'yellow', duration: 0.8 })),
  );
  c.on('reward', () =>
    s.play(roles.pulseEdge('actor', 'reward', { color: 'yellow', duration: 0.8 })),
  );
  c.on('old-policy', () =>
    s.play(
      indicate([roles.node('rollout'), branchNotes[2]], { scale: 1, color: 'yellow' }),
      indicate([roles.node('reference'), branchNotes[3]], { scale: 1, color: 'yellow' }),
    ),
  );
  c.swap('clip-limit', cost, clip, { after: true });
  c.show('clip-ratio', raised, { after: true });
  c.show('clip-score', score, { after: true });
  c.swap(
    'group',
    [tokenStrip.nodes, roles, ...branchNotes, prefix, clip, raised, score],
    [...groupNodes, groupPrompt],
  );
  for (const [i, cue] of ['reward-approve', 'reward-proof', 'reward-review'].entries()) {
    c.show(cue, badges[i], { after: true });
  }
  c.show('normalize', normalize, { after: true });
  c.swap('relative', badges, relativeBadges, { after: true });
  c.show('token-score', badgeLinks);
  c.on(
    'token-score',
    () =>
      s.play(
        ...sequences.flatMap((sequence, i) =>
          texts[i].map((_, j) =>
            sequence.setValue('score', j, relative[i].toFixed(3), {
              duration: 0.65,
            }),
          ),
        ),
      ),
    0.65,
  );
  c.swap('equal-input', [relativeBadges, normalize, badgeLinks], [tiedInputs, tiedRule], {
    after: true,
  });
  c.after('equal-input', () =>
    s.play(
      ...sequences.flatMap((sequence, i) =>
        texts[i].map((_, j) => sequence.setValue('score', j, null, { duration: 0.15 })),
      ),
    ),
  );
  c.show('equal-question', ask);
  c.after('equal', () =>
    s.play(
      ...sequences.flatMap((sequence, i) =>
        texts[i].map((_, j) =>
          sequence.setValue('score', j, String(tiedScores[i]), { duration: 0.5 }),
        ),
      ),
    ),
  );
  c.swap('equal', tiedInputs, [equalBadges, badgeLinks], { after: true });
  c.swap('equal', ask, equal, { after: true });
  c.on('limits', () => s.play(indicate(sequences, { scale: 1 })));
}
