import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { anchor, groupBounds, drawFrame, math, drawingCacheStats, arrow } from '../lib/scene.mjs';
import { renderMathSvg } from 'vizmatic';
import { layoutIssues } from '../lib/frame-audit.mjs';

function frame(draw, opacity = 1) {
  const canvas = createCanvas(960, 540);
  const result = drawFrame(
    canvas.getContext('2d'),
    {},
    { title: 'Geometry' },
    { t: 1, duration: 10, opacity },
    draw,
  );
  return { canvas, result };
}

test('the first Canvas scene opens at full opacity after the logo for either lesson setting', () => {
  const first = { id: 'first', title: 'Input' };
  const second = { id: 'second', title: 'Output' };
  const sample = (opening, scene, t = 0) => {
    const canvas = createCanvas(192, 108);
    const ctx = canvas.getContext('2d');
    drawFrame(
      ctx,
      { opening, scenes: [first, second] },
      scene,
      { t, duration: 4, opacity: 0 },
      (p) => {
        p.fillStyle = '#ff0000';
        p.fillRect(500, 500, 100, 100);
      },
    );
    return [...ctx.getImageData(55, 55, 1, 1).data];
  };
  const red = [255, 0, 0, 255];
  for (const opening of [undefined, 'lesson']) {
    assert.deepEqual(sample(opening, first), red);
    assert.notDeepEqual(sample(opening, second), red);
    assert.notDeepEqual(sample(opening, first, 4), red);
  }
});

test('Vizmatic cards preserve primitive pixels, checked geometry, and connector attachments', () => {
  const render = (reusable) =>
    frame((ctx, scene, state, api) => {
      const card = (label, x) => {
        if (reusable)
          return api.components.card({
            label,
            x,
            y: 300,
            width: 240,
            height: 90,
            fill: api.C.panel,
            stroke: api.C.cyan,
            radius: 16,
            fontSize: 30,
            textColor: api.C.ink,
            padding: 12,
          });
        const shape = api.rect(ctx, x, 300, 240, 90, api.C.panel, api.C.cyan, 16);
        api.container(
          ctx,
          shape,
          () => api.text(ctx, label, x + 120, 355.2, 30, api.C.ink, 'center'),
          { padding: 12 },
        );
        return shape;
      };
      const a = card('Birds', 300),
        b = card('sing', 850);
      api.connect(ctx, a, b, { gap: 12 });
    }, 0.6);
  const primitive = render(false),
    reusable = render(true);
  assert.deepEqual(reusable.canvas.data(), primitive.canvas.data());
  assert.deepEqual(reusable.result, primitive.result);
  assert.equal(reusable.result.connectors[0].sourceRef.auditId, 0);
  assert.equal(reusable.result.connectors[0].targetRef.auditId, 1);
  assert.deepEqual(layoutIssues(reusable.result), []);
});

test('Vizmatic component scopes expose crowded text and escaping children to layout checks', () => {
  const { result } = frame((ctx, scene, state, api) => {
    api.components.card({
      x: 300,
      y: 300,
      width: 100,
      height: 80,
      label: 'far too wide for this card',
      id: 'crowded',
    });
    api.components.panel({ x: 800, y: 300, width: 200, height: 140, id: 'escaped' }, () => {
      api.circle(ctx, 990, 400, 40, api.C.cyan);
    });
  });
  assert.ok(
    result.issues.some((issue) => issue.type === 'label-overflow' && issue.group === 'crowded'),
  );
  assert.ok(
    layoutIssues(result).some(
      (issue) => issue.type === 'shape-overflow' && issue.group === 'escaped',
    ),
  );
});

test('Vizmatic panel and fade callbacks keep raw paint detection active', () => {
  const { result } = frame((ctx, scene, state, api) => {
    api.components.panel({ x: 300, y: 300, width: 400, height: 200 }, () =>
      ctx.fillRect(320, 320, 20, 20),
    );
    api.components.fade(0.5, () => ctx.canvas.getContext('2d').strokeRect(320, 320, 20, 20));
    api.components.card({ x: 900, y: 300, width: 200, height: 80, label: 'tracked' });
  });
  assert.deepEqual(
    result.issues.filter((issue) => issue.type === 'untracked-paint').map((issue) => issue.method),
    ['fillRect', 'strokeRect'],
  );
  assert.equal(result.labels.filter((item) => item.text === 'tracked').length, 1);
});

