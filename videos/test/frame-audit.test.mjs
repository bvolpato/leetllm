import test from 'node:test';
import assert from 'node:assert/strict';
import { FrameAudit, layoutIssues } from '../lib/frame-audit.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';

function paintedIssues(draw) {
  const canvas = createCanvas(960, 540);
  const audit = drawFrame(
    canvas.getContext('2d'),
    {},
    { title: 'Layout regression' },
    { t: 1, duration: 10, opacity: 1 },
    draw,
  );
  return layoutIssues(audit);
}

test('global layout checking catches labels from separate scopes and escaped shapes', () => {
  const result = layoutIssues({
    labels: [
      { text: 'first', x: 100, y: 300, width: 100, height: 30, alpha: 1, group: 0 },
      { text: 'second', x: 150, y: 310, width: 100, height: 30, alpha: 1, group: 1 },
    ],
    shapes: [{ x: 1890, y: 300, width: 100, height: 50 }],
    issues: [],
  });
  assert.deepEqual(
    result.map((issue) => issue.type),
    ['label-collision', 'clipped-shape'],
  );
  assert.deepEqual(
    layoutIssues({
      labels: [
        { text: 'fading', x: 100, y: 300, width: 100, height: 30, alpha: 0.1 },
        { text: 'visible', x: 100, y: 300, width: 100, height: 30, alpha: 1 },
      ],
    }),
    [],
  );
});

test('full-frame coverage catches a one-frame layout fault between preview samples', () => {
  const audit = new FrameAudit('moving-node', 30);
  for (let frame = 0; frame < 60; frame++) {
    audit.observe(frame, {
      labels: [],
      shapes: [],
      connectors: [],
      issues: frame === 17 ? [{ type: 'label-overflow', text: 'moving label', scope: 'node' }] : [],
    });
  }
  const result = audit.finish(60);
  assert.equal(result.passed, false);
  assert.equal(result.issueFrames, 1);
  assert.equal(result.issues[0].firstFrame, 17);
  assert.equal(result.issues[0].lastFrame, 17);
});

test('coverage cannot pass after skipping a frame or ending early', () => {
  const audit = new FrameAudit('example', 30);
  audit.observe(0, { issues: [] });
  assert.throws(() => audit.observe(2, { issues: [] }), /skipped frame 1/);
  assert.throws(() => audit.finish(30), /audited 1\/30/);
});

test('a visible curve crossing label ink fails, including a short traced segment', () => {
  const issues = paintedIssues((ctx, scene, state, api) => {
    api.text(ctx, 'Learning', 300, 400, 40);
    api.trace(
      ctx,
      [
        { x: 290, y: 385 },
        { x: 520, y: 385 },
      ],
      1,
      api.C.yellow,
      4,
    );
  });
  const collision = issues.find(
    (issue) => issue.type === 'label-path' && issue.text === 'Learning',
  );
  assert.ok(collision);
  assert.ok(collision.inkLength >= 3);
  assert.ok(Number.isFinite(collision.point.x));
});

test('a curve behind a later opaque card is safe, while a later card hiding text fails', () => {
  assert.deepEqual(
    paintedIssues((ctx, scene, state, api) => {
      api.path(ctx, [
        { x: 200, y: 385 },
        { x: 600, y: 385 },
      ]);
      api.rect(ctx, 280, 330, 240, 100, api.C.panel);
      api.text(ctx, 'Learning', 300, 400, 40);
    }),
    [],
  );
  assert.ok(
    paintedIssues((ctx, scene, state, api) => {
      api.text(ctx, 'Learning', 300, 400, 40);
      api.rect(ctx, 280, 330, 240, 100, api.C.panel);
    }).some((issue) => issue.type === 'label-occluded' && issue.text === 'Learning'),
  );
});

test('spaces between glyphs do not count as text ink', () => {
  assert.deepEqual(
    paintedIssues((ctx, scene, state, api) => {
      ctx.save();
      ctx.font = '500 40px "Lesson Sans"';
      const x = 300 + ctx.measureText('A   ').width;
      ctx.restore();
      api.text(ctx, 'A       B', 300, 400, 40);
      api.path(
        ctx,
        [
          { x, y: 345 },
          { x, y: 425 },
        ],
        { width: 2 },
      );
    }),
    [],
  );
});

