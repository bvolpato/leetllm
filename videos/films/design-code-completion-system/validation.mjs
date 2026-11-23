import { sum } from './arithmetic.mjs';
import { accepted, base, retained } from './fixtures.mjs';
import { phases, sampleModel, suggestionPlayback } from './construction.mjs';
import { fresh, promptParts, route } from './model.mjs';
import { acceptEdit, oldReply, memberReply, member, snapshot } from './editor.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  const atPaint = snapshot(42, member.length, 7, 42);
  assert.equal(oldReply.captured.cursor, 17);
  assert.equal(atPaint.cursor, 23);
  assert.equal(acceptEdit(member, oldReply, atPaint), member);
  assert.equal(acceptEdit(member, memberReply, atPaint), member + 'allows(request)');
  assert.equal(memberReply.insert.length, 15);
  assert.equal(acceptEdit(member, memberReply, snapshot(42, 23, 8, 43)), member);
  assert.equal(fresh(base, base), true);
  assert.equal(
    fresh(
      {
        ...base,
        selection: {
          start: 23,
          end: 23,
        },
      },
      base,
    ),
    true,
  );
  assert.equal(
    fresh(
      {
        ...base,
        selection: {
          start: 22,
          end: 23,
        },
      },
      base,
    ),
    false,
  );
  for (const selection of [
    null,
    undefined,
    {
      start: 23,
      end: NaN,
    },
    {
      start: 24,
      end: 23,
    },
  ])
    assert.equal(
      fresh(
        {
          ...base,
          selection,
        },
        base,
      ),
      false,
    );
  for (const key of ['version', 'cursor', 'policy', 'epoch'])
    assert.equal(
      fresh(
        {
          ...base,
          [key]: -1,
        },
        base,
      ),
      false,
    );
  assert.equal(route('.'), 'LOCAL SEMANTIC');
  assert.equal(route('=', false), 'REMOTE FIM');
  assert.equal(route('=', false, 'False'), 'LOCAL FALLBACK');
  assert.equal(
    sampleModel({
      beat: 0,
      beatP: 0.5,
    }).assignmentRoute,
    'REMOTE FIM',
  );
  assert.equal(
    sampleModel({
      beat: 1,
      beatP: 0.5,
    }).assignmentRoute,
    'LOCAL FALLBACK',
  );
  assert.equal(sum(promptParts(true).map((v) => v.value)), 8000);
  assert.equal(phases().at(-1).end, 183);
  assert.equal(phases(150).at(-1).end, 333);
  for (const beatP of [0, 0.25, 0.5, 0.98]) {
    assert.deepEqual(
      sampleModel({
        beat: 1,
        beatP,
      }).timing,
      {
        immediate: 183,
        delayed: 333,
      },
    );
  }
  assert.equal(sum(retained), 39);
  assert.equal(sum(accepted), 64);
  assert.equal(accepted.filter((v) => v > 0).length, 3);
  assert.equal(
    suggestionPlayback({
      beat: 0,
      beatP: 0.02,
    }).shown,
    0,
  );
  const firstAccepted = suggestionPlayback({
    beat: 0,
    beatP: 0.22,
  });
  assert.equal(firstAccepted.inserted, 18);
  assert.equal(firstAccepted.present, 18);
  const firstEditing = suggestionPlayback({
    beat: 0,
    beatP: 0.285,
  });
  assert(firstEditing.present > 0 && firstEditing.present < 18);
  assert.equal(firstEditing.complete, 0);
  const firstRemoved = suggestionPlayback({
    beat: 0,
    beatP: 0.33,
  });
  assert.equal(firstRemoved.rows[0].present, 0);
  assert.equal(firstRemoved.rows[1].present, 4);
  const thirdEditing = suggestionPlayback({
    beat: 0,
    beatP: 0.45,
  });
  assert(thirdEditing.rows[2].present > 35 && thirdEditing.rows[2].present < 42);
  for (const beat of [0, 1])
    for (const beatP of [0, 0.22, 0.285, 0.33, 0.4, 0.45, 0.5, 0.55, 0.75, 0.98]) {
      const playback = suggestionPlayback({
        beat,
        beatP,
      });
      assert.equal(playback.inserted, sum(playback.rows.map((row) => row.inserted)));
      assert.equal(playback.present, sum(playback.rows.map((row) => row.present)));
      assert(playback.complete <= playback.shown);
      playback.rows.forEach((row, index) => {
        assert(row.present >= 0 && row.present <= row.inserted);
        if (!row.visible) assert.equal(row.inserted + row.present, 0);
        if (row.complete) assert.equal(row.present, retained[index]);
      });
      if (playback.complete === 4) {
        assert.equal(playback.accepted, 3);
        assert.equal(playback.inserted, 64);
        assert.equal(playback.present, 39);
      }
    }
  return true;
}