test('Vizmatic hidden cards retain anchors and failed callbacks restore the drawing state', () => {
  let hidden;
  const { result } = frame((ctx, scene, state, api) => {
    hidden = api.components.card({
      x: 300,
      y: 300,
      width: 240,
      height: 90,
      label: 'future',
      opacity: 0,
    });
    ctx.translate(10, 20);
    const transform = ctx.getTransform(),
      alpha = ctx.globalAlpha;
    assert.throws(
      () =>
        api.components.panel({ x: 600, y: 300, width: 240, height: 90, opacity: 0.3 }, () => {
          ctx.translate(200, 200);
          throw new Error('component failure');
        }),
      /component failure/,
    );
    assert.deepEqual(ctx.getTransform(), transform);
    assert.equal(ctx.globalAlpha, alpha);
    api.components.card({ x: 1100, y: 300, width: 240, height: 90, label: 'next' });
  });
  assert.deepEqual(anchor(hidden, { x: 900, y: 345 }), { x: 540, y: 345 });
  assert.equal(
    result.labels.some((item) => item.text === 'future'),
    false,
  );
  assert.equal(result.labels.find((item) => item.text === 'next').alpha, 1);
  assert.deepEqual(result.issues, []);
});

test('out-of-range component opacity clamps before reaching native Canvas state', () => {
  let hidden;
  const { result } = frame((ctx, scene, state, api) => {
    hidden = api.components.card({
      x: 300,
      y: 300,
      width: 240,
      height: 90,
      label: 'hidden',
      opacity: -1,
    });
    api.components.card({ x: 600, y: 300, width: 240, height: 90, label: 'visible', opacity: 2 });
    api.components.card({
      x: 900,
      y: 300,
      width: 240,
      height: 90,
      label: 'hidden text',
      labelOpacity: -1,
    });
    api.components.fade(-1, () => {
      throw new Error('hidden fade ran');
    });
  });
  assert.equal(hidden.width, 240);
  assert.deepEqual(
    result.labels.map((item) => item.text),
    ['Geometry', 'visible'],
  );
  assert.equal(result.labels.at(-1).alpha, 1);
  assert.equal(result.shapes.length, 2);
  assert.ok(result.shapes.every((shape) => shape.alpha === 1));
  assert.deepEqual(result.issues, []);
});

test('teaching plots and flow graphs retain checked paths, labels, and live connector geometry', () => {
  const { result } = frame((ctx, scene, state, api) => {
    const plot = api.teaching.axes({
      x: 300,
      y: 300,
      width: 500,
      height: 300,
      xDomain: [-1, 1],
      yDomain: [-1, 1],
      xTicks: [-1, 0, 1],
      yTicks: [-1, 0, 1],
      xLabel: 'input',
      yLabel: 'output',
      color: api.C.muted,
    });
    api.teaching.curve({
      plot,
      points: [
        { x: -2, y: -2 },
        { x: 2, y: 2 },
      ],
      color: api.C.blue,
    });
    api.teaching.scatter({ plot, points: [{ x: 0.2, y: 0.2 }], color: api.C.cyan });
    const graph = api.teaching.flowGraph({
      fill: api.C.panel,
      textColor: api.C.ink,
      nodes: [
        { id: 'a', label: 'input', x: 1000, y: 300, width: 240, height: 90 },
        { id: 'b', label: 'output', x: 1400, y: 300, width: 240, height: 90 },
      ],
      edges: [{ from: 'a', to: 'b', gap: 12 }],
    });
    assert.equal(graph.nodes.a.auditId, 1);
  });
  assert.equal(result.paths.length, 1);
  assert.ok(result.paths[0].clip);
  const connection = result.connectors.find((item) => item.kind === 'connect');
  assert.equal(connection.sourceRef.auditId, 1);
  assert.equal(connection.targetRef.auditId, 2);
  assert.ok(result.labels.some((item) => item.text === 'input'));
  assert.deepEqual(layoutIssues(result), []);
});

test('connection anchors follow rectangular and circular edges and requested gaps', () => {
  const box = { x: 0, y: 0, width: 200, height: 100 },
    circle = { x: 400, y: 50, r: 40 };
  assert.deepEqual(anchor(box, circle, 10), { x: 210, y: 50 });
  assert.deepEqual(anchor(circle, box, 10), { x: 350, y: 50 });
  assert.deepEqual(anchor({ x: 0, y: 0, w: 100, h: 50 }, { x: 300, y: 125 }), { x: 100, y: 45 });
  assert.deepEqual(groupBounds(box, circle), { x: 0, y: 0, width: 440, height: 100 });
  assert.throws(() => groupBounds(), /at least one shape/);
});