test('strokes and child shapes are contained, and an explicitly clipped path is safe', () => {
  const issues = paintedIssues((ctx, scene, state, api) => {
    api.container(
      ctx,
      { x: 300, y: 300, width: 200, height: 200 },
      () => {
        api.circle(ctx, 490, 380, 20, api.C.cyan, api.C.cyan, 6);
        api.path(
          ctx,
          [
            { x: 100, y: 450 },
            { x: 700, y: 450 },
          ],
          {
            clip: { x: 300, y: 300, width: 200, height: 200 },
            width: 8,
          },
        );
      },
      { id: 'memory', padding: 0 },
    );
  });
  assert.ok(issues.some((issue) => issue.type === 'shape-overflow' && issue.group === 'memory'));
  assert.ok(
    !issues.some((issue) => issue.type === 'path-overflow' || issue.type === 'clipped-path'),
  );
  assert.ok(
    paintedIssues((ctx, scene, state, api) => {
      api.circle(ctx, 20, 300, 20, undefined, api.C.cyan, 8);
    }).some((issue) => issue.type === 'clipped-shape'),
  );
});

test('old quantization opening tiles crossing their memory panel are detected without a scope', () => {
  const issues = paintedIssues((ctx, scene, state, api) => {
    api.rect(ctx, 210, 385, 580, 180, api.C.panel, api.C.blue);
    api.rect(ctx, 772, 421, 58, 108, api.C.blue, undefined, 6);
  });
  const escaped = issues.find((issue) => issue.type === 'shape-crosses-panel');
  assert.ok(escaped);
  assert.equal(escaped.container.x + escaped.container.width, 790);
  assert.equal(escaped.bounds.x + escaped.bounds.width, 830);
});

test('connector attachments compare endpoints with the geometry actually painted', () => {
  const issues = paintedIssues((ctx, scene, state, api) => {
    const source = api.rect(ctx, 300, 300, 100, 100, api.C.panel);
    const target = api.circle(ctx, 700, 350, 40, api.C.panel);
    source.x += 30;
    api.connect(ctx, source, target, { gap: 10 });
  });
  assert.ok(
    issues.some(
      (issue) =>
        issue.type === 'disconnected-attachment' && issue.end === 'from' && issue.distance > 29,
    ),
  );
  assert.deepEqual(
    paintedIssues((ctx, scene, state, api) => {
      const source = api.rect(ctx, 300, 300, 100, 100, api.C.panel);
      const target = api.circle(ctx, 700, 350, 40, api.C.panel);
      api.connect(ctx, source, target, { gap: 10 });
    }),
    [],
  );
});

test('rounded nodes and nonuniform transforms keep genuinely attached connectors valid', () => {
  assert.deepEqual(
    paintedIssues((ctx, scene, state, api) => {
      ctx.save();
      ctx.translate(200, 200);
      ctx.scale(1.7, 0.8);
      const source = api.rect(ctx, 100, 100, 100, 100, api.C.panel, api.C.cyan, 20);
      const target = api.circle(ctx, 400, 400, 45, api.C.panel, api.C.cyan);
      api.connect(ctx, source, target, { gap: 12 });
      ctx.restore();
    }),
    [],
  );
});

test('opaque filled paths hide text and can also shield an earlier curve', () => {
  const card = [
    { x: 280, y: 330 },
    { x: 520, y: 330 },
    { x: 520, y: 430 },
    { x: 280, y: 430 },
  ];
  assert.ok(
    paintedIssues((ctx, scene, state, api) => {
      api.text(ctx, 'Learning', 300, 400, 40);
      api.path(ctx, card, { fill: api.C.panel, width: 0, closed: true });
    }).some((issue) => issue.type === 'label-occluded' && issue.id === 'path-0'),
  );
  assert.deepEqual(
    paintedIssues((ctx, scene, state, api) => {
      api.path(ctx, [
        { x: 200, y: 385 },
        { x: 600, y: 385 },
      ]);
      api.path(ctx, card, { fill: api.C.panel, width: 0, closed: true });
      api.text(ctx, 'Learning', 300, 400, 40);
    }),
    [],
  );
});

test('rotated containers reject a child inside their AABB but outside their actual content', () => {
  const issues = paintedIssues((ctx, scene, state, api) => {
    ctx.save();
    ctx.translate(600, 500);
    ctx.rotate(Math.PI / 4);
    api.container(
      ctx,
      { x: -100, y: -100, width: 200, height: 200 },
      () => {
        ctx.save();
        ctx.rotate(-Math.PI / 4);
        api.rect(ctx, 100, 100, 10, 10);
        ctx.restore();
      },
      { id: 'rotated', padding: 0 },
    );
    ctx.restore();
  });
  assert.ok(issues.some((issue) => issue.type === 'shape-overflow' && issue.group === 'rotated'));
});

