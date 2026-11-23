import { namedSystemCue, spokenResult, systemExtensionFrame } from '../construction.mjs';
import { card, text } from '../defaults.mjs';

function verdict(ctx, api, label, y) {
  const color =
    label === 'Predict' ? api.C.muted : /^(pass|accept)/.test(label) ? api.C.green : api.C.pink;
  card(ctx, api, label, 1340, y, 420, color, 83, 37);
}

export function drawFreshBoundary(ctx, scene, state, api) {
  const { C, focus } = api;
  const m = systemExtensionFrame(scene.id, state);
  const { prefill } = m.measured;
  const repaired = m.repairReady && m.repairInputs;
  text(
    ctx,
    api,
    'R-205   /   New request   /   Authorized caller with quota',
    150,
    237,
    37,
    C.cyan,
  );

  if (m.repairInputs && !m.repairReady)
    text(ctx, api, 'Previous decisions · rechecking', 1760, 244, 27, C.yellow, 'right');
  focus.target('fresh-capacity', () => {
    text(ctx, api, 'Admit the request?', 150, 326, 43, C.ink);
    text(ctx, api, '25,000 tokens  ÷  125,000 tokens/s', 150, 384, 32, C.ink);
    text(ctx, api, '63 / 64 slots occupied', 828, 337, 30, C.ink);
    text(ctx, api, '16 blocks free · 16 needed', 828, 389, 30, C.ink);
    const x = (seconds) => 150 + seconds * 1700;
    const y = 423,
      limit = x(prefill.waitBudgetSeconds);
    api.line(ctx, x(0), y, x(0.37), y, C.muted, 3);
    if (m.capacityReady) api.rect(ctx, x(0), y - 12, x(m.queue) - x(0), 13, C.blue, undefined, 2);
    api.line(ctx, limit, y - 19, limit, y + 15, C.yellow, 4);
    text(ctx, api, '250 ms limit', limit, y + 43, 27, C.yellow, 'center');
    verdict(ctx, api, m.capacityReady ? 'accept · ' + m.queue + ' s' : 'Predict', 326);
  });
  focus.target('fresh-age', () => {
    text(ctx, api, 'Use this snapshot?', 150, 550, 43, C.ink);
    text(ctx, api, m.age + ' s / 60 s', 150, 613, 34, C.ink);
    const x = (seconds) => 562 + seconds * 7;
    const y = 585;
    api.line(ctx, x(0), y, x(90), y, C.muted, 3);
    api.line(ctx, x(60), y - 21, x(60), y + 15, C.yellow, 4);
    text(ctx, api, '60 s limit', x(60), y + 51, 27, C.yellow, 'center');
    api.circle(ctx, x(m.age), y, 11, C.blue);
    text(ctx, api, m.age + ' s', x(m.age), y - 35, 30, C.blue, 'center');
    verdict(ctx, api, m.aclReady ? (repaired && m.acl ? 'pass' : 'fail') : 'Predict', 530);
  });
  focus.target('fresh-policy', () => {
    text(ctx, api, 'Start the canary?', 150, 715, 43, C.ink);
    const pair = (n, min) => n.toFixed(2) + ' / ' + min.toFixed(2);
    const fields = [
      ['Recall / minimum', pair(m.gate.recall, m.gate.minima.recall)],
      ['Citations / minimum', pair(m.gate.faithfulness, m.gate.minima.faithfulness)],
      ['Leak count', m.leakEvidence === null ? 'missing' : 'integer ' + m.leakEvidence],
    ];
    fields.forEach(([label, value], i) => {
      const x = 150 + i * 395;
      text(ctx, api, label, x, 775, 29, C.muted);
      api.text(ctx, value, x, 824, 36, C.ink, 'left', 'mono');
    });
    verdict(
      ctx,
      api,
      m.releaseReady ? (repaired && m.release ? 'pass local checks' : 'hold') : 'Predict',
      724,
    );
  });

  if (state.beat >= 2)
    focus.target('fresh-document', () => {
      const check = namedSystemCue(state, 'fresh-doc-question', 2, 0.8);
      const stopped = spokenResult(state, 'fresh-doc-stop', 3, 0.16) && !m.financeGranted;
      api.line(ctx, 150, 874, 1760, 874, C.muted, 2);
      const x = 150 + check * 395;
      text(
        ctx,
        api,
        stopped ? 'R-205  /  Source decision' : 'May the answer cite this plan?',
        150,
        912,
        29,
        C.ink,
      );
      api.rect(ctx, x, 940, 280, 76, C.panel, C.blue, 5);
      text(ctx, api, 'finance-plan', x + 140, 989, 33, C.ink, 'center');
      api.line(ctx, 875, 917, 875, 1018, stopped ? C.pink : C.yellow, 7);
      text(
        ctx,
        api,
        stopped ? 'Excluded · finance grant missing' : 'Current group · employees',
        934,
        950,
        36,
        stopped ? C.pink : C.ink,
      );
      text(ctx, api, 'Required group · finance', 934, 999, 30, C.muted);
    });
}

export default {
  id: 'fresh-boundary',
  draw: drawFreshBoundary,
  cues: [
    'fresh-work',
    'fresh-age',
    'fresh-packet',
    'sd-fresh-capacity',
    'sd-fresh-acl',
    'sd-fresh-release',
    'sd-fresh-repair-inputs',
    'sd-fresh-repair-result',
    'fresh-doc-question',
    'fresh-doc-stop',
    'fresh-doc-receipt',
  ],
};