test('the frame audit tracks transformed shapes and anchored connector endpoints with composed alpha', () => {
  let endpoints;
  const { result } = frame((ctx, scene, state, api) => {
    ctx.save();
    ctx.translate(100, 200);
    ctx.scale(0.5, 0.5);
    ctx.globalAlpha *= 0.5;
    const source = api.rect(ctx, 0, 0, 100, 100, api.C.panel, api.C.cyan);
    const target = api.circle(ctx, 300, 50, 50, api.C.panel, api.C.cyan);
    endpoints = api.connect(ctx, source, target, { gap: 10, width: 4 });
    api.text(ctx, 'visible', 0, 50, 20, 'rgba(255, 0, 0, 0.25)');
    ctx.restore();
  }, 0.8);
  assert.deepEqual(endpoints, { from: { x: 110, y: 50 }, to: { x: 240, y: 50 } });
  assert.equal(result.shapes.length, 2);
  assert.deepEqual(result.connectors[0].from, { x: 155, y: 225 });
  assert.deepEqual(result.connectors[0].to, { x: 220, y: 225 });
  assert.equal(result.connectors[0].kind, 'connect');
  assert.equal(result.connectors[0].sourceId, 0);
  assert.equal(result.connectors[0].targetId, 1);
  assert.equal(result.connectors[0].alpha, 0.4);
  assert.equal(result.connectors[0].strokeWidth, 2);
  const label = result.labels.find((item) => item.text === 'visible');
  assert.equal(label.alpha, 0.1);
  assert.equal(label.fontSize, 10);
});

test('fully transparent future geometry does not produce visible labels, connectors, or violations', () => {
  const { result } = frame((ctx, scene, state, api) => {
    ctx.save();
    ctx.globalAlpha = 0;
    api.text(ctx, String.raw`\frac{x}{y}`, 3000, 3000);
    api.rect(ctx, 3000, 3000, 100, 100);
    api.arrow(ctx, 3000, 3000, 4000, 4000);
    ctx.restore();
    api.text(ctx, 'transparent', 3000, 3000, 30, '#ffffff00');
    api.circle(ctx, 3000, 3000, 30, 'transparent');
  });
  assert.deepEqual(
    result.labels.map((item) => item.text),
    ['Geometry'],
  );
  assert.deepEqual(result.shapes, []);
  assert.deepEqual(result.connectors, []);
  assert.deepEqual(result.issues, []);
});

test('opt-in card scopes catch crowded labels while unscoped plot annotations remain unrestricted', () => {
  const { result } = frame((ctx, scene, state, api) => {
    api.labelScope(
      ctx,
      { x: 200, y: 200, width: 100, height: 100 },
      () => {
        api.text(ctx, 'too wide for this card', 210, 240, 30);
        api.text(ctx, 'overlap', 210, 240, 30);
      },
      { id: 'card', padding: 10 },
    );
    api.text(ctx, 'axis', 800, 400, 30);
    api.text(ctx, 'axis', 800, 400, 30);
    api.labelScope(
      ctx,
      { x: 1000, y: 200, width: 500, height: 100 },
      () => {
        api.text(ctx, 'intentional overlay', 1020, 240, 30);
        api.text(ctx, 'intentional overlay', 1020, 240, 30);
      },
      { id: 'overlay', allowOverlap: true },
    );
  });
  assert.ok(
    result.issues.some((issue) => issue.type === 'label-overflow' && issue.group === 'card'),
  );
  assert.equal(result.issues.filter((issue) => issue.type === 'label-overlap').length, 1);
  assert.ok(result.issues.every((issue) => issue.group === 'card'));
});

test('zero-length arrows paint no geometry and failed painters restore the frame context', () => {
  const { result } = frame((ctx, scene, state, api) => api.arrow(ctx, 100, 100, 100, 100));
  assert.deepEqual(result.connectors, []);
  const canvas = createCanvas(960, 540),
    ctx = canvas.getContext('2d');
  ctx.translate(12, 14);
  ctx.globalAlpha = 0.5;
  const before = ctx.getTransform();
  assert.throws(
    () =>
      drawFrame(ctx, {}, { title: 'Failure' }, { t: 1, duration: 2, opacity: 1 }, () => {
        throw new Error('paint failure');
      }),
    /paint failure/,
  );
  assert.deepEqual(ctx.getTransform(), before);
  assert.ok(Math.abs(ctx.globalAlpha - 0.5) <= 1 / 255);
  const next = drawFrame(ctx, {}, { title: 'Next' }, { t: 1, duration: 2, opacity: 1 }, () => {});
  assert.equal(next.issues.length, 0);
});

