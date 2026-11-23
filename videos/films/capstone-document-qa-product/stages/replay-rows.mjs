const rows = [
  {
    id: 'required_policy_answer',
    status: 'grounded',
    review: 'entailed',
    receipt: 'answer-support-required-v1',
    recall: '1 / 1',
  },
  {
    id: 'missing_admin_policy',
    status: 'abstain',
    review: 'unknown',
    receipt: 'answer-support-admin-v1',
    recall: 'null',
  },
  {
    id: 'private_note_injection',
    status: 'abstain',
    review: 'unknown',
    receipt: 'null',
    recall: 'null',
  },
];

export function drawReplayRows(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = (id) => focus.progress(id, 0);
  focus.target('replay-rows-mechanism', () => {
    if (state.beat !== 2) {
      const recall = state.beat === 1;
      const columns = [112, 709, 1054, 1380];
      const headings = recall
        ? ['Fixture ID', 'Expected docs', 'Found at 1', 'Recall at 1']
        : ['Fixture ID', 'Status', 'Label', 'Review receipt'];
      headings.forEach((v, i) => api.text(ctx, v, columns[i], 314, 30, C.muted));
      api.line(ctx, 112, 365, 1810, 365, C.blue, 3);
      rows.forEach((row, i) => {
        const y = 465 + i * 150;
        const visible = recall || p(i ? 'row-safety' : 'row-useful') > 0;
        if (!visible) return;
        api.text(ctx, row.id, columns[0], y, 32, C.blue, 'left', 'mono');
        if (!recall) {
          api.text(ctx, row.status, columns[1], y, 36, C.ink);
          api.text(ctx, row.review, columns[2], y, 35, C.ink);
          api.text(
            ctx,
            row.receipt,
            columns[3],
            y,
            23,
            row.receipt === 'null' ? C.muted : C.ink,
            'left',
            'mono',
          );
        } else {
          api.text(ctx, i ? '0' : '1', columns[1], y, 42, C.ink);
          api.text(ctx, i ? 'n/a' : '1', columns[2], y, 42, C.ink);
          if (p(i ? 'row-null' : 'row-one-denominator') === 1)
            api.text(ctx, row.recall, columns[3], y, 42, i ? C.yellow : C.green);
        }
      });
      if (recall || p('row-lineage') > 0)
        api.text(
          ctx,
          recall
            ? 'The refusal rows still have answer and citation checks.'
            : 'Each row keeps the question, answer, citations, source snapshot, run and grader.',
          112,
          930,
          35,
          C.ink,
        );
      return;
    }
    const imported = p('row-replace') === 1 ? [rows[0], rows[1], rows[0]] : rows;
    const counts = rows.map((row) => imported.filter((item) => item.id === row.id).length);
    api.text(ctx, 'Coverage of the imported run', 112, 283, 32, C.muted);
    api.text(ctx, 'Expected once per fixture', 112, 391, 30, C.muted);
    api.text(ctx, 'Copies in import', 865, 391, 30, C.muted);
    rows.forEach((row, i) => {
      const y = 490 + i * 115;
      api.text(ctx, row.id, 112, y, 36, C.blue, 'left', 'mono');
      api.text(ctx, String(counts[i]), 910, y, 46, counts[i] === 1 ? C.ink : C.yellow);
      if (p('row-missing') === 1)
        api.text(
          ctx,
          ['Duplicate', 'Present', 'Missing'][i],
          1260,
          y,
          37,
          counts[i] === 1 ? C.ink : C.pink,
        );
    });
    if (p('row-missing') === 1) {
      api.line(ctx, 112, 796, 1808, 796, C.pink, 4);
      const message =
        p('row-fabricated') > 0
          ? 'Fabricated receipt   →   support check fails'
          : p('row-unsafe') > 0
            ? 'Action advice in an abstention   →   content check fails'
            : p('row-typed') > 0
              ? 'Imported 1   ≠   expected Boolean true'
              : 'Coverage failed   /   block this run';
      api.text(ctx, message, 112, 910, 42, C.ink);
    }
  });
}

export default {
  id: 'replay-rows',
  draw: drawReplayRows,
  cues: [
    'row-evidence',
    'row-useful',
    'row-safety',
    'row-lineage',
    'recall-denominator',
    'row-one-denominator',
    'row-null',
    'row-mutations',
    'row-replace',
    'row-missing',
    'row-typed',
    'row-unsafe',
    'row-fabricated',
  ],
};
