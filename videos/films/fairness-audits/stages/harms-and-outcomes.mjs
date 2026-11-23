import { auditBoard, wordingColor, wordingLabel, wordings } from '../audit-board.mjs';

export function drawHarmsAndOutcomes(ctx, scene, state, api) {
  const { C, text, line, ticket, focus, started } = auditBoard(ctx, scene, state, api);
  const same = started('same-route');
  focus('service', () => {
    text('p4    /    Service record', 110, 266, 34, C.muted);
    for (const [i, key] of wordings.entries()) {
      const y = 402 + 177 * i,
        color = wordingColor(C, key);
      text(wordingLabel(key), 115, y + 11, 37, color);
      ticket('p4', 467, y, color);
      line(540, y, 650, y, C.muted, 3);
      text(i === 0 || same ? 'Automatic service' : 'Human review', 681, y + 13, 38, color);
    }
    text('Waiting time', 116, 790, 33, C.muted);
    text('Resolution quality', 116, 860, 33, C.muted);
    text('Unmeasured', 489, 790, 34);
    text('Unmeasured', 489, 860, 34);
  });
  focus('reply', () => {
    line(1100, 240, 1100, 910, '#434752', 2);
    text('Example reply', 1186, 314, 34, C.muted);
    if (started('reply')) {
      text('“You sound\nuneducated.”', 1186, 484, 59, C.pink);
      text('Review the stereotype\nin the reply itself.', 1186, 730, 38);
    }
  });
}
export default { id: 'harms-and-outcomes', draw: drawHarmsAndOutcomes };