test('arrowheads stay wider than their shafts and taper to a triangular tip', () => {
  for (const width of [3, 6, 12])
    for (const length of [20, 24, 40, 120])
      for (let direction = 0; direction < 8; direction++) {
        const angle = (direction * Math.PI) / 4,
          ux = Math.cos(angle),
          uy = Math.sin(angle);
        const tip = { x: 150 + (length * ux) / 2, y: 150 + (length * uy) / 2 };
        const ctx = createCanvas(320, 320).getContext('2d');
        arrow(ctx, 150 - (length * ux) / 2, 150 - (length * uy) / 2, tip.x, tip.y, '#fff', width);
        const pixels = ctx.getImageData(0, 0, 320, 320).data;
        let painted = 0,
          shaftHalfWidth = 0,
          headHalfWidth = 0,
          tipHalfWidth = 0;
        for (let y = 0; y < 320; y++)
          for (let x = 0; x < 320; x++) {
            if (pixels[(y * 320 + x) * 4 + 3] < 8) continue;
            painted++;
            const dx = x + 0.5 - tip.x,
              dy = y + 0.5 - tip.y;
            const ahead = dx * ux + dy * uy,
              across = Math.abs(-dx * uy + dy * ux);
            assert(
              ahead <= 1,
              `Paint extends past arrow tip: width ${width}, length ${length}, direction ${direction}`,
            );
            if (ahead >= -length * 0.9 && ahead <= -length * 0.8)
              shaftHalfWidth = Math.max(shaftHalfWidth, across);
            if (ahead >= -length * 0.7 && ahead <= 0)
              headHalfWidth = Math.max(headHalfWidth, across);
            if (ahead >= -1.5 && ahead <= 0) tipHalfWidth = Math.max(tipHalfWidth, across);
          }
        assert(painted > 0, 'The arrow must remain visible');
        assert(shaftHalfWidth > 0, 'The shaft must remain visible');
        assert(
          headHalfWidth >= shaftHalfWidth * 1.6,
          `The head must be wider than the shaft: width ${width}, length ${length}, direction ${direction}`,
        );
        assert(tipHalfWidth < headHalfWidth * 0.7, 'The head must narrow to its pointed apex');
      }
});

test('faded arrows keep uniform opacity across the shaft and head join', () => {
  const ctx = createCanvas(180, 120).getContext('2d');
  ctx.globalAlpha = 0.5;
  arrow(ctx, 20, 60, 140, 60, '#fff', 6);
  for (let x = 118; x < 135; x++) {
    assert(Math.abs(ctx.getImageData(x, 59, 1, 1).data[3] - 128) <= 1);
  }
});

test('paths retain clip geometry, paint order, and container ancestry', () => {
  const { result } = frame((ctx, scene, state, api) => {
    api.container(
      ctx,
      { x: 300, y: 300, width: 400, height: 200 },
      () => {
        ctx.save();
        ctx.translate(300, 300);
        ctx.scale(2, 1);
        api.path(
          ctx,
          [
            { x: -100, y: 50 },
            { x: 300, y: 50 },
          ],
          {
            color: api.C.cyan,
            width: 4,
            clip: { x: 0, y: 0, width: 200, height: 200 },
            id: 'clipped-curve',
          },
        );
        api.circle(ctx, 100, 100, 20, api.C.panel, api.C.cyan);
        ctx.restore();
      },
      { id: 'plot', padding: 0 },
    );
  });
  assert.equal(result.groups[0].kind, 'container');
  assert.equal(result.paths[0].id, 'clipped-curve');
  assert.deepEqual(result.paths[0].groups, [0]);
  assert.deepEqual(result.paths[0].points, [
    { x: 100, y: 350 },
    { x: 900, y: 350 },
  ]);
  assert.equal(result.paths[0].clip.width, 400);
  assert.deepEqual(result.shapes[0].center, { x: 500, y: 400 });
  assert.deepEqual(result.shapes[0].axisX, { x: 40, y: 0 });
  assert.deepEqual(result.shapes[0].axisY, { x: 0, y: 20 });
  assert.ok(result.paths[0].order < result.shapes[0].order);
});

test('raw paint cannot bypass auditing through a container callback', () => {
  const { result } = frame((ctx, scene, state, api) => {
    api.container(ctx, { x: 300, y: 300, width: 400, height: 200 }, () => {
      ctx.beginPath();
      ctx.moveTo(310, 310);
      ctx.lineTo(350, 350);
      ctx.stroke();
      api.path(ctx, [
        { x: 320, y: 320 },
        { x: 360, y: 360 },
      ]);
      api.text(ctx, 'tracked', 330, 400, 24);
    });
  });
  assert.equal(result.issues.filter((issue) => issue.type === 'untracked-paint').length, 1);
  assert.equal(result.issues.find((issue) => issue.type === 'untracked-paint').method, 'stroke');
  assert.equal(result.paths.length, 1);
});