test('clipped geometry includes stroke fringes and fills whose edges enclose the clip', () => {
  const stroke = paintedIssues((ctx, scene, state, api) => {
    api.container(
      ctx,
      { x: 310, y: 300, width: 90, height: 100 },
      () => {
        api.path(
          ctx,
          [
            { x: 295, y: 320 },
            { x: 295, y: 380 },
          ],
          {
            width: 20,
            clip: { x: 300, y: 300, width: 100, height: 100 },
          },
        );
      },
      { id: 'stroke-fringe', padding: 0 },
    );
  });
  assert.ok(
    stroke.some((issue) => issue.type === 'path-overflow' && issue.group === 'stroke-fringe'),
  );
  const fill = paintedIssues((ctx, scene, state, api) => {
    api.container(
      ctx,
      { x: 300, y: 300, width: 100, height: 100 },
      () => {
        api.path(
          ctx,
          [
            { x: 200, y: 200 },
            { x: 600, y: 200 },
            { x: 600, y: 600 },
            { x: 200, y: 600 },
          ],
          {
            width: 0,
            fill: api.C.blue,
            closed: true,
            clip: { x: 250, y: 250, width: 200, height: 200 },
          },
        );
      },
      { id: 'clipped-fill', padding: 0 },
    );
  });
  assert.ok(fill.some((issue) => issue.type === 'path-overflow' && issue.group === 'clipped-fill'));
});

test('an arrowhead can cross a label outside the shaft bounds', () => {
  const result = layoutIssues({
    labels: [{ text: 'label', x: 168, y: 110, width: 10, height: 12 }],
    connectors: [
      {
        id: 'arrow',
        from: { x: 100, y: 100 },
        to: { x: 200, y: 100 },
        strokeWidth: 2,
        head: [
          { x: 200, y: 100 },
          { x: 170, y: 125 },
          { x: 170, y: 75 },
        ],
      },
    ],
  });
  assert.ok(result.some((issue) => issue.type === 'label-connector' && issue.id === 'arrow'));
});

test('round endcaps retain text collisions through clips and respect excluded pixels', () => {
  const draw = (clip) => (ctx, scene, state, api) => {
    api.text(ctx, 'O', 300, 400, 80);
    api.path(
      ctx,
      [
        { x: 200, y: 373.45 },
        { x: 300, y: 373.45 },
      ],
      { color: api.C.red, width: 12, clip },
    );
  };
  assert.ok(
    paintedIssues(draw()).some((issue) => issue.type === 'label-path' && issue.text === 'O'),
  );
  assert.ok(
    paintedIssues(draw({ x: 100, y: 100, width: 1000, height: 1000 })).some(
      (issue) => issue.type === 'label-path' && issue.text === 'O',
    ),
  );
  assert.ok(
    !paintedIssues(draw({ x: 100, y: 100, width: 200, height: 1000 })).some(
      (issue) => issue.type === 'label-path' && issue.text === 'O',
    ),
  );
});

test('connectors reject unpainted descriptors and resolve references painted later', () => {
  const missing = paintedIssues((ctx, scene, state, api) => {
    api.connect(ctx, { x: 300, y: 300, width: 100, height: 100 }, { x: 700, y: 350, r: 40 });
  });
  assert.deepEqual(
    missing.filter((issue) => issue.type === 'missing-attachment').map((issue) => issue.end),
    ['from', 'to'],
  );
  assert.deepEqual(
    paintedIssues((ctx, scene, state, api) => {
      const source = { x: 300, y: 300, width: 100, height: 100 },
        target = { x: 700, y: 350, r: 40 };
      api.connect(ctx, source, target);
      Object.assign(source, api.rect(ctx, 300, 300, 100, 100));
      Object.assign(target, api.circle(ctx, 700, 350, 40));
    }),
    [],
  );
  assert.ok(
    paintedIssues((ctx, scene, state, api) => {
      const source = { x: 300, y: 300, width: 100, height: 100 },
        target = { x: 700, y: 350, r: 40 };
      api.connect(ctx, source, target);
      Object.assign(source, api.rect(ctx, 340, 300, 100, 100));
      Object.assign(target, api.circle(ctx, 700, 350, 40));
    }).some((issue) => issue.type === 'stale-attachment-geometry' && issue.end === 'from'),
  );
});

