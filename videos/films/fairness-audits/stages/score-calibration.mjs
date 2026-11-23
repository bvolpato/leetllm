import { matchedPairs } from '../fixtures.mjs';
import { auditBoard, isAuto, wordingColor, wordingLabel, wordings } from '../audit-board.mjs';

export function drawScoreCalibration(ctx, scene, state, api) {
  const { C, text, line, ticket, focus, started } = auditBoard(ctx, scene, state, api);
  if (started('by-channel')) {
    focus('channels', () => {
      text('Ready claims by channel', 115, 279, 48);
      for (const [i, label] of ['Chat', 'Email'].entries()) {
        const y = 501 + 240 * i;
        const cases = matchedPairs.filter((r) => r.ready).slice(i * 3, i * 3 + 3);
        text(label, 118, y, 48);
        cases.forEach((r, k) => ticket(r.id, 528 + k * 139, y - 15, C.muted));
        wordings.forEach((key, j) => {
          const x = 1220 + 408 * j;
          if (i === 0) text(wordingLabel(key), x, 363, 35, wordingColor(C, key), 'center');
          text(
            cases.filter((r) => isAuto(r[key])).length + ' / ' + cases.length,
            x,
            y,
            60,
            wordingColor(C, key),
            'center',
          );
        });
      }
      text(
        'Fractions count ready claims sent to automatic service.',
        960,
        939,
        38,
        C.muted,
        'center',
      );
    });
    return;
  }
  focus('bands', () => {
    text('Scores from 0.70 up to 0.90   ·   upper endpoint excluded', 112, 270, 42);
    wordings.forEach((key, j) => {
      if (j && !started('other-band')) return;
      const cases = matchedPairs.filter((r) => r[key] >= 0.7 && r[key] < 0.9);
      const color = wordingColor(C, key),
        y = 430 + j * 277;
      text(wordingLabel(key), 112, y + 17, 36, color);
      cases.forEach((r, i) => {
        const x = 490 + i * 148;
        text(r.id, x, y - 46, 30, C.muted, 'center');
        ticket(r[key].toFixed(2), x, y + 18, color, 124);
        if (started('observe'))
          text(
            r.ready ? 'ready' : 'unclear',
            x,
            y + 114,
            29,
            r.ready ? C.green : C.yellow,
            'center',
          );
      });
      const mean = cases.reduce((s, r) => s + r[key], 0) / cases.length;
      if (started('band')) text('Mean score   ' + mean.toFixed(3), 1375, y + 14, 35, color);
      if (started('observe'))
        text(
          'Ready   ' + cases.filter((r) => r.ready).length + ' / ' + cases.length,
          1375,
          y + 105,
          37,
        );
    });
    line(110, 611, 1810, 611, '#434752', 2);
    text(
      'Calibration compares predicted probability with observed readiness.',
      960,
      985,
      36,
      C.muted,
      'center',
    );
  });
}
export default { id: 'score-calibration', draw: drawScoreCalibration };
