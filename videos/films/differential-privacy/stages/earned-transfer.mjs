import { gaussianReleaseLedger } from '../model.mjs';

const prior = gaussianReleaseLedger([4, 4]);
const choices = [4, 8].map(sigma => ({ sigma, ledger: gaussianReleaseLedger([4, 4, sigma]) }));
const cap = 2;

export function drawEarnedTransfer(ctx, scene, state, api) {
  const { C, focus } = api;
  const text = (v, x, y, size, color = C.ink, align = 'left') => api.text(ctx, v, x, y, size, color, align);
  const left = 573, unit = 460, limit = left + cap * unit;
  const old = prior.best;
  if (state.beat === 3) {
    focus.target('serving-path', () => {
      const approved = choices[1].ledger.best.epsilon;
      text('Three noisy scores   ·   ε bound ≈ ' + approved.toFixed(3), 195, 290, 42, C.green);
      text('Public prompt', 195, 455, 40);
      api.arrow(ctx, 515, 442, 765, 442, C.cyan, 5);
      text('Released model', 825, 455, 40, C.cyan);
      api.arrow(ctx, 1190, 442, 1380, 442, C.cyan, 5);
      text('Reply', 1440, 455, 40);
      const request = focus.progress('open-retrieval', 0);
      if (request > 0) {
        const stopX = 973, y = 645;
        api.rect(ctx, 195, y - 49, 390, 98, C.pink);
        for (const edge of [195, 585]) api.circle(ctx, edge, y, 9, C.bg);
        text('Alice’s original ticket', 390, y + 13, 33, C.bg, 'center');
        api.line(ctx, 590, y, stopX, y, C.muted, 4);
        api.line(ctx, stopX, y - 40, stopX, y + 40, C.yellow, 8);
        api.circle(ctx, 600 + (stopX - 16 - 600) * request, y, 13, C.pink);
        text('Check copilot read permission', 1030, y + 13, 40, C.yellow);
        const reviewer = focus.progress('reviewer-read', 0);
        if (reviewer > 0) {
          const checkY = 850;
          api.line(ctx, 685, y, 685, checkY, C.muted, 4);
          api.line(ctx, 685, checkY, stopX, checkY, C.muted, 4);
          api.line(ctx, stopX, checkY - 40, stopX, checkY + 40, C.yellow, 8);
          const distance = (checkY - y + stopX - 16 - 685) * reviewer;
          api.circle(ctx, 685 + Math.max(0, distance - (checkY - y)), y + Math.min(distance, checkY - y), 13, C.pink);
          text('Check label reviewer read permission', 1030, checkY + 13, 40, C.yellow);
        }
      }
    });
    return;
  }
  focus.target('selection-budget', () => {
    text('Same customers   ·   sensitivity C   ·   no sampling   ·   δ = 0.00001', 160, 257, 35);
    text('Two saved measurements at 4C', 160, 360, 36, C.cyan);
    text('Order 16 bound ≈ ' + old.epsilon.toFixed(3), 1690, 360, 36, C.cyan, 'right');
    api.line(ctx, limit, 445, limit, 815, C.yellow, 4);
    text('ε cap 2', limit, 429, 35, C.yellow, 'center');
    choices.forEach(({sigma, ledger}, i) => {
      const y = 520 + i * 184;
      const p = focus.progress(i === 0 ? 'charge-four' : 'charge-eight', 0);
      const row = ledger.rows.find(v => v.alpha === old.alpha);
      const charge = row.charges.at(-1);
      const result = row.epsilon <= cap ? C.green : C.pink;
      text('New score', 155, y + 10, 30, C.muted);
      text('SD = ' + sigma + 'C', 155, y + 64, 43);
      api.rect(ctx, left, y, old.epsilon * unit, 65, C.cyan, undefined, 0);
      if (p > 0) api.rect(ctx, left + old.epsilon * unit, y, charge * unit * p, 65, result, undefined, 0);
      if (p === 1) {
        text('+' + charge.toFixed(3) + ' at order 16', left, y + 111, 29, result);
        text('≈ ' + row.epsilon.toFixed(3), 1825, y + 49, 38, result, 'right');
      }
    });
    text('Third charge at order 16    =    16 / (2σ²)       •       σ = SD / C', 960, 880, 34, C.muted, 'center');
    let line = 'Only the new score’s noise scale changes.';
    if (state.beat === 1) line = 'Which new score can the review approve under this cap?';
    if (focus.progress('choose-plan', 0) > 0) line = '8C fits the cap. Check that the noisier score still helps select the model.';
    text(line, 960, 948, 36, C.ink, 'center');
  });
}
export default { id: 'earned-transfer', draw: drawEarnedTransfer, cues: ['new-score', 'choose-scale', 'charge-four', 'charge-eight', 'choose-plan', 'open-retrieval', 'reviewer-read'] };