test('group anchors require all painted members and detect stale member unions', () => {
  assert.deepEqual(
    paintedIssues((ctx, scene, state, api) => {
      const first = api.rect(ctx, 300, 300, 50, 100),
        second = api.rect(ctx, 400, 300, 50, 100);
      const source = api.groupBounds(api.groupBounds(first), second),
        target = api.circle(ctx, 700, 350, 40);
      api.connect(ctx, source, target);
    }),
    [],
  );
  const moved = paintedIssues((ctx, scene, state, api) => {
    const first = api.rect(ctx, 300, 300, 50, 100),
      second = { x: 400, y: 300, width: 50, height: 100 };
    const source = api.groupBounds(first, second),
      target = api.circle(ctx, 700, 350, 40);
    api.connect(ctx, source, target);
    Object.assign(second, api.rect(ctx, 460, 300, 50, 100));
  });
  assert.ok(moved.some((issue) => issue.type === 'stale-group-geometry' && issue.end === 'from'));
  assert.ok(
    moved.some((issue) => issue.type === 'disconnected-attachment' && issue.end === 'from'),
  );
  assert.ok(
    paintedIssues((ctx, scene, state, api) => {
      const first = api.rect(ctx, 300, 300, 50, 100),
        second = { x: 400, y: 300, width: 50, height: 100 };
      api.connect(ctx, api.groupBounds(first, second), api.circle(ctx, 700, 350, 40));
    }).some((issue) => issue.type === 'missing-attachment' && issue.member === 1),
  );
});

test('visible connectors reject invisible nodes and recycled IDs from previous frames', () => {
  assert.ok(
    paintedIssues((ctx, scene, state, api) => {
      ctx.save();
      ctx.globalAlpha = 0;
      const source = api.rect(ctx, 300, 300, 100, 100);
      ctx.restore();
      api.connect(ctx, source, api.circle(ctx, 700, 350, 40));
    }).some((issue) => issue.type === 'missing-attachment' && issue.end === 'from'),
  );
  assert.deepEqual(
    paintedIssues((ctx, scene, state, api) => {
      ctx.save();
      ctx.globalAlpha = 0;
      api.connect(ctx, api.rect(ctx, 300, 300, 100, 100), api.circle(ctx, 700, 350, 40));
      ctx.restore();
    }),
    [],
  );
  let previous;
  paintedIssues((ctx, scene, state, api) => {
    previous = api.rect(ctx, 300, 300, 100, 100);
  });
  assert.ok(
    paintedIssues((ctx, scene, state, api) => {
      const target = api.circle(ctx, 700, 350, 40);
      api.connect(ctx, previous, target);
    }).some((issue) => issue.type === 'missing-attachment' && issue.end === 'from'),
  );
});

test('painted group envelopes retain their coordinate space through rotation and scaling', () => {
  const attachmentIssues = (draw) =>
    paintedIssues(draw).filter(
      (issue) => issue.type.includes('attachment') || issue.type.includes('group-geometry'),
    );
  assert.deepEqual(
    attachmentIssues((ctx, scene, state, api) => {
      ctx.save();
      ctx.translate(480, 300);
      ctx.rotate(Math.PI / 4);
      const a = api.rect(ctx, -180, -100, 50, 50),
        b = api.rect(ctx, 100, 100, 50, 50);
      api.connect(ctx, api.groupBounds(a, b), api.circle(ctx, 300, -100, 40), { gap: 10 });
      ctx.restore();
    }),
    [],
  );
  assert.deepEqual(
    attachmentIssues((ctx, scene, state, api) => {
      ctx.save();
      ctx.translate(650, 350);
      ctx.rotate(0.6);
      ctx.scale(1.4, 0.7);
      const a = api.circle(ctx, -120, -80, 30),
        b = api.circle(ctx, 70, 100, 20);
      const group = api.groupBounds(api.groupBounds(a), b);
      api.connect(ctx, group, api.circle(ctx, 280, -100, 35), { gap: 10 });
      ctx.restore();
    }),
    [],
  );
  assert.ok(
    paintedIssues((ctx, scene, state, api) => {
      ctx.save();
      ctx.translate(480, 300);
      ctx.rotate(Math.PI / 4);
      const a = api.rect(ctx, -180, -100, 50, 50),
        b = { x: 100, y: 100, width: 50, height: 50 };
      api.connect(ctx, api.groupBounds(a, b), api.circle(ctx, 300, -100, 40), { gap: 10 });
      Object.assign(b, api.rect(ctx, 160, 100, 50, 50));
      ctx.restore();
    }).some((issue) => issue.type === 'stale-group-geometry' && issue.end === 'from'),
  );
});
