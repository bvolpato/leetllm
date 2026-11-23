import { dynamic, line, rect, text } from 'vizmatic/stage';
import { WORDS, WORD_COLOR } from './parts.mjs';

// The strip has one fixed width. The leaders keep even a narrow share legible.
export function wordBudget(s, region, readShares, { labelFirstInside = false } = {}) {
  const shown = WORDS.map(() => s.value(0));
  const height = labelFirstInside ? 108 : 70;
  const y = region.cy - 40;
  const frame = rect(region.width, height, { stroke: 'dim', width: 2, fill: null }).at(
    region.cx,
    y,
  );
  const body = dynamic(() => {
    const shares = readShares();
    const centers = [];
    let left = region.left;
    const segments = shares.flatMap((p, i) => {
      const width = p * region.width;
      centers.push(left + width / 2);
      const visibleWidth = width * shown[i].value;
      left += width;
      if (visibleWidth < 0.5) return [];
      return [
        rect(visibleWidth, height - 4, { fill: WORD_COLOR[i], stroke: null }).at(
          left - width + visibleWidth / 2,
          y,
        ),
      ];
    });
    // Work back from the right edge to leave room for adjacent word labels.
    let right = region.right - 102;
    const anchors = centers.map(() => 0);
    for (let i = centers.length - 1; i >= 0; i--) {
      anchors[i] = Math.min(centers[i], right);
      right = anchors[i] - 225;
    }
    const labels = shares.flatMap((p, i) => {
      const color = WORD_COLOR[i];
      const alpha = shown[i].value;
      if (alpha <= 0) return [];
      const words = WORDS[i] + '  ' + (100 * p).toFixed(1) + '%';
      if (labelFirstInside && i === 0) {
        return [text(words, { size: 62, color: 'bg' }).at(centers[i], y).opacity(alpha)];
      }
      const leaderEnd = y + height / 2 + 46;
      return [
        line([centers[i], y + height / 2 + 3], [anchors[i], leaderEnd], {
          stroke: color,
          width: 2,
        }),
        text(words, { size: labelFirstInside ? 42 : 36, color }).at(anchors[i], leaderEnd + 29),
      ].map((node) => node.opacity(alpha));
    });
    return [...segments, ...labels];
  });
  const segmentTop = (index) => {
    const shares = readShares();
    const before = shares.slice(0, index).reduce((sum, p) => sum + p, 0);
    return [region.left + region.width * (before + shares[index] / 2), y - height / 2];
  };
  return { frame, body, shown, segmentTop };
}
