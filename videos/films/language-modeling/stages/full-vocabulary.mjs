import { languageStep } from '../construction.mjs';
import {
  drawExtendedCell,
  drawExtendedEquation,
  drawExtendedFoot,
  drawExtendedHead,
  drawExtendedText,
  formatLanguage,
} from '../defaults.mjs';
export function drawFullVocabulary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('full-vocabulary', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('full-vocabulary-construction', () => {
    drawExtendedHead(
      ctx,
      api,
      currentBeat === 1
        ? 'Same observations · every eligible outcome gets a pseudo-count'
        : 'Retain every observed transition',
    );
    const records = [
      'function → returns → value',
      'function → returns → value',
      'method → returns → result',
      'handler → returns → value',
      'test → returns → result',
      'test → returns → error',
    ];
    const count = currentBeat > 0 ? 6 : Math.floor(S(0, 2) * 6);
    const classes = [0, 0, 1, 0, 1, 2],
      inks = [themeColors.cyan, themeColors.blue, themeColors.pink];
    records.forEach((v, i) => {
      drawExtendedCell(
        ctx,
        api,
        v,
        115,
        340 + i * 78,
        650,
        62,
        i < count ? inks[classes[i]] : themeColors.muted,
        27,
      );
      if (i < count)
        api.arrow(ctx, 778, 371 + i * 78, 875, 372 + 55 * classes[i], inks[classes[i]], 3);
    });
    const full = currentBeat === 1 && S(1, 3) > 0,
      words = full
        ? [
            'value',
            'result',
            'error',
            'exception',
            'function',
            'returns',
            'method',
            'handler',
            'test',
            'end',
          ]
        : ['value', 'result', 'error', 'exception'];
    const newOccurrence = currentBeat === 2 && E(2, 0),
      raw = [
        ...Array.from(
          {
            length: 3,
          },
          (_, j) =>
            currentBeat === 0
              ? classes.slice(0, count).filter((v) => v === j).length
              : [3, 2, 1][j],
        ),
        newOccurrence ? 1 : 0,
        ...Array(6).fill(0),
      ],
      pseudo = currentBeat === 1 && (full ? S(1, 4) : S(1, 2)) === 1 ? 1 : 0;
    const total = currentBeat === 1 ? 6 + words.length * pseudo : 6 + (newOccurrence ? 1 : 0),
      normalized =
        currentBeat === 0 ? E(0, 3) : currentBeat === 1 ? (full ? E(1, 4) : E(1, 2)) : E(2, 2);
    drawExtendedText(ctx, api, 'Next token', 920, 315, 25, themeColors.muted);
    drawExtendedText(ctx, api, 'Raw', 1130, 315, 25, themeColors.muted);
    drawExtendedText(
      ctx,
      api,
      currentBeat === 1 ? '+1 per entry' : 'retained counts',
      1295,
      315,
      25,
      themeColors.muted,
    );
    words.forEach((word, i) => {
      const y = 345 + i * 55;
      drawExtendedText(
        ctx,
        api,
        word,
        905,
        y + 27,
        26,
        i === 3 ? themeColors.yellow : (inks[i] ?? themeColors.muted),
      );
      drawExtendedText(ctx, api, raw[i], 1160, y + 27, 28, themeColors.ink, 'center');
      if (pseudo) drawExtendedCell(ctx, api, '+1', 1240, y - 7, 70, 43, themeColors.yellow, 23);
      if (normalized)
        drawExtendedText(
          ctx,
          api,
          `${raw[i] + pseudo}/${total} = ${formatLanguage(ctx, api, (raw[i] + pseudo) / total, 4)}`,
          1425,
          y + 27,
          26,
          themeColors.ink,
        );
    });
    if (normalized)
      drawExtendedText(
        ctx,
        api,
        'Complete denominator: ' + total,
        1220,
        full ? 945 : 725,
        31,
        themeColors.yellow,
        'center',
      );
    if (currentBeat === 0 && E(0, 5))
      drawExtendedEquation(
        ctx,
        api,
        String.raw`P(\mathrm{exception})=0\quad\Rightarrow\quad-\ln0=\infty`,
        1190,
        850,
        34,
        themeColors.pink,
      );
    if (currentBeat === 2) {
      drawExtendedCell(
        ctx,
        api,
        'function → returns → exception',
        115,
        845,
        650,
        65,
        newOccurrence ? themeColors.green : themeColors.muted,
        27,
      );
      if (E(2, 3))
        drawExtendedText(
          ctx,
          api,
          'value 3/7 · exception 1/7',
          1220,
          850,
          33,
          themeColors.green,
          'center',
        );
    }
    drawExtendedFoot(
      ctx,
      api,
      full
        ? '10 eligible outputs, including observed and zero-count entries'
        : 'Six original records remain visible when the seventh arrives',
    );
  });
}
export default {
  id: 'full-vocabulary',
  draw: drawFullVocabulary,
  cues: [
    'full-vocabulary-b1',
    'full-vocabulary-voice-1',
    'full-vocabulary-step-0-1',
    'full-vocabulary-step-0-2',
    'full-vocabulary-step-0-3',
    'full-vocabulary-step-0-4',
    'full-vocabulary-step-0-5',
    'full-vocabulary-b2',
    'full-vocabulary-voice-2',
    'smooth-four',
    'smooth-full',
    'full-vocabulary-step-1-1',
    'full-vocabulary-step-1-2',
    'full-vocabulary-step-1-3',
    'full-vocabulary-step-1-4',
    'full-vocabulary-step-1-5',
    'full-vocabulary-step-1-6',
    'full-vocabulary-b3',
    'full-vocabulary-voice-3',
    'count-new-record',
    'count-seven',
    'full-vocabulary-step-2-1',
    'full-vocabulary-step-2-2',
    'full-vocabulary-step-2-3',
    'full-vocabulary-step-2-4',
    'full-vocabulary-step-2-5',
  ],
};
