import assert from 'node:assert/strict';
import { draw, dynamic, fadeIn, rect, smoother, text } from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import { brief, fadeOut, leftText, tileRow } from '../defaults.mjs';
import { close, PATHS } from '../model.mjs';

/** Optional: training on sampled cuts. */
export function buildRegularization(
  stage,
  narration,
  { clearAtEnd, replaceNote },
  { buildLattice, LATTICE_PIECES, CHARS },
) {
  const noise = narration.scene('regularization');
  sceneHeading(stage, noise, narration.title('regularization'));
  {
    const small = buildLattice({
      x0: -880,
      step: 160,
      y: 40,
      chars: CHARS,
      pieces: LATTICE_PIECES([-420, -110, 80, 190]),
      tileSize: 60,
      labelSize: 40,
      tileH: 92,
    });
    const sharpness = stage.value(1),
      SOFT = 0.25;
    const sharesAt = (value) => {
      const raw = PATHS.map((p) => p ** value),
        total = raw.reduce((a, b) => a + b, 0);
      return raw.map((p) => p / total);
    };
    close(
      sharesAt(1).reduce((a, b) => a + b, 0),
      1,
    );
    assert.deepEqual(
      sharesAt(1).map((share) => Math.round(share * 100)),
      [95, 5, 0],
    );
    assert.deepEqual(
      sharesAt(SOFT).map((share) => Math.round(share * 100)),
      [62, 29, 8],
    );
    const NAMES_X = 60,
      BARS_X = 400,
      BARS_W = 370,
      BAR_YS = [-280, -180, -80];
    const barHead = leftText('Chance of each path (toy values)', NAMES_X, -360, {
      size: 50,
      color: 'dim',
    });
    const barNames = ['▁rain', '▁ + rain', '▁ + ra + in'].map((name, i) =>
      leftText(name, NAMES_X, BAR_YS[i], {
        font: 'mono',
        size: 46,
      }),
    );
    const shareBars = dynamic(() =>
      sharesAt(sharpness.value).flatMap((share, i) => {
        const width = Math.max(4, share * BARS_W);
        return [
          rect(width, 66, {
            radius: 6,
            fill: 'yellow',
            stroke: null,
          })
            .moveTo([0, BAR_YS[i]])
            .alignTo([BARS_X, 0], 'left'),
          leftText(
            share > 0 && share < 0.01 ? '<1%' : `${Math.round(share * 100)}%`,
            BARS_X + width + 14,
            BAR_YS[i],
            {
              font: 'mono',
              size: 48,
              color: 'yellow',
            },
          ),
        ];
      }),
    );
    const settingText = dynamic(() =>
      leftText(`chance ~ score^s,  s = ${sharpness.value.toFixed(2)}`, NAMES_X, 10, {
        font: 'mono',
        size: 46,
        color: 'yellow',
      }),
    );
    const passRows = [
      ['pass 1', ['▁rain']],
      ['pass 2', ['▁', 'rain']],
    ].map(([name, pieces], i) => {
      const y = 120 + i * 120;
      return [
        leftText(name, NAMES_X, y, {
          size: 54,
          color: 'dim',
        }),
        ...tileRow(pieces, y, {
          size: 70,
          color: 'yellow',
          x: 500,
          gap: 16,
          h: 106,
        }),
      ];
    });
    const slot = (content, options = {}) =>
      text(content, {
        font: 'text-serif',
        size: 62,
        ...options,
      }).at(0, 425);
    const sampleNote = slot('Sample one complete path for each training pass');
    const augmentNote = slot('Same text, different cuts: data augmentation', {
      color: 'teal',
    });
    const shareNote = slot('The two split paths get sampled more often', {
      color: 'dim',
    });
    const serveNote = slot('When serving, use the mode the checkpoint intends', {
      color: 'green',
    });
    noise.at(0.1, () =>
      stage.play(fadeIn([...small.all, barHead, ...barNames, shareBars, settingText]), {
        duration: 0.35,
      }),
    );
    noise.on('sample', () =>
      stage.play(
        fadeIn(sampleNote, {
          shift: [0, 8],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    noise.on('pass-1', () =>
      stage.play(
        draw(small.lit.whole),
        fadeIn(passRows[0], {
          shift: [-16, 0],
        }),
        {
          duration: 0.6,
        },
      ),
    );
    noise.on('pass-2', () =>
      stage.play(
        brief(fadeOut(small.lit.whole), 0.28),
        draw(small.lit.marker),
        draw(small.lit.rain),
        fadeIn(passRows[1], {
          shift: [-16, 0],
        }),
        {
          duration: 0.6,
        },
      ),
    );
    noise.on('augment', () => replaceNote(sampleNote, fadeIn(augmentNote)));
    noise.on('setting', () =>
      stage.play(sharpness.to(SOFT), {
        duration: 1.6,
        ease: smoother,
      }),
    );
    noise.on('option', () => replaceNote(augmentNote, fadeIn(shareNote)));
    noise.on('serve', () => replaceNote(shareNote, fadeIn(serveNote)));
    clearAtEnd(noise, [
      ...small.all,
      small.lit.marker,
      small.lit.rain,
      ...passRows.flat(),
      barHead,
      ...barNames,
      shareBars,
      settingText,
      serveNote,
    ]);
  }
}
