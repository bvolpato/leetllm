import test from 'node:test';
import assert from 'node:assert/strict';
import { quantileSortState, RESIDUALS, SORTED, DISPLAY_ORDER } from '../animations/conformal.mjs';
test('sorting carries each request score through a separate lane with stable tied identities', () => {
  for (let frame = 0; frame <= 1800; frame++) {
    const cards = quantileSortState(frame / 1800);
    assert.deepEqual(
      cards.map((x) => x.value),
      RESIDUALS,
    );
    assert.equal(new Set(cards.map((x) => x.id)).size, 9);
    assert(cards.filter((x) => x.amount > 0 && x.amount < 1).length <= 1);
    for (let a = 0; a < 9; a++)
      for (let b = a + 1; b < 9; b++) {
        const w = Math.min(cards[a].x + 145, cards[b].x + 145) - Math.max(cards[a].x, cards[b].x),
          h = Math.min(cards[a].y + 95, cards[b].y + 95) - Math.max(cards[a].y, cards[b].y);
        assert(!(w > 0 && h > 0));
      }
  }
  const start = quantileSortState(0).sort((a, b) => a.x - b.x),
    end = quantileSortState(1).sort((a, b) => a.x - b.x);
  assert.deepEqual(
    start.map((x) => x.index),
    DISPLAY_ORDER,
  );
  assert.deepEqual(
    end.map((x) => x.value),
    SORTED,
  );
  assert.deepEqual(
    end.filter((x) => x.value === 3).map((x) => x.id),
    ['C2', 'C3'],
  );
  assert.equal(end[7].value, 8);
  assert(end.every((x) => x.y === 735 && x.amount === 1));
  assert.deepEqual(quantileSortState(0.417), quantileSortState(0.417));
});
