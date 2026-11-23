import { equipmentPassages } from '../fixtures.mjs';
import { packedEvidence } from '../model.mjs';

export function drawFreshRelease(ctx, scene, state, api) {
  const { C, focus } = api;
  const begun = (id) => (state.cues?.[id]?.progress ?? 0) > 0;
  const done = (id) => focus.progress(id, 0) === 1;
  const question = 'Can a member return a camera tonight with the battery installed?';
  api.text(ctx, question, 130, 249, 46, C.ink);

  const depth = done('depth-five') ? 5 : 4;
  const repair = focus.progress('packing-repair', 0);
  const initialBudget = 40;
  const requested = packedEvidence(depth, initialBudget);
  const budget = repair === 1 ? requested.total : initialBudget;
  const receipt = packedEvidence(depth, budget);
  const cost = 5 + 4 * depth;
  const packing = begun('try-packing');
  const reading = done('read-receipt') && receipt.complete;
  focus.target('shortlist', () => {
    if (reading) return;
    const column = packing ? 140 : 833;
    api.text(
      ctx,
      `depth ${depth} · ${receipt.included.length} of 2 required passages`,
      column,
      packing ? 315 : 442,
      packing ? 31 : 44,
      C.ink,
    );
    if (begun('cost-input'))
      api.text(
        ctx,
        `5 + 4×${depth} = ${done('cost-twenty-five') ? cost : '?'} ms`,
        packing ? 826 : column,
        packing ? 315 : 661,
        packing ? 31 : 42,
        C.blue,
      );
    if (done('cost-limit-complete'))
      api.text(
        ctx,
        `${cost} ms ≤ 30 ms`,
        packing ? 1460 : column,
        packing ? 315 : 748,
        packing ? 31 : 42,
        C.green,
      );
  });
  if (!packing) {
    focus.target('shortlist', () => {
      api.text(ctx, 'Permitted search results', 160, 344, 34, C.muted);
      equipmentPassages.forEach((p, i) => {
        const y = 426 + i * 87;
        api.text(ctx, String(p.rank), 170, y, 37, C.muted);
        api.text(ctx, p.label, 267, y, 42, p.required ? C.ink : C.muted);
      });
      const edge = 426 + (3 + focus.progress('depth-five', 0)) * 87 + 27;
      api.path(
        ctx,
        [
          { x: 136, y: 381 },
          { x: 112, y: 381 },
          { x: 112, y: edge },
          { x: 136, y: edge },
        ],
        { color: C.yellow, width: 4 },
      );
      api.text(ctx, 'Sent to the scorer', 833, 365, 34, C.yellow);
      api.text(ctx, 'Member rule + locker instructions', 833, 525, 39, C.muted);
      if (begun('choose-depth') && !done('depth-five'))
        api.text(ctx, 'Smallest depth that includes both?', 833, 659, 44, C.yellow);
    });
    return;
  }

  if (reading) {
    focus.target('packing', () => {
      const [member, locker] = receipt.packed;
      const [permission, condition] = member.text.split(' if ');
      const cited = done('answer-member');
      api.text(ctx, `1   ${member.label}`, 140, 365, 33, C.cyan);
      api.text(ctx, '“' + permission, 140, 439, 46, C.ink);
      api.text(ctx, 'if ' + condition + '”', 140, 506, 46, C.ink);
      api.text(ctx, `2   ${locker.label}`, 140, 633, 33, cited ? C.green : C.cyan);
      api.text(ctx, '“' + locker.text.split('. ').at(-1) + '”', 140, 728, 46, cited ? C.green : C.ink);
      api.text(
        ctx,
        cited
          ? 'Remove the battery before using the locker. [2]'
          : 'Which passage would you cite?',
        140,
        927,
        49,
        cited ? C.green : C.yellow,
      );
    });
    return;
  }

  const left = 409,
    unit = 28;
  const colors = [C.cyan, C.green];
  const checked = done('forty-fails');
  focus.target('packing', () => {
    api.text(
      ctx,
      '2 passage slots    /    keep whole passages    /    minimum score 5',
      140,
      383,
      34,
      C.muted,
    );
    receipt.eligible.forEach((p, i) => {
      api.text(ctx, `${p.label}   ·   score ${p.score}`, 148 + i * 817, 457, 40, colors[i]);
    });
    api.text(ctx, 'Token capacity', 140, 550, 33, C.muted);
    for (const tick of [0, 10, 20, 30, 40, 50]) {
      const x = left + tick * unit;
      api.line(ctx, x, 559, x, 574, C.muted, 2);
      api.text(ctx, String(tick), x, 545, 27, C.muted, 'center');
    }
    const edge = left + budget * unit;
    api.line(ctx, left, 567, edge, 567, C.yellow, 4);
    api.line(ctx, edge, 556, edge, 590, C.yellow, 4);
    if (repair > 0 && repair < 1) {
      const proposed = edge + (requested.total - initialBudget) * unit * repair;
      api.line(ctx, edge, 581, proposed, 581, C.blue, 3);
      api.circle(ctx, proposed, 581, 6, C.blue);
    }
    api.text(ctx, 'Requested', 140, 657, 37, C.ink);
    api.text(ctx, 'Packed', 140, 805, 37, C.ink);
    const drawSpans = (passages, y, target) => {
      let offset = 0;
      passages.forEach((p, i) => {
        const x = left + offset * unit,
          width = p.tokens * unit;
        api.rect(ctx, x + 2, y, width - 4, 83, C.panel, colors[i], 6);
        api.text(ctx, `${p.label}   ${p.tokens}`, x + width / 2, y + 54, 34, colors[i], 'center');
        offset += p.tokens;
      });
      if (target && offset < budget) {
        const x = left + offset * unit,
          width = (budget - offset) * unit;
        api.rect(ctx, x + 2, y, width - 4, 83, C.panel, C.muted, 6);
        api.text(ctx, `${budget - offset} free`, x + width / 2, y + 54, 34, C.muted, 'center');
      }
    };
    drawSpans(receipt.eligible, 600, false);
    if (checked) drawSpans(receipt.packed, 749, true);
    else api.text(ctx, 'Which complete passages fit?', left, 807, 41, C.yellow);
    if (done('forty-four')) {
      const sizes = requested.eligible.map((p) => p.tokens).join(' + ');
      api.text(ctx, `${sizes} = ${requested.total} tokens`, left, 900, 38, C.ink);
    }
    let note = 'One whitespace-delimited word counts as one token in this example.';
    if (checked) {
      note = receipt.complete
        ? `budget ${budget} · both complete spans packed`
        : `${budget} tokens do not fit both spans   ·   ${budget - receipt.used} free   ·   hold the answer`;
    }
    if (repair > 0 && repair < 1) note = 'Budget revalidation pending';
    api.text(ctx, note, 140, 973, 38, checked ? (receipt.complete ? C.green : C.yellow) : C.muted);
  });
}
export default {
  id: 'fresh-release',
  draw: drawFreshRelease,
  cues: [
    'need-both',
    'choose-depth',
    'depth-five',
    'cost-input',
    'cost-twenty-five',
    'cost-limit-complete',
    'try-packing',
    'predict-packing',
    'forty-fails',
    'forty-four',
    'packing-repair',
    'read-receipt',
    'answer-member',
  ],
};
