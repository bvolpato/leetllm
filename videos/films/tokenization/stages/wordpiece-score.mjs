import assert from 'node:assert/strict';
import { dot, fadeIn, indicate, line, morph, rect, smoother, text, to } from 'vizmatic/stage';
import { row, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, tile } from '../defaults.mjs';
import { TH, BOW, PROXY_RATIO, togetherShare } from '../model.mjs';

/** A frequent pair is not always a good pair. */
export function buildWordpieceScore(stage, narration, { clearAtEnd }) {
  const handover = (from, carry, ...into) =>
    stage.play(
      brief(fadeOut(from), 0.18, 0, LINEAR),
      ...into.map((animation) => brief(animation, 0.4, 0.2)),
      brief(fadeOut(carry), 0.18, 0.6, LINEAR),
    );
  const score = narration.scene('wordpiece-score');
  sceneHeading(stage, score, narration.title('wordpiece-score'));
  {
    // The first picture has no numbers: it only shows that the bigger count wins.
    const bpeNote = text('BPE: the biggest pair count wins', {
      font: 'text-serif',
      size: 76,
    }).at(0, -300);
    const schematic = [
      ['common', 1170, 'yellow'],
      ['rare', 150, 'dim'],
    ].map(([name, width, color], i) => {
      const y = -130 + i * 150;
      const tiles = row(
        [
          tile(name, {
            font: 'sans',
            size: 50,
            color,
            h: 100,
            min: 230,
          }),
          text('+', {
            size: 56,
            color: 'dim',
          }),
          tile(name, {
            font: 'sans',
            size: 50,
            color,
            h: 100,
            min: 230,
          }),
        ],
        y,
        24,
        -600,
      );
      const bar = rect(width, 100, {
        radius: 8,
        fill: color,
        stroke: null,
      })
        .moveTo([0, y])
        .alignTo([-310, 0], 'left');
      return {
        tiles,
        bar,
      };
    });
    const winsLabel = text('wins', {
      font: 'text-serif',
      size: 72,
      color: 'bg',
    })
      .at(-310 + 1170 / 2, schematic[0].bar.center[1])
      .zIndex(2);
    // One line at a time. The voice carries the rest.
    const commonNote = text('Two common pieces can win just by being common', {
      size: 60,
      color: 'red',
    }).at(0, 170);
    const originNote = text('WordPiece: Japanese and Korean speech recognition, then BERT', {
      size: 54,
      color: 'teal',
    }).at(0, 170);
    const questionNote = text('Which pieces make the text most likely, under a separate model?', {
      font: 'text-serif',
      size: 58,
      color: 'teal',
    }).at(0, 170);
    const bars = [bpeNote, ...schematic.flatMap((entry) => [...entry.tiles, entry.bar]), winsLabel];
    score.at(0.1, () =>
      stage.play(
        fadeIn(bars, {
          shift: [0, 10],
        }),
        {
          duration: 0.35,
        },
      ),
    );
    score.on('common', () =>
      stage.play(
        fadeIn(commonNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    score.on('origin', () =>
      stage.play(brief(fadeOut(commonNote), 0.18, 0, LINEAR), brief(fadeIn(originNote), 0.3, 0.18)),
    );
    score.on('question', () =>
      stage.play(
        brief(fadeOut(originNote), 0.18, 0, LINEAR),
        brief(fadeIn(questionNote), 0.3, 0.18),
      ),
    );
    // Keep the context, mechanism, and comparison fields in their original 1.2:5:2 shares.
    const left = -880,
      right = 880,
      top = -390,
      bottom = 460;
    const fieldGap = 16;
    const fieldUnit = (bottom - top - 2 * fieldGap) / (1.2 + 5 + 2);
    const contextY = top + (1.2 * fieldUnit) / 2;
    const mechanismTop = top + 1.2 * fieldUnit + fieldGap;
    const mechanismHeight = 5 * fieldUnit;
    const mechanismY = mechanismTop + mechanismHeight / 2;
    const comparisonTop = mechanismTop + mechanismHeight + fieldGap;
    const comparisonHeight = bottom - comparisonTop;
    const comparisonY = (comparisonTop + bottom) / 2;
    // These captions have one line. Their pivot holds half the measured advance width.
    const captionWidth = (node) => 2 * node.get('px');
    const captionHeight = (node) => 1.2 * node.data.size;
    const countOperands = (a, times, b, x, y, gap) => {
      const width = a.width + captionWidth(times) + b.width + 2 * gap;
      a.moveTo([x - width / 2 + a.width / 2, y]);
      times.at(x + (a.width - b.width) / 2, y);
      b.moveTo([x + width / 2 - b.width / 2, y]);
    };
    const caption = (content, size = 44, color = 'ink') =>
      text(content, { font: 'text-serif', size, color });
    const provenance = caption('Association score in the Hugging Face reconstruction', 46, 'teal')
      .at(0, contextY);

    // The three count identities persist while the fraction is assembled.
    const numerator = tile('count(ab)', { size: 64, h: 110, color: 'yellow' });
    const countA = tile('count(a)', { size: 64, h: 110, color: 'blue' });
    const countB = tile('count(b)', { size: 64, h: 110, color: 'teal' });
    const multiply = caption('×', 76);
    const fractionRule = line([-570, 0], [570, 0], { stroke: 'ink', width: 4 });
    const denominatorHeight = Math.max(countA.height, captionHeight(multiply), countB.height);
    const fractionHeight = numerator.height + 2 * 32 + denominatorHeight;
    numerator.moveTo([0, mechanismY - fractionHeight / 2 + numerator.height / 2]);
    fractionRule.moveTo([0, mechanismY + (numerator.height - denominatorHeight) / 2]);
    const denominatorY = mechanismY + fractionHeight / 2 - denominatorHeight / 2;
    countOperands(countA, multiply, countB, 0, denominatorY, 44);
    const numeratorTarget = numerator.center;
    const denominatorTargets = [countA, countB].map((node) => node.center);
    const pairedRole = caption('Paired appearances', 40, 'yellow');
    const marginalRole = caption('All appearances of each piece', 40);
    const scoreLabel = caption('score =', 56);
    scoreLabel.at(
      -fractionRule.width / 2 - 32 - captionWidth(scoreLabel) / 2,
      fractionRule.center[1],
    );
    pairedRole.at(
      0,
      numeratorTarget[1] - numerator.height / 2 - 24 - captionHeight(pairedRole) / 2,
    );
    marginalRole.at(0, denominatorY + denominatorHeight / 2 + 24 + captionHeight(marginalRole) / 2);
    const sourceLabels = [
      caption('Paired appearances', 38, 'yellow'),
      caption('All a appearances', 38, 'blue'),
      caption('All b appearances', 38, 'teal'),
    ];
    const sourceCounts = [numerator, countA, countB];
    const sourceWidths = sourceCounts.map((node, index) =>
      Math.max(node.width, captionWidth(sourceLabels[index])),
    );
    let sourceLeft = -(sourceWidths.reduce((sum, width) => sum + width, 0) + 2 * 80) / 2;
    const sourceColumns = sourceCounts.map((node, index) => {
      const label = sourceLabels[index];
      const x = sourceLeft + sourceWidths[index] / 2;
      node.moveTo([x, mechanismY - (24 + captionHeight(label)) / 2]);
      label.at(x, mechanismY + (node.height + 24) / 2);
      sourceLeft += sourceWidths[index] + 80;
      return [node, label];
    });
    const denominatorSources = [countA, countB].map((node) => node.center);
    const interpretation = caption('Same pair count ÷ larger denominator = lower score', 46, 'teal')
      .at(0, comparisonY);
    const genericParts = [
      numerator,
      countA,
      countB,
      multiply,
      fractionRule,
      scoreLabel,
      pairedRole,
      marginalRole,
    ];
    const commonPair = schematic[0].tiles;
    score.onBeat(1, () => {
      // The common pieces remain beside the individual counts. Their space then holds the pair count.
      handover(
        [...bars.filter((node) => !commonPair.includes(node)), questionNote],
        commonPair,
        fadeIn([provenance, ...sourceColumns.slice(1).flat()]),
      );
      stage.play(fadeIn(sourceColumns[0]), { duration: 0.4 });
    });
    score.on('formula', () =>
      stage.play(
        brief(fadeOut(sourceLabels), 0.18, 0, LINEAR),
        ...[countA, countB].map((node, index) =>
          brief(
            to(node, (item) =>
              item.moveTo([denominatorSources[index][0], denominatorTargets[index][1]]),
            ),
            0.4,
            0.2,
            smoother,
          ),
        ),
        ...[countA, countB].map((node, index) =>
          brief(
            to(node, (item) => item.moveTo(denominatorTargets[index])),
            0.4,
            0.6,
            smoother,
          ),
        ),
        brief(
          to(numerator, (node) => node.moveTo(numeratorTarget)),
          0.6,
          1,
          smoother,
        ),
        brief(fadeIn([multiply, fractionRule, scoreLabel, pairedRole, marginalRole]), 0.35, 1.6),
      ),
    );
    score.on('standin', () => stage.play(fadeIn(interpretation), { duration: 0.4 }));

    const smallStandIn = caption(
      'Two candidate pairs in an example corpus',
      42,
      'teal',
    );
    const hashNote = caption(
      '## marks a piece that continues a word',
      40,
    );
    smallStandIn.at(0, contextY - (12 + captionHeight(hashNote)) / 2);
    hashNote.at(0, contextY + (captionHeight(smallStandIn) + 12) / 2);
    const ratioNote = caption('rain + ##bow wins: > 50× the score, with fewer pairs', 40, 'green');
    ratioNote.at(0, hashNote.get('y'));

    const entries = [TH, BOW].map((entry) => {
      const product = entry.a * entry.b;
      const computedScore = entry.pair / product;
      const shares = togetherShare(entry);
      assert.equal(computedScore, entry.score);
      assert(entry.pair <= Math.min(entry.a, entry.b));
      assert(shares.every((share) => share > 0 && share <= 1));
      return { ...entry, product, computedScore, shares, pieces: entry.name.split(' + ') };
    });
    assert.deepEqual(
      entries.map((entry) => entry.product),
      [270_000, 2_200],
    );
    assert.deepEqual(
      entries.map((entry) => [entry.a - entry.pair, entry.b - entry.pair]),
      [
        [810, 210],
        [8, 2],
      ],
    );
    assert(entries[0].pair > entries[1].pair);
    assert(entries[0].computedScore < entries[1].computedScore);
    assert.equal(entries[1].computedScore / entries[0].computedScore, PROXY_RATIO);
    assert.equal(TH.score.toFixed(4), '0.0003');
    assert.equal(BOW.score.toFixed(3), '0.019');
    assert(PROXY_RATIO > 50);

    const panelGap = 80;
    const panelWidth = (right - left - panelGap) / 2;
    const panelUnit = (mechanismHeight - 2 * fieldGap) / (1 + 2 + 2);
    const identityY = mechanismTop + panelUnit / 2;
    const marginalTop = mechanismTop + panelUnit + fieldGap;
    const marginalRowHeight = (2 * panelUnit - fieldGap) / 2;
    const fractionY = marginalTop + 2 * panelUnit + fieldGap + panelUnit;
    const pairParts = entries.map((entry, index) => {
      const panelLeft = left + index * (panelWidth + panelGap);
      const panelX = panelLeft + panelWidth / 2;
      const name = tile(entry.name, { size: 42, h: 66, color: 'ink' });
      const pairCount = tile(String(entry.pair), { size: 54, h: 68, color: 'yellow' });
      row([name, pairCount], identityY, 24, panelX);
      const marginalRows = entry.pieces.map((piece, pieceIndex) => {
        const y = marginalTop + pieceIndex * (marginalRowHeight + fieldGap) + marginalRowHeight / 2;
        const total = pieceIndex === 0 ? entry.a : entry.b;
        const label = caption(piece, 38);
        const track = rect(370, 24, { radius: 0, fill: 'dim', stroke: null });
        const totalLabel = caption(String(total), 48);
        const labelWidth = captionWidth(label),
          totalWidth = captionWidth(totalLabel);
        const rowLeft = panelX - (labelWidth + track.width + totalWidth + 2 * 24) / 2;
        // Both text sizes share the total's baseline. The track stays centered in the row.
        label.at(rowLeft + labelWidth / 2, y + label.get('py') - totalLabel.get('py'));
        track.moveTo([rowLeft + labelWidth + 24 + track.width / 2, y]);
        totalLabel.at(rowLeft + labelWidth + 24 + track.width + 24 + totalWidth / 2, y);
        const trackLeft = track.center[0] - track.width / 2;
        const pairedWidth = track.width * entry.shares[pieceIndex];
        const paired = rect(pairedWidth, track.height, {
          radius: 0,
          fill: 'yellow',
          stroke: null,
        }).moveTo([trackLeft + pairedWidth / 2, y]);
        const detail = caption(`${entry.pair} paired + ${total - entry.pair} elsewhere`, 30, 'dim');
        detail.at(track.center[0], y + track.height / 2 + 12 + captionHeight(detail) / 2);
        const operand = tile(String(total), { size: 48, h: 62, color: 'ink' });
        const source = [totalLabel.get('x'), y];
        const carrier = dot(7, 'teal').at(source[0] + totalWidth / 2 + 16, y);
        return { label, track, paired, totalLabel, detail, operand, source, carrier };
      });
      const multiplication = caption('×', 52);
      const operandHeight = Math.max(
        ...marginalRows.map((part) => part.operand.height),
        captionHeight(multiplication),
      );
      const fractionHeight = pairCount.height + 2 * 14 + operandHeight;
      const numeratorDestination = [panelX, fractionY - fractionHeight / 2 + pairCount.height / 2];
      const operandY = fractionY + fractionHeight / 2 - operandHeight / 2;
      countOperands(
        marginalRows[0].operand,
        multiplication,
        marginalRows[1].operand,
        panelX,
        operandY,
        24,
      );
      const rule = line([-245, 0], [245, 0], { stroke: 'ink', width: 3 }).moveTo([
        panelX,
        fractionY + (pairCount.height - operandHeight) / 2,
      ]);
      const product = caption(entry.product.toLocaleString('en-US'), 60).at(panelX, operandY);
      const targets = marginalRows.map((part) => part.operand.center);
      return {
        entry,
        name,
        pairCount,
        marginalRows,
        multiplication,
        rule,
        product,
        numeratorDestination,
        targets,
        transferX: panelLeft + panelWidth + 16,
      };
    });

    const comparisonUnit = (comparisonHeight - 12) / (1.1 + 2.9);
    const comparisonTitleY = comparisonTop + (1.1 * comparisonUnit) / 2;
    const chartTop = comparisonTop + 1.1 * comparisonUnit + 12;
    const chartRowHeight = (bottom - chartTop - fieldGap) / 2;
    const rawTitle = caption('BPE: compare pair counts', 40);
    const proxyTitle = caption('WordPiece teaching proxy: divide by both counts', 40);
    rawTitle.at(0, comparisonTitleY);
    proxyTitle.at(0, comparisonTitleY);
    const maxRaw = Math.max(...entries.map((entry) => entry.pair));
    const maxScore = Math.max(...entries.map((entry) => entry.computedScore));
    const comparisons = entries.map((entry, index) => {
      const chartUnit = (right - left - 2 * 24) / (2.5 + 6 + 1.5);
      const plotLeft = left + 2.5 * chartUnit + 24;
      const plotWidth = 6 * chartUnit;
      const valueLeft = plotLeft + plotWidth + 24;
      const plotArea = {
        left: plotLeft,
        width: plotWidth,
        cy: chartTop + index * (chartRowHeight + fieldGap) + chartRowHeight / 2,
      };
      const label = caption(entry.name, 36);
      const track = rect(plotArea.width, 28, { fill: 'surface', stroke: null, radius: 0 });
      label.at(left + captionWidth(label) / 2, plotArea.cy);
      track.moveTo([plotArea.left + plotArea.width / 2, plotArea.cy]);
      const rawWidth = (plotArea.width * entry.pair) / maxRaw;
      const scoreWidth = (plotArea.width * entry.computedScore) / maxScore;
      const bar = rect(rawWidth, 28, { fill: 'yellow', stroke: null, radius: 0 }).moveTo([
        plotArea.left + rawWidth / 2,
        plotArea.cy,
      ]);
      const rawValue = caption(String(entry.pair), 48, 'yellow');
      const scoreValue = caption(
        index === 0 ? entry.computedScore.toFixed(4) : entry.computedScore.toFixed(3),
        48,
      );
      rawValue.at(valueLeft + captionWidth(rawValue) / 2, plotArea.cy);
      scoreValue.at(valueLeft + captionWidth(scoreValue) / 2, plotArea.cy);
      return { label, track, bar, rawValue, scoreValue, rawWidth, scoreWidth, plotArea };
    });
    const bpeWinner = caption('BPE picks t + ##h', 40, 'yellow');
    bpeWinner.at(0, hashNote.get('y'));

    score.on('hash', () =>
      handover(
        [provenance, pairedRole, interpretation],
        genericParts.filter((node) => node !== pairedRole),
        fadeIn([
          smallStandIn,
          hashNote,
          rawTitle,
          ...pairParts.map((part) => part.name),
          ...comparisons.flatMap((part) => [part.label, part.track]),
        ]),
      ),
    );
    ['th-raw', 'bow-raw'].forEach((cue, index) => {
      score.after(cue, () =>
        stage.play(
          fadeIn(pairParts[index].pairCount),
          fadeIn([comparisons[index].bar, comparisons[index].rawValue]),
          { duration: 0.45 },
        ),
      );
    });
    score.after('raw-wins', () =>
      stage.play(
        brief(fadeOut(hashNote), 0.18, 0, LINEAR),
        brief(fadeIn(bpeWinner), 0.3, 0.18),
        ...pairParts.map((part) =>
          brief(
            to(part.pairCount, (node) => node.moveTo(part.numeratorDestination)),
            0.7,
            0,
            smoother,
          ),
        ),
        brief(fadeIn(pairParts.map((part) => part.rule)), 0.3, 0.7),
      ),
    );
    ['th-counts', 'bow-counts'].forEach((cue, index) => {
      const part = pairParts[index];
      score.after(cue, () =>
        stage.play(
          fadeIn(
            part.marginalRows.flatMap((marginal) => [
              marginal.label,
              marginal.track,
              marginal.totalLabel,
            ]),
          ),
          { duration: 0.5 },
        ),
      );
    });
    ['th-apart', 'bow-together'].forEach((cue, index) => {
      score.after(cue, () =>
        stage.play(
          fadeIn(
            pairParts[index].marginalRows.flatMap((marginal) => [marginal.paired, marginal.detail]),
          ),
          { duration: 0.35 },
        ),
      );
    });
    score.on('scores', () => {
      // A dot carries each copied value around the numerator. The number appears at its destination.
      for (let index = 0; index < 2; index++) {
        stage.play(
          ...pairParts.flatMap((part) => {
            const marginal = part.marginalRows[index];
            return [
              fadeIn(marginal.carrier),
              to(marginal.carrier, (node) => node.moveTo([part.transferX, marginal.source[1]])),
            ];
          }),
          { duration: 0.25, ease: smoother },
        );
        stage.play(
          ...pairParts.map((part) =>
            to(part.marginalRows[index].carrier, (node) =>
              node.moveTo([part.transferX, part.targets[index][1]]),
            ),
          ),
          { duration: 0.4, ease: smoother },
        );
        stage.play(
          ...pairParts.map((part) =>
            to(part.marginalRows[index].carrier, (node) => node.moveTo(part.targets[index])),
          ),
          { duration: 0.4, ease: smoother },
        );
        stage.play(
          brief(fadeOut(pairParts.map((part) => part.marginalRows[index].carrier)), 0.15),
          brief(fadeIn(pairParts.map((part) => part.marginalRows[index].operand)), 0.2, 0.15),
        );
      }
      stage.play(fadeIn(pairParts.map((part) => part.multiplication)), { duration: 0.2 });
      stage.wait(0.25);
      stage.play(
        ...pairParts.map((part) =>
          morph(
            [...part.marginalRows.map((marginal) => marginal.operand), part.multiplication],
            part.product,
          ),
        ),
        { duration: 0.55 },
      );
    });

    // The bars and decimals remain concealed until the complete winner clause finishes.
    score.after('flip', () => {
      stage.play(
        brief(
          fadeOut([rawTitle, bpeWinner, ...comparisons.map((part) => part.rawValue)]),
          0.18,
          0,
          LINEAR,
        ),
        brief(fadeIn(proxyTitle), 0.3, 0.18),
        ...comparisons.map((part) =>
          brief(
            to(part.bar, (node) => {
              node.set('sx', part.scoreWidth / part.rawWidth);
              node.moveTo([part.plotArea.left + part.scoreWidth / 2, part.plotArea.cy]);
              node.fill('teal');
            }),
            0.8,
            0.18,
            smoother,
          ),
        ),
        brief(fadeIn(comparisons.map((part) => part.scoreValue)), 0.3, 0.98),
      );
      stage.play(fadeIn(ratioNote), indicate(comparisons[1].bar, { color: 'green', scale: 1.02 }), {
        duration: 0.5,
      });
    });
    clearAtEnd(score, [
      smallStandIn,
      ratioNote,
      proxyTitle,
      ...pairParts.flatMap((part) => [
        part.name,
        part.pairCount,
        part.rule,
        part.product,
        ...part.marginalRows.flatMap((marginal) => [
          marginal.label,
          marginal.track,
          marginal.paired,
          marginal.totalLabel,
          marginal.detail,
        ]),
      ]),
      ...comparisons.flatMap((part) => [part.label, part.track, part.bar, part.scoreValue]),
    ]);
  }
}
