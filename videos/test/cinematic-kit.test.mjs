import assert from 'node:assert/strict';
import test from 'node:test';
import { checkFilm, curve3d, dot, surface } from 'vizmatic/stage';
import {
  compileStageLesson,
  estimatedTimeline,
  stageOpeningHasPicture,
} from '../lib/stage-lesson.mjs';
import {
  CINEMATIC_FILM_OPTIONS,
  COSMOS,
  aura,
  cinematic3d,
  cinematicLesson,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  morphEquation,
  orbitScene,
  starfield,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../stage-lessons/cinematic-kit.mjs';

const sampleLesson = {
  id: 'cinema-smoke',
  title: 'Cinematic Smoke Test',
  source: 'smoke.md',
  scenes: [
    {
      id: 'hook',
      title: 'Hook',
      visual: '3D surface and glowing curves.',
      beats: [
        {
          say: 'Watch the glowing attention surface and its exact online equation.',
          hold: 0.6,
          visual_cues: [
            { id: 'eq', phrase: 'exact online equation', targets: ['equation'], color: 'yellow' },
          ],
        },
        {
          say: 'Now swap cleanly to the verification readout without dropping the stars.',
          hold: 0.6,
          visual_cues: [
            { id: 'swap', phrase: 'verification readout', targets: ['metric'], color: 'cyan' },
          ],
        },
      ],
    },
  ],
};

test('cinematic-kit enforces >= 26px phone readability and deterministic stars', () => {
  assert.throws(() => txt('too tiny', 0, 0, 20), /below phone-readable minimum/);
  assert.throws(() => glowTex('x^2', { size: 18 }), /below phone-readable minimum/);
  assert.throws(() => glowingTrail([[0, 0]]), /at least 2/);

  const a = starfield(20, 7, COSMOS.cyan);
  const b = starfield(20, 7, COSMOS.cyan);
  assert.equal(a.length, 20);
  assert.deepEqual(
    a.map((n) => [n.base.x, n.base.y, n.base.opacity]),
    b.map((n) => [n.base.x, n.base.y, n.base.opacity]),
  );

  verifyInvariant(2 + 2 === 4, 'basic arithmetic invariant');
  verifyApprox(Math.sin(Math.PI / 2), 1, 1e-12, 'sin(pi/2)');
  assert.throws(() => verifyApprox(1.1, 1.0, 1e-3, 'mismatch'));
  assert.equal(CINEMATIC_FILM_OPTIONS.background, '#070910');
  assert.equal(CINEMATIC_FILM_OPTIONS.bleed, true);
  assert.equal(CINEMATIC_FILM_OPTIONS.bloom, 0.24);
});

test('cinematicLesson integrates with compileStageLesson, checkFilm, 3D orbit, morphs, and swapAll', async () => {
  let invariantsRan = false;
  const def = cinematicLesson({
    id: sampleLesson.id,
    accent: COSMOS.cyan,
    invariants: () => {
      verifyApprox(1 / 3 + 2 / 3, 1, 1e-12, 'partition of unity');
      invariantsRan = true;
    },
    scenes: {
      hook: (s, c) => {
        const vis = s.value(1);
        const view = cinematic3d({ distance: 15.2, unit: 108 }).at(280, 12);
        const terrain = surface((x, y) => Math.exp(-(x * x + y * y) * 0.28) * 1.9, {
          x: [-2.6, 2.6],
          y: [-2.6, 2.6],
          resolution: [24, 24],
          colors: ['#070b1a', '#1b275c', '#4c2f8a', '#1f7ec2', '#5ce1e6', '#ffd166'],
          mesh: '#7ce8ff',
          meshOpacity: 0.16,
        });
        const ridge = curve3d(
          (t) => [-2.4 + t * 4.8, 0, Math.exp(-((-2.4 + t * 4.8) ** 2) * 0.28) * 1.9 + 0.08],
          0,
          1,
          {
            color: COSMOS.gold,
            width: 4.5,
            glow: 10,
            blend: 'screen',
            samples: 60,
          },
        );
        const slab = wireframeSlab3d([0, 0, 1.0], 0.8, 0.8, 0.35, { color: COSMOS.cyan });
        view.add(terrain, ridge, ...slab);

        const title = heroTitle(['Tiled SRAM', 'Attention'], {
          subtitle: 'Compute exact scores on-chip',
          accent: COSMOS.cyan,
        });
        const trail = glowingTrail(
          [
            [-850, 20],
            [-680, -35],
            [-480, 10],
          ],
          { gradientColors: [COSMOS.cyan, COSMOS.gold] },
        );
        const beacon = glowDot(-480, 10, { color: COSMOS.gold });
        const eqA = glowTex(String.raw`O(N^2)`, { x: -680, y: 120, size: 46, color: COSMOS.rose });
        const eqB = glowTex(String.raw`O\!\left(\frac{N^2 d}{M}\right)`, {
          x: -640,
          y: 120,
          size: 46,
          color: COSMOS.gold,
        });
        const readout = metricReadout('HBM TRAFFIC', '0.11 GB', {
          x: -860,
          y: 220,
          color: COSMOS.emerald,
          sub: '19.4x less HBM I/O',
        });
        const dyn = guardedDynamic(vis, (a) => dot(5, COSMOS.violet).at(-850, 120).opacity(a));

        s.add(aura(280, 12, 480, '#4c2f8a28'), view, title, trail, beacon, eqA, dyn);
        orbitScene(s, c, view, { theta: -0.25, phi: 0.9 });
        c.on('eq', () => s.play(morphEquation(eqA, eqB, { duration: 0.7 })));
        c.swapAll('swap', [title, readout], { keep: [view, title] });
      },
    },
  });

  assert.equal(invariantsRan, true);
  const timeline = estimatedTimeline(sampleLesson, 30);
  const { compiled, duration } = await compileStageLesson(def, sampleLesson, timeline);
  assert.equal(duration, timeline.duration);
  assert.equal(stageOpeningHasPicture(compiled), true);

  const report = await checkFilm(compiled, { times: [0.5, 2.5, duration - 0.5], textGap: 0.3 });
  assert.equal(report.summary.errors, 0, JSON.stringify(report.diagnostics));
  const crowded = report.diagnostics.filter((d) => d.code === 'film.text_crowded');
  assert.equal(crowded.length, 0, JSON.stringify(crowded));
  // Backdrop persists after c.swapAll because cinematicLesson pins it in keep.
  const endSvg = compiled.svg(duration - 0.4);
  assert.match(endSvg, /<radialGradient/);
});
