import assert from 'node:assert/strict';
import { smoothstep } from 'vizmatic';
import { BRANCHES } from '../../../films/decoding/fixtures.mjs';

const branch = (name) => BRANCHES.find(({ word }) => word === name);
const run = branch('ran');
const sleep = branch('slept');
const runNext = Object.fromEntries(run.next);
const sleepNext = Object.fromEntries(sleep.next);
const originalHome = runNext.home + runNext.outside;

export function distribution(split) {
  const outside = runNext.outside * split;
  const home = originalHome - outside;
  return {
    run: run.p, sleep: sleep.p, home, outside, quickly: runNext.quickly,
    soundly: sleepNext.soundly, sleepOutside: sleepNext.outside,
    runHome: run.p * home, runOutside: run.p * outside,
    runQuickly: run.p * runNext.quickly, sleepSoundly: sleep.p * sleepNext.soundly,
    sleptOutside: sleep.p * sleepNext.outside,
  };
}

const pct = (p) => Math.round(p * 100);
export function checkDogFutures() {
  const before = distribution(0), after = distribution(1);
  assert.deepEqual([before.run, before.sleep].map(pct), [60, 40]);
  assert.deepEqual([before.home, before.soundly, before.runHome, before.sleepSoundly].map(pct), [70, 90, 42, 36]);
  assert.deepEqual([after.home, after.outside, after.quickly, after.soundly, after.sleepOutside].map(pct), [35, 35, 30, 90, 10]);
  assert.deepEqual([after.runHome, after.runOutside, after.runQuickly, after.sleepSoundly, after.sleptOutside].map(pct), [21, 21, 18, 36, 4]);
  assert(before.runHome > before.sleepSoundly);
  assert(Math.max(after.runHome, after.runQuickly, after.runOutside) < after.sleepSoundly);
  const greedyWord = [...run.next].sort((a, b) => b[1] - a[1])[0][0];
  assert.equal(greedyWord, 'home');
  for (const t of [0, 0.1, 0.37, 0.5, 0.9, 1]) {
    const d = distribution(t);
    assert(Math.abs(d.home + d.outside + d.quickly - 1) < 1e-12);
    assert(Math.abs(d.runHome + d.runOutside + d.runQuickly + d.sleepSoundly + d.sleptOutside - 1) < 1e-12);
    assert.equal(d.sleepSoundly, before.sleepSoundly);
  }
}

// Each phrase belongs to the production beat that speaks it. A zero span switches
// on the first video frame whose start is at or after the recorded onset.
export function forkState(clock) {
  const id = clock.beat.id;
  const on = (phrase) => Boolean(clock.reveal(phrase, 0));
  const after = (phrase, captionStart) => {
    if (!clock.reveal(phrase, 0, { captionStart })) return false;
    return clock.elapsed >= clock.wordCue(phrase).end;
  };
  const rise = (phrase, span) => smoothstep(clock.reveal(phrase, span));
  const state = {
    sleeping: true, leap: 1, breath: (1 - Math.cos(clock.seconds * Math.PI * 0.78)) / 2,
    first: '', second: '', write: 1, lift: 0,
    runWord: true, sleepWord: true, runPrior: true, sleepPrior: true,
    home: false, soundly: false, homeFactor: false, soundlyFactor: false,
    runScore: false, sleepScore: false, quickly: false, sleepOutside: false,
    proposal: false, moving: false, split: 0, outside: false,
    equal: false, winner: false, greedy: false, tiedChoice: false, carrySplit: false,
  };

  function committed(reveal) {
    state.sleeping = false;
    state.first = 'ran';
    state.write = reveal;
    state.leap = 1 - reveal;
  }

  function pairs() {
    state.home = state.homeFactor = state.soundly = state.soundlyFactor = true;
  }

  function originalScores() {
    pairs();
    state.runScore = state.sleepScore = true;
  }

  function revised() {
    originalScores();
    state.split = 1;
    state.outside = state.equal = state.quickly = state.sleepOutside = true;
    state.proposal = state.winner = state.carrySplit = true;
  }

  switch (id) {
    case 'c01-b01':
      state.runWord = on('Ran gets');
      state.runPrior = on('sixty percent');
      state.sleepWord = on('Slept gets');
      state.sleepPrior = on('forty');
      state.lift = 1 - rise('one token', 0.75);
      break;
    case 'c01-b02':
      if (on('Ran')) committed(rise('Ran', 0.6));
      state.greedy = on('greedy choice');
      break;
    case 'c01-b03':
      if (!on('Suppose')) {
        committed(1);
        state.greedy = true;
        break;
      }
      state.breath *= 1 - rise('Which pair is more likely', 0.7);
      state.home = on('home gets');
      state.homeFactor = on('seventy percent');
      state.soundly = on('soundly gets');
      state.soundlyFactor = on('ninety percent');
      break;
    case 'c02-b01':
      pairs();
      state.runScore = after('forty-two percent', 'forty-two percent');
      state.sleepScore = after('thirty-six percent', 'thirty-six percent');
      break;
    case 'c02-b02':
      originalScores();
      state.quickly = on('Quickly takes');
      state.sleepOutside = on('Outside takes');
      state.proposal = on('Which pair will lead');
      break;
    case 'c02-b03':
      originalScores();
      state.quickly = state.sleepOutside = state.proposal = true;
      state.moving = on('Move half');
      state.split = rise('Move half', 1.65);
      state.outside = state.split === 1;
      state.homeFactor = !state.moving || (state.outside && after('thirty-five percent of the ran branch', 'thirty-five percent'));
      state.equal = state.outside && after('twenty-one percent overall', 'twenty-one percent');
      state.runScore = !state.moving || state.equal;
      state.winner = state.equal && after('stayed at thirty-six percent', false);
      break;
    case 'c03-b01':
      if (!on('Now run')) {
        revised();
        break;
      }
      if (on('ran')) committed(rise('ran', 0.6));
      // The choice of the first word stands while the second slot is open.
      if (on('Home and outside')) {
        state.tiedChoice = true;
        state.home = state.outside = state.homeFactor = true;
        state.split = 1;
      }
      break;
    case 'c03-b02':
      committed(1);
      state.tiedChoice = !on('home');
      state.home = state.outside = state.homeFactor = true;
      state.split = 1;
      if (on('home')) {
        state.second = 'home';
        state.write = rise('home', 0.42);
        state.outside = false;
      }
      state.runScore = on('twenty-one percent');
      break;
    default:
      throw new RangeError('The hound scene has no beat ' + id);
  }
  if (clock.beat.chapterIndex >= 1) state.breath = 0;
  return { ...state, odds: distribution(state.split) };
}