test('glyph masks remain available to audit code without bloating JSON evidence', () => {
  const { result } = frame((ctx, scene, state, api) =>
    api.math(ctx, String.raw`\frac{x^2}{y}`, 300, 400, 60),
  );
  const label = result.labels.find((item) => item.kind === 'math');
  assert.ok(label.ink.data instanceof Uint8Array);
  const serialized = JSON.stringify(result);
  assert.ok(serialized.length < 4000);
  assert.equal(JSON.parse(serialized).labels.find((item) => item.kind === 'math').ink, undefined);
});

test('clears, context reacquisition, and canvas resizing cannot bypass paint tracking', () => {
  let width;
  const { result, canvas } = frame((ctx, scene, state, api) => {
    ctx.clearRect(300, 300, 10, 10);
    ctx.canvas.getContext('2d').fillRect(320, 300, 10, 10);
    width = ctx.canvas.width;
    ctx.canvas.width = 100;
    api.rect(ctx, 350, 300, 20, 20);
  });
  assert.deepEqual(
    result.issues.filter((issue) => issue.type === 'untracked-paint').map((issue) => issue.method),
    ['clearRect', 'fillRect', 'canvas.width='],
  );
  assert.equal(canvas.width, width);
  assert.equal(result.shapes.length, 1);
});

test('rounded path clips paint the same rounded boundary recorded by the audit', () => {
  const { canvas, result } = frame((ctx, scene, state, api) =>
    api.path(
      ctx,
      [
        { x: 250, y: 250 },
        { x: 450, y: 250 },
        { x: 450, y: 450 },
        { x: 250, y: 450 },
      ],
      {
        fill: api.C.red,
        width: 0,
        closed: true,
        clip: { x: 300, y: 300, width: 100, height: 100, radius: 40 },
      },
    ),
  );
  const ctx = canvas.getContext('2d');
  assert.ok(ctx.getImageData(151, 151, 1, 1).data[0] < 100);
  assert.ok(ctx.getImageData(175, 175, 1, 1).data[0] > 220);
  assert.ok(result.paths[0].clip.points.length > 4);
});

test('drawing caches evict by bytes and an oversized formula still paints uncached', () => {
  const before = drawingCacheStats();
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  for (let i = 0; i < 24; i++) math(ctx, `x+x+x+x+x+x+x+${i}`, 10, 150, 140);
  frame((ctx, scene, state, api) => {
    for (let i = 0; i < 32; i++)
      api.text(ctx, `${'Wide glyph sample '.repeat(12)} ${i}`, 20, 400, 60);
  });
  const bounded = drawingCacheStats();
  assert.ok(bounded.math.bytes <= bounded.math.limit);
  assert.ok(bounded.text.bytes <= bounded.text.limit);
  assert.ok(bounded.math.evictions > before.math.evictions);
  assert.ok(bounded.text.evictions > before.text.evictions);

  const tex = 'x+x+x+x+x+x+x',
    metrics = renderMathSvg(tex, { fontSize: 200 });
  const scale = Math.sqrt((bounded.math.limit * 1.2) / (metrics.width * metrics.height * 5));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(scale, scale);
  math(ctx, tex, 10, 150, 200);
  ctx.restore();
  assert.deepEqual(drawingCacheStats().math, bounded.math);
  assert.ok(
    ctx
      .getImageData(0, 0, canvas.width, canvas.height)
      .data.some((value, i) => i % 4 === 3 && value > 0),
  );
});

test('connector and group member references stay live without entering JSON evidence', () => {
  let source, target, group;
  const { result } = frame((ctx, scene, state, api) => {
    source = { x: 300, y: 300, width: 100, height: 100 };
    target = { x: 700, y: 350, r: 40 };
    group = api.groupBounds(source);
    api.connect(ctx, group, target);
    Object.assign(source, api.rect(ctx, 300, 300, 100, 100));
    Object.assign(target, api.circle(ctx, 700, 350, 40));
  });
  assert.equal(group.memberRefs[0], source);
  assert.equal(result.connectors[0].sourceRef, group);
  assert.equal(result.connectors[0].targetRef, target);
  assert.equal(Object.keys(group).includes('memberRefs'), false);
  assert.equal(JSON.parse(JSON.stringify(result)).connectors[0].sourceRef, undefined);
});
