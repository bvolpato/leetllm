import test from 'node:test';
import assert from 'node:assert/strict';
import {
  code,
  liftDrawingHelpers,
  specializeScene,
  simplifyUnreachableIfTests,
  statements,
  program,
} from '../tools/lib/pilot-module-extraction.mjs';

async function moduleFrom(nodes) {
  return import(
    'data:text/javascript;base64,' + Buffer.from(code(program(nodes))).toString('base64')
  );
}

const receiver = () => {
  const calls = [];
  return {
    calls,
    api: {
      C: { ink: 'black' },
      text(...args) {
        calls.push(args.slice(1));
      },
      focus: {
        target(id, paint) {
          calls.push(['target', id]);
          paint();
        },
      },
    },
  };
};

test('public stage facades preserve forwarded identities and unmatched no-op behavior', async () => {
  const { publicStageDrawFacade } = await import('../tools/lib/pilot-module-extraction.mjs');
  const painter = statements(`function drawChapter(ctx,scene,state,api){
    const callback=()=>{return true;};
    if(scene.id==='one'||scene.id==='two')api.text(ctx,state.value,callback());
  }`)[0];
  const facade = publicStageDrawFacade(painter, ['one', 'two']);
  const original = await moduleFrom([
    { type: 'ExportNamedDeclaration', declaration: painter, specifiers: [], source: null },
  ]);
  const migrated = await moduleFrom([
    ...statements(
      `export const forwarded=[];const definition={draw(...args){forwarded.push(args);args[3].text(args[0],args[2].value,true);}};`,
    ),
    facade,
  ]);
  for (const id of ['one', 'two', 'legacy', 'unknown']) {
    const ctx = {},
      scene = { id },
      state = { value: 17 },
      a = receiver(),
      b = receiver();
    assert.equal(original.drawChapter(ctx, scene, state, a.api), undefined);
    assert.equal(migrated.drawChapter(ctx, scene, state, b.api), undefined);
    assert.deepEqual(b.calls, a.calls);
    if (['one', 'two'].includes(id))
      assert.deepEqual(migrated.forwarded.at(-1), [ctx, scene, state, b.api]);
  }
  assert.equal(migrated.forwarded.length, 2);
  for (const body of ['return true;', 'throw Error("unknown");'])
    assert.throws(
      () =>
        publicStageDrawFacade(statements(`function drawChapter(ctx,scene,state,api){${body}}`)[0], [
          'one',
        ]),
      /explicit painter return or throw/,
    );
  assert.throws(() => publicStageDrawFacade(painter, ['one', 'one']), /unique stage IDs/);
});

test('scene specialization preserves shared-case construction and measured progress', async () => {
  const nodes = statements(
    `export function draw(ctx,scene,state,api){switch(scene.id){case 'left':case 'right':{const amount=scene.id==='right'?state.progress*2:state.progress;api.text(ctx,amount);break;}case 'other':api.text(ctx,99);break;default:throw Error('unknown');}}`,
  );
  const original = await moduleFrom(nodes);
  for (const id of ['left', 'right', 'other']) {
    const migrated = await moduleFrom(specializeScene(nodes, id));
    for (const progress of [0, 0.2, 0.5, 1]) {
      const before = receiver(),
        after = receiver();
      original.draw({}, { id }, { progress }, before.api);
      migrated.draw({}, { id }, { progress }, after.api);
      assert.deepEqual(after.calls, before.calls);
    }
  }
});

test('nested Boolean selection preserves dynamic operands and short-circuit effects', async () => {
  const nodes = statements(`export function draw(ctx,scene,state,api){
    const caching=scene.id==='cache';
    const b=state.beat;
    const P=id=>api.progress(id);
    api.text(ctx,caching&&(b>0||P('context-cached')>0));
    api.text(ctx,caching&&(state.left||api.read('fallback')));
    api.text(ctx,false&&(state.left||api.read('never')));
    api.text(ctx,false||(state.left&&api.read('and')));
    api.text(ctx,caching&&(state.left||(state.middle&&api.read('nested'))));
  }`);
  const original = await moduleFrom(nodes);
  const makeReceiver = (progress) => {
    const result = receiver();
    result.api.progress = (id) => {
      result.calls.push(['progress', id]);
      return progress;
    };
    result.api.read = (id) => {
      result.calls.push(['read', id]);
      return `${id}-value`;
    };
    return result;
  };
  for (const id of ['cache', 'inactive']) {
    const migrated = await moduleFrom(
      specializeScene(nodes, id, {
        foldBooleanIdentities: true,
        preserveNumericLocals: true,
      }),
    );
    for (const beat of [0, 1])
      for (const progress of [0.7, 0])
        for (const left of [false, 0, undefined, 'already-cached'])
          for (const middle of [false, true]) {
            const state = { beat, left, middle };
            const before = makeReceiver(progress),
              after = makeReceiver(progress);
            original.draw({}, { id }, state, before.api);
            migrated.draw({}, { id }, state, after.api);
            assert.deepEqual(after.calls, before.calls, JSON.stringify({ id, ...state, progress }));
          }
  }
});

test('IF-only cleanup retains getter order, throws, alternatives and short-circuit reads', async () => {
  const source = statements(`export function run(input,api){
    if(input.cues&&false)api.record('never');else api.record('else');
    if(input.cues&&true)api.record('truthy');
    if((input.left&&input.right)&&false)api.record('nested-never');
    if(input.cues&&false){function nested(){var local;}api.record('never');}
    return input.answer;
  }`);
  const original = await moduleFrom(source),
    migrated = await moduleFrom(simplifyUnreachableIfTests(source));
  const observe = (run, value, throwAt = -1) => {
    const events = [];
    let reads = 0;
    const input = Object.defineProperties(
      {},
      Object.fromEntries(
        ['cues', 'left', 'right', 'answer'].map((key) => [
          key,
          {
            get() {
              events.push(key);
              if (++reads === throwAt) throw new Error(`read ${key}`);
              return key === 'answer' ? 7 : value;
            },
          },
        ]),
      ),
    );
    let result, error;
    try {
      result = run(input, { record: (name) => events.push(name) });
    } catch (e) {
      error = e.message;
    }
    return { events, result, error };
  };
  for (const value of [false, true, 0, null, undefined, 'ready', {}])
    for (const throwAt of [-1, 1, 2, 3, 4, 5, 6])
      assert.deepEqual(
        observe(migrated.run, value, throwAt),
        observe(original.run, value, throwAt),
      );
  const lostEvaluation = await moduleFrom(
    statements(`export function run(input,api){api.record('else');
      if(input.cues)api.record('truthy');return input.answer;}`),
  );
  assert.notDeepEqual(observe(lostEvaluation.run, true), observe(original.run, true));
});

test('IF cleanup preserves unreachable var bindings and ordinary expression values', async () => {
  const source = statements(`const leaked='outer';export function run(input){
    const before=typeof leaked;
    if(input.cues&&false){var leaked='unreachable';}
    const value=input.value&&true;
    return [before,typeof leaked,value];
  }`);
  const original = await moduleFrom(source),
    migrated = await moduleFrom(simplifyUnreachableIfTests(source));
  for (const value of [0, null, undefined, 'truthy', {}]) {
    const input = { cues: true, value };
    assert.deepEqual(migrated.run(input), original.run(input));
    assert.deepEqual(migrated.run(input).slice(0, 2), ['undefined', 'undefined']);
  }
});

test('lifting drawing defaults preserves explicit arguments, defaults and nested helper calls', async () => {
  const source = statements(
    `function draw(ctx,scene,state,api){const {C}=api;const text=(value,x,color=C.ink)=>api.text(ctx,value,x,color);const footer=value=>text(value,10);api.focus.target('readout',()=>footer(state.value));}`,
  )[0];
  const { draw, helpers } = liftDrawingHelpers(source, { text: 'drawText', footer: 'drawFooter' });
  const original = await moduleFrom([
    { type: 'ExportNamedDeclaration', declaration: source, specifiers: [], source: null },
  ]);
  const migrated = await moduleFrom([
    ...helpers,
    { type: 'ExportNamedDeclaration', declaration: draw, specifiers: [], source: null },
  ]);
  const before = receiver(),
    after = receiver();
  original.draw({}, { id: 'one' }, { value: 'pending' }, before.api);
  migrated.draw({}, { id: 'one' }, { value: 'pending' }, after.api);
  assert.deepEqual(after.calls, before.calls);
});

test('a helper escaping as a value is rejected instead of silently changing its closure', () => {
  const source = statements(
    `function draw(ctx,scene,state,api){const text=value=>api.text(ctx,value);return [text];}`,
  )[0];
  assert.throws(() => liftDrawingHelpers(source, { text: 'drawText' }), /escapes its direct calls/);
});

test('readable local names avoid capturing nested parameters or color tables', async () => {
  const { clarifyStageLocals } = await import('../tools/lib/pilot-module-extraction.mjs');
  const nodes = statements(
    `export function draw(ctx,scene,state,api){const {C}=api,b=state.beat,p=state.progress;const done=(id,currentBeat)=>b>currentBeat;const themeColors=[C.ink];api.text(ctx,done('x',1),themeColors[0],p);}`,
  );
  const before = await moduleFrom(nodes),
    after = await moduleFrom(clarifyStageLocals(nodes));
  for (const beat of [0, 2]) {
    const a = receiver(),
      b = receiver();
    before.draw({}, {}, { beat, progress: 0.3 }, a.api);
    after.draw({}, {}, { beat, progress: 0.3 }, b.api);
    assert.deepEqual(b.calls, a.calls);
  }
});

test('fixture factories preserve ordered updates and isolate repeated construction', async () => {
  const { createFixtureBuilder } = await import('../tools/lib/pilot-module-extraction.mjs');
  const source = statements(
    `const steps=[];let weight=1;for(const gradient of [2,-1,3]){weight-=.1*gradient;steps.push(weight);}`,
  );
  const [builder, capture] = createFixtureBuilder('buildFit', source, ['steps', 'weight']);
  const migrated = await moduleFrom([
    { type: 'ExportNamedDeclaration', declaration: builder, specifiers: [], source: null },
    capture,
  ]);
  const first = migrated.buildFit(),
    second = migrated.buildFit();
  assert.deepEqual(first, { steps: [0.8, 0.9, 0.6], weight: 0.6 });
  assert.deepEqual(second, first);
  assert.notEqual(first.steps, second.steps);
  first.steps.push(99);
  assert.equal(migrated.buildFit().steps.length, 3);
});

test('scene specialization preserves callback, local and nested-draw shadows', async () => {
  const nodes = statements(`export function draw(ctx,scene,state,api){
    const callback=[{id:'callback'}].map(scene=>scene.id)[0];
    function local(){const scene={id:'local'};return scene.id;}
    function nested(ctx,scene,state,api){return scene.id;}
    const captured=[0].map(()=>scene.id)[0];
    api.text(ctx,scene.id,callback,local(),nested(ctx,{id:'nested'},state,api),captured);
  }`);
  const original = await moduleFrom(nodes);
  for (const id of ['first', 'second']) {
    const migrated = await moduleFrom(specializeScene(nodes, id));
    const a = receiver(),
      b = receiver();
    original.draw({}, { id }, {}, a.api);
    migrated.draw({}, { id }, {}, b.api);
    assert.deepEqual(b.calls, a.calls);
    assert.deepEqual(b.calls[0], [id, 'callback', 'local', 'nested', id]);
  }
});

test('three-argument painters retain state/API positions and captured scene bindings', async () => {
  const { adaptStageSignature } = await import('../tools/lib/pilot-module-extraction.mjs');
  const nodes = statements(
    `const scene={label:'retained'};export function painter(ctx,state,api){api.text(ctx,state.value,scene.label);}`,
  );
  const original = await moduleFrom(nodes);
  const adapted = structuredClone(nodes);
  adapted[1].declaration = adaptStageSignature(adapted[1].declaration, 'ctx-state-api');
  const migrated = await moduleFrom(adapted),
    a = receiver(),
    b = receiver();
  original.painter({}, { value: 17 }, a.api);
  migrated.painter({}, { id: 'metadata' }, { value: 17 }, b.api);
  assert.deepEqual(b.calls, a.calls);
  for (const source of [
    'function painter(ctx,state,api){return arguments[1];}',
    'function painter(ctx,state,api){return this.value;}',
  ])
    assert.throws(
      () => adaptStageSignature(statements(source)[0], 'ctx-state-api'),
      /dependent painters/,
    );
});

test('literal stage strings fold while dynamic coercion retains its execution', async () => {
  const nodes = statements(
    `export function draw(ctx,scene,state,api){let calls=0;const value={toString(){calls++;return 'value';}};api.text(ctx,scene.id+'-mechanism','prefix '+value,calls,.1+.2);}`,
  );
  const original = await moduleFrom(nodes),
    migrated = await moduleFrom(specializeScene(nodes, 'one'));
  const a = receiver(),
    b = receiver();
  original.draw({}, { id: 'one' }, {}, a.api);
  migrated.draw({}, { id: 'one' }, {}, b.api);
  assert.deepEqual(b.calls, a.calls);
  assert.deepEqual(b.calls[0], ['one-mechanism', 'prefix value', 1, 0.1 + 0.2]);
});

test('helper aliases reject lexical captures before generating a painter', async () => {
  const source = statements(
    `function draw(ctx,scene,state,api){const T=value=>api.text(ctx,value);api.focus.target('readout',()=>{T('before');const text='passage';T(text);});}`,
  )[0];
  assert.throws(() => liftDrawingHelpers(source, { T: 'text' }), /alias capture/);
  const lifted = liftDrawingHelpers(source, { T: 'drawText' });
  const original = await moduleFrom([
    { type: 'ExportNamedDeclaration', declaration: source, specifiers: [], source: null },
  ]);
  const migrated = await moduleFrom([
    ...lifted.helpers,
    { type: 'ExportNamedDeclaration', declaration: lifted.draw, specifiers: [], source: null },
  ]);
  const a = receiver(),
    b = receiver();
  original.draw({}, {}, {}, a.api);
  migrated.draw({}, {}, {}, b.api);
  assert.deepEqual(b.calls, a.calls);
});

test('Boolean identities retain unknown numeric values and dynamic evaluation', async () => {
  const nodes = statements(
    `export function draw(ctx,scene,state,api){api.text(ctx,(state.beat===1)||false||false,(!state.other)&&true,state.value||false,state.value&&true);}`,
  );
  const original = await moduleFrom(nodes),
    migrated = await moduleFrom(specializeScene(nodes, 'one'));
  for (const state of [
    { beat: 1, other: 0, value: 1 },
    { beat: 2, other: 5, value: 0 },
  ]) {
    const a = receiver(),
      b = receiver();
    original.draw({}, {}, state, a.api);
    migrated.draw({}, {}, state, b.api);
    assert.deepEqual(b.calls, a.calls);
  }
});

test('void painter exits keep nested callback returns and leading-probe checks stay exact', async () => {
  const { voidRootBooleanReturns, omitLeadingPainter } =
    await import('../tools/lib/pilot-module-extraction.mjs');
  const source = statements(
    `export function draw(ctx,scene,state,api){const callback=()=>{return true;};api.text(ctx,callback());if(state.value)return true;return false;}`,
  );
  const original = await moduleFrom(source);
  const adjusted = structuredClone(source);
  adjusted[0].declaration = voidRootBooleanReturns(adjusted[0].declaration);
  const migrated = await moduleFrom(adjusted);
  for (const value of [false, true]) {
    const a = receiver(),
      b = receiver();
    original.draw({}, {}, { value }, a.api);
    assert.equal(migrated.draw({}, {}, { value }, b.api), undefined);
    assert.deepEqual(b.calls, a.calls);
    assert.deepEqual(b.calls[0], [true]);
  }
  const valid = statements(
    `function draw(ctx,scene,state,api){if(chapter(ctx,scene,state,api))return;api.text(ctx,state.value);}`,
  )[0];
  const result = omitLeadingPainter(valid, 'chapter');
  const module = await moduleFrom([
    { type: 'ExportNamedDeclaration', declaration: result, specifiers: [], source: null },
  ]);
  const output = receiver();
  module.draw({}, {}, { value: 3 }, output.api);
  assert.deepEqual(output.calls, [[3]]);
  const wrong = statements(
    `function draw(ctx,scene,state,api){if(chapter(ctx,state,scene,api))return;}`,
  )[0];
  assert.throws(() => omitLeadingPainter(wrong, 'chapter'), /exactly match/);
});

test('native pixel comparison respects view offsets and every alpha byte', async () => {
  const { nativePixelsEqual } = await import('../tools/check-pilot-parity.mjs');
  const left = new Uint8ClampedArray([9, 9, 9, 9, 1, 2, 3, 4, 5, 6, 7, 8]);
  const right = new Uint8ClampedArray([0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const context = (bytes) => ({
    getImageData(x, y, width, height) {
      assert.deepEqual([x, y, width, height], [0, 0, 2, 1]);
      return { data: bytes.subarray(4) };
    },
  });
  assert.equal(nativePixelsEqual(context(left), context(right), 2, 1), true);
  right[11] = 0;
  assert.equal(nativePixelsEqual(context(left), context(right), 2, 1), false);
});

test('numeric anchor preservation keeps named coordinates live without changing paints', async () => {
  const nodes = statements(
    `export function draw(ctx,scene,state,api){const start=160,width=1550;api.text(ctx,start+width,state.value);}`,
  );
  const specialized = specializeScene(nodes, 'one', { preserveNumericLocals: true });
  const { default: traverseModule } = await import('@babel/traverse');
  const traverse = traverseModule.default ?? traverseModule;
  let references = 0;
  traverse(program(specialized), {
    ReferencedIdentifier(p) {
      if (['start', 'width'].includes(p.node.name)) references++;
    },
  });
  assert.equal(references, 2);
  const a = receiver(),
    b = receiver(),
    original = await moduleFrom(nodes),
    migrated = await moduleFrom(specialized);
  original.draw({}, {}, { value: 7 }, a.api);
  migrated.draw({}, {}, { value: 7 }, b.api);
  assert.deepEqual(b.calls, a.calls);
});

test('leading painter removal preserves pure declarations and rejects side-effect barriers', async () => {
  const { omitLeadingPainter } = await import('../tools/lib/pilot-module-extraction.mjs');
  const source = statements(
    `function draw(ctx,scene,state,api){const {C}=api,p=api.clamp(state.value),s=x=>x+p;if(chapter(ctx,scene,state,api))return;api.text(ctx,s(2),C.ink);}`,
  )[0];
  const migrated = await moduleFrom([
    {
      type: 'ExportNamedDeclaration',
      declaration: omitLeadingPainter(source, 'chapter'),
      specifiers: [],
      source: null,
    },
  ]);
  const output = receiver();
  output.api.clamp = (x) => x;
  migrated.draw({}, {}, { value: 3 }, output.api);
  assert.deepEqual(output.calls, [[5, 'black']]);
  for (const code of [
    `function draw(ctx,scene,state,api){const p=mutate(state);if(chapter(ctx,scene,state,api))return;}`,
    `function draw(ctx,scene,state,api){notify();if(chapter(ctx,scene,state,api))return;}`,
  ])
    assert.throws(() => omitLeadingPainter(statements(code)[0], 'chapter'), /exactly match/);
});

test('reviewed prefix calls retain arguments and order while rejecting shadows and hidden effects', async () => {
  const { omitLeadingPainter } = await import('../tools/lib/pilot-module-extraction.mjs');
  const nodes = statements(`
    function snapshot(id,state){state.reads.push(id);return {value:state.value};}
    function chapter(ctx,scene,state,api){return false;}
    function draw(ctx,scene,state,api){const value=snapshot(scene.id,state);if(chapter(ctx,scene,state,api))return;api.text(ctx,value.value);}
  `);
  const root = nodes.at(-1);
  assert.throws(() => omitLeadingPainter(root, 'chapter'), /exactly match/);
  const options = { reviewedPurePrefixCalls: ['snapshot'], moduleNodes: nodes };
  const adjusted = omitLeadingPainter(root, 'chapter', options);
  const exported = (declaration) => ({
    type: 'ExportNamedDeclaration',
    declaration,
    specifiers: [],
    source: null,
  });
  const before = await moduleFrom([...nodes.slice(0, -1), exported(root)]);
  const after = await moduleFrom([...nodes.slice(0, -1), exported(adjusted)]);
  for (const value of [0, 9]) {
    const oldState = { value, reads: [] },
      newState = { value, reads: [] },
      a = receiver(),
      b = receiver();
    before.draw({}, { id: 'legacy' }, oldState, a.api);
    after.draw({}, { id: 'legacy' }, newState, b.api);
    assert.deepEqual(b.calls, a.calls);
    assert.deepEqual(newState, oldState);
  }
  for (const source of [
    `function draw(ctx,scene,state,api){const snapshot=()=>0;const x=snapshot();if(chapter(ctx,scene,state,api))return;}`,
    `function draw(ctx,scene,state,api){const x=snapshot(mutate(state));if(chapter(ctx,scene,state,api))return;}`,
    `function draw(ctx,scene,state,api){notify();if(chapter(ctx,scene,state,api))return;}`,
  ])
    assert.throws(
      () => omitLeadingPainter(statements(source)[0], 'chapter', options),
      /immutable module function|exactly match/,
    );
  const reassigned = statements(
    `function snapshot(){} snapshot=other;function chapter(){} function draw(ctx,scene,state,api){const s=snapshot();if(chapter(ctx,scene,state,api))return;}`,
  );
  assert.throws(
    () => omitLeadingPainter(reassigned.at(-1), 'chapter', { ...options, moduleNodes: reassigned }),
    /immutable module function/,
  );
});

test('private literal Set dispatch can be omitted only for an excluded stage without mutation or escape', async () => {
  const { omitLeadingSetDispatch } = await import('../tools/lib/pilot-module-extraction.mjs');
  const source = `const ADDED=new Set(['new']);
    function chapter(ctx,scene,state,api){api.text(ctx,'new');}
    function draw(ctx,scene,state,api){if(ADDED.has(scene.id))return chapter(ctx,scene,state,api);api.text(ctx,state.value);}`;
  const nodes = statements(source),
    root = nodes.at(-1);
  const options = { registry: 'ADDED', painter: 'chapter', sceneId: 'legacy', moduleNodes: nodes };
  const adjusted = omitLeadingSetDispatch(root, options);
  const exported = (declaration) => ({
    type: 'ExportNamedDeclaration',
    declaration,
    specifiers: [],
    source: null,
  });
  const before = await moduleFrom([...nodes.slice(0, -1), exported(root)]);
  const after = await moduleFrom([exported(adjusted)]);
  const a = receiver(),
    b = receiver();
  before.draw({}, { id: 'legacy' }, { value: 17 }, a.api);
  after.draw({}, { id: 'legacy' }, { value: 17 }, b.api);
  assert.deepEqual(b.calls, a.calls);
  assert.throws(
    () => omitLeadingSetDispatch(root, { ...options, sceneId: 'new' }),
    /excluding new/,
  );
  for (const suffix of [
    `ADDED.add('legacy');`,
    `const alias=ADDED;`,
    `export {ADDED};`,
    `ADDED.has=()=>false;`,
  ]) {
    const program = statements(source + suffix);
    assert.throws(
      () => omitLeadingSetDispatch(root, { ...options, moduleNodes: program }),
      /read-only has|private immutable/,
    );
  }
  const exportedSet = statements(source.replace('const ADDED', 'export const ADDED'));
  assert.throws(
    () => omitLeadingSetDispatch(root, { ...options, moduleNodes: exportedSet }),
    /private immutable/,
  );
  for (const changed of [
    source.replace('return chapter(ctx,scene,state,api)', 'return chapter(ctx,state,scene,api)'),
    source.replace('ADDED.has(scene.id)', 'ADDED.has(state.id)'),
  ]) {
    const nodes = statements(changed);
    assert.throws(
      () => omitLeadingSetDispatch(nodes.at(-1), { ...options, moduleNodes: nodes }),
      /exactly match/,
    );
  }
});

test('negated private Set dispatch is omitted only for a present member with exact routing', async () => {
  const { omitLeadingSetDispatch } = await import('../tools/lib/pilot-module-extraction.mjs');
  const source = `const CURRENT = new Set(['current']);
    function legacy(ctx,scene,state,api){api.text(ctx,'legacy');}
    export function draw(ctx,scene,state,api){
      if(!CURRENT.has(scene.id)) return legacy(ctx,scene,state,api);
      api.text(ctx,'current',state.value);
    }`;
  const nodes = statements(source),
    root = nodes.at(-1).declaration,
    options = {
      registry: 'CURRENT',
      painter: 'legacy',
      sceneId: 'current',
      negated: true,
      moduleNodes: nodes,
    };
  const adjusted = omitLeadingSetDispatch(root, options);
  const before = await moduleFrom(nodes),
    after = await moduleFrom([
      { type: 'ExportNamedDeclaration', declaration: adjusted, specifiers: [], source: null },
    ]),
    a = receiver(),
    b = receiver();
  before.draw({}, { id: 'current' }, { value: 17 }, a.api);
  after.draw({}, { id: 'current' }, { value: 17 }, b.api);
  assert.deepEqual(b.calls, a.calls);
  assert.throws(
    () => omitLeadingSetDispatch(root, { ...options, sceneId: 'legacy' }),
    /including legacy/,
  );
  for (const changed of [
    source.replace('!CURRENT.has', 'CURRENT.has'),
    source.replace('!CURRENT.has', '!!CURRENT.has'),
    source.replace('return legacy(ctx,scene,state,api)', 'return legacy(ctx,state,scene,api)'),
    source + "CURRENT.delete('current');",
    source + 'const alias=CURRENT; export{alias};',
  ]) {
    const moduleNodes = statements(changed);
    const changedRoot = moduleNodes.find(
      (node) => node.declaration?.id?.name === 'draw',
    ).declaration;
    assert.throws(
      () => omitLeadingSetDispatch(changedRoot, { ...options, moduleNodes }),
      /exactly match|read-only has|private immutable/,
    );
  }
});

test('private Set projection preserves residual state routing and actual scene shadows', async () => {
  const { projectPrivateSetMembership } = await import('../tools/lib/pilot-module-extraction.mjs');
  const source = `const CONSTRUCTED = new Set(['added']);
    function construct(ctx,scene,state,api){api.text(ctx,'constructed');}
    export function draw(ctx,scene,state,api){
      const shadow = scene => CONSTRUCTED.has(scene.id);
      api.text(ctx,'shadow',shadow({id:'unrelated'}));
      const localSet = () => {
        const CONSTRUCTED = new Set(['unrelated']);
        return CONSTRUCTED.has(scene.id);
      };
      api.text(ctx,'local Set',localSet());
      if(CONSTRUCTED.has(scene.id) ||
        (scene.id==='m-step' && state.beat===2) ||
        (scene.id==='initialization' && state.beat===0))
        return construct(ctx,scene,state,api);
      api.text(ctx,'original');
    }`;
  const nodes = statements(source),
    root = nodes.at(-1).declaration,
    options = { registry: 'CONSTRUCTED', moduleNodes: nodes };
  const original = await moduleFrom(nodes);
  for (const id of ['added', 'm-step', 'initialization', 'baseline']) {
    const projected = projectPrivateSetMembership(root, { ...options, sceneId: id });
    const specialized = specializeScene([projected], id);
    const migrated = await moduleFrom([
      ...nodes.slice(0, -1),
      { type: 'ExportNamedDeclaration', declaration: specialized[0], specifiers: [], source: null },
    ]);
    for (const beat of [0, 1, 2, 3]) {
      const before = receiver(),
        after = receiver();
      original.draw({}, { id }, { beat }, before.api);
      migrated.draw({}, { id }, { beat }, after.api);
      assert.deepEqual(after.calls, before.calls, `${id}/${beat}`);
    }
  }
  for (const suffix of [
    "CONSTRUCTED.add('baseline');",
    'const exposed=CONSTRUCTED;export{exposed};',
    'export {CONSTRUCTED};',
  ])
    assert.throws(
      () =>
        projectPrivateSetMembership(root, {
          ...options,
          sceneId: 'baseline',
          moduleNodes: statements(source + suffix),
        }),
      /read-only has|private immutable/,
    );
  const shadowOnly = statements(`const CONSTRUCTED=new Set(['added']);
    function draw(ctx,scene,state,api){const inner=scene=>CONSTRUCTED.has(scene.id);api.text(ctx,inner({id:'added'}));}`);
  assert.throws(
    () =>
      projectPrivateSetMembership(shadowOnly.at(-1), {
        registry: 'CONSTRUCTED',
        sceneId: 'added',
        moduleNodes: shadowOnly,
      }),
    /No root-scene membership/,
  );
});

test('array membership specialization refuses mutated or escaping routing values', async () => {
  for (const mutation of [
    "routes.push('legacy');",
    "routes.splice(0, 1, 'legacy');",
    "routes[0] = 'legacy';",
    "const alias = routes; alias.push('legacy');",
    "const exposed = { routes }; exposed.routes.push('legacy');",
    "const mutate = () => routes.push('legacy'); mutate();",
  ]) {
    const nodes = statements(`export function draw(ctx,scene,state,api) {
      const routes = ['initial'];
      ${mutation}
      api.text(ctx,routes.includes(scene.id));
    }`);
    const original = await moduleFrom(nodes),
      observed = receiver();
    original.draw({}, { id: 'legacy' }, {}, observed.api);
    assert.deepEqual(observed.calls, [[true]], mutation);
    assert.throws(
      () => specializeScene(nodes, 'legacy'),
      /Mutable or escaping routing array routes cannot be specialized/,
      mutation,
    );
  }
  const readOnly = statements(`export function draw(ctx,scene,state,api) {
    const routes = ['legacy'];
    if(routes.includes(scene.id)) api.text(ctx,'selected');
    else api.text(ctx,'other');
  }`);
  for (const id of ['legacy', 'other']) {
    const original = await moduleFrom(readOnly),
      specialized = await moduleFrom(specializeScene(readOnly, id)),
      before = receiver(),
      after = receiver();
    original.draw({}, { id }, {}, before.api);
    specialized.draw({}, { id: 'routing was resolved' }, {}, after.api);
    assert.deepEqual(after.calls, before.calls);
  }
});

test('literal-only stage templates fold without changing tagged or numeric interpolation contracts', async () => {
  const nodes = statements(
    "export function draw(ctx,scene,state,api){const tag=(strings,...values)=>[strings.raw,values];api.text(ctx,`${scene.id}-construction`,`${1}-count`,tag`${'raw'}-tag`);}",
  );
  const specialized = specializeScene(nodes, 'mdp');
  const before = await moduleFrom(nodes),
    after = await moduleFrom(specialized),
    a = receiver(),
    b = receiver();
  before.draw({}, { id: 'mdp' }, {}, a.api);
  after.draw({}, { id: 'mdp' }, {}, b.api);
  assert.deepEqual(b.calls, a.calls);
  let literalCount = 0,
    templates = 0;
  const { default: babelTraverse } = await import('@babel/traverse');
  (babelTraverse.default ?? babelTraverse)(program(specialized), {
    StringLiteral(p) {
      if (p.node.value === 'mdp-construction') literalCount++;
    },
    TemplateLiteral() {
      templates++;
    },
  });
  assert.equal(literalCount, 1);
  assert.equal(templates, 2);
  const uncollapsed = specializeScene(nodes, 'mdp', { foldLiteralStrings: false });
  assert.equal(
    uncollapsed[0].declaration.body.body[1].expression.arguments[1].type,
    'TemplateLiteral',
  );
});

test('explicit scene-ID captures preserve transitive focus helpers and local scene shadows', async () => {
  const source = statements(`function draw(ctx,scene,state,api){
    const target=(name,paint)=>api.focus.target(scene.id+'-'+name,paint);
    const text=value=>target('text',()=>api.text(ctx,value));
    const panel=value=>text(value+' '+[{id:'inner'}].map(scene=>scene.id)[0]);
    const line=value=>api.text(ctx,value);
    [{id:'callback'}].forEach(scene=>panel(state.value));
    line('unchanged');
  }`)[0];
  const map = { target: 'focusTarget', text: 'drawText', panel: 'drawPanel', line: 'drawLine' };
  const original = await moduleFrom([
    { type: 'ExportNamedDeclaration', declaration: source, specifiers: [], source: null },
  ]);
  const old = liftDrawingHelpers(source, map);
  const broken = await moduleFrom([
    ...old.helpers,
    { type: 'ExportNamedDeclaration', declaration: old.draw, specifiers: [], source: null },
  ]);
  assert.throws(
    () => broken.draw({}, { id: 'outer' }, { value: 'payload' }, receiver().api),
    /scene is not defined/,
  );
  const lifted = liftDrawingHelpers(source, map, { captures: { sceneId: 'scene.id' } });
  const migrated = await moduleFrom([
    ...lifted.helpers,
    { type: 'ExportNamedDeclaration', declaration: lifted.draw, specifiers: [], source: null },
  ]);
  for (const id of ['outer', 'second']) {
    const before = receiver(),
      after = receiver();
    original.draw({}, { id }, { value: 'payload' }, before.api);
    migrated.draw({}, { id }, { value: 'payload' }, after.api);
    assert.deepEqual(after.calls, before.calls);
    assert.deepEqual(after.calls, [['target', id + '-text'], ['payload inner'], ['unchanged']]);
  }
  assert.equal(migrated.focusTarget.length, 5);
  assert.equal(migrated.drawLine.length, 3);
});

test('projected helper captures reject alias collisions, unsupported projections and unsafe order', () => {
  const source = statements(
    `function draw(ctx,scene,state,api){const target=()=>scene.id;target();}`,
  )[0];
  assert.throws(
    () =>
      liftDrawingHelpers(source, { target: 'focusTarget' }, { captures: { id: 'scene.title' } }),
    /one explicit scene.id/,
  );
  const collision = statements(
    `function draw(ctx,scene,state,api){const target=()=>scene.id;[1].map(sceneId=>target());}`,
  )[0];
  assert.throws(
    () =>
      liftDrawingHelpers(
        collision,
        { target: 'focusTarget' },
        { captures: { sceneId: 'scene.id' } },
      ),
    /already used/,
  );
  const forward = statements(
    `function draw(ctx,scene,state,api){const outer=()=>target();const target=()=>scene.id;outer();}`,
  )[0];
  assert.throws(
    () =>
      liftDrawingHelpers(
        forward,
        { outer: 'outer', target: 'target' },
        { captures: { sceneId: 'scene.id' } },
      ),
    /dependency-first/,
  );
});

test('archived modules retain their original file origin for URL and entry-guard behavior', async () => {
  const fs = await import('node:fs/promises');
  const os = await import('node:os');
  const path = await import('node:path');
  const { pathToFileURL } = await import('node:url');
  const { preservedModule } = await import('../tools/check-pilot-parity.mjs');
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'lesson-origin-'));
  try {
    const filename = path.join(directory, 'archive.mjs');
    const original = path.join(directory, 'canonical', 'lesson.mjs');
    await fs.writeFile(
      filename,
      `import {fileURLToPath} from 'node:url';
      export const origin=import.meta.url;
      export const path=fileURLToPath(import.meta['url']);
      export const asset=new URL('./figure.png',import.meta.url).href;`,
    );
    const result = await preservedModule(filename, original);
    assert.equal(result.origin, pathToFileURL(original).href);
    assert.equal(result.path, original);
    assert.equal(result.asset, pathToFileURL(path.join(path.dirname(original), 'figure.png')).href);
    await fs.writeFile(filename, `export const unsupported=import.meta.resolve('./figure.png');`);
    await assert.rejects(() => preservedModule(filename, original), /import.meta.url only/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('a direct demo split preserves its executable entry guard and exact output', async () => {
  const { splitDirectDemoEntry } = await import('../tools/lib/pilot-module-extraction.mjs');
  const fs = await import('node:fs/promises');
  const os = await import('node:os');
  const path = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const nodes = statements(`import path from 'node:path';import {fileURLToPath} from 'node:url';
    const rows=[{id:'row-1',value:3}];
    if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)&&process.argv.includes('--demo')){
      console.log(JSON.stringify({rows,total:rows.reduce((sum,row)=>sum+row.value,0)}));
    }`);
  const split = splitDirectDemoEntry(nodes.at(-1));
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'lesson-demo-'));
  try {
    const original = path.join(directory, 'before.mjs'),
      migrated = path.join(directory, 'after.mjs');
    await fs.writeFile(original, code(program(nodes)));
    await fs.writeFile(migrated, code(program([...nodes.slice(0, -1), split.demo, split.guard])));
    for (const args of [[], ['--demo']])
      assert.equal(
        execFileSync(process.execPath, [migrated, ...args], { encoding: 'utf8' }),
        execFileSync(process.execPath, [original, ...args], { encoding: 'utf8' }),
      );
    assert.throws(
      () =>
        splitDirectDemoEntry(
          statements(`if(process.argv.includes('--demo')){console.log('unguarded');}`)[0],
        ),
      /exact file-origin-guarded/,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('shared cue-key strings stay legal while scene-dependent routes still refuse', async () => {
  const { assertNoSharedSceneDispatch } = await import('../tools/lib/pilot-module-extraction.mjs');
  const legal = statements(
    `export function event(scene,state,name){return state.cues['ic-'+scene.id+'-'+name];}`,
  );
  assert.doesNotThrow(() => assertNoSharedSceneDispatch(legal, 'construction'));
  const module = await moduleFrom(legal);
  assert.equal(
    module.event({ id: 'budget' }, { cues: { 'ic-budget-result': 0.75 } }, 'result'),
    0.75,
  );
  for (const source of [
    `function route(scene){return scene.id==='budget';}`,
    `function route(scene){return 'prefix-'+scene.id==='prefix-budget';}`,
    `function route(scene){return scene.id?1:0;}`,
    `function route(scene){switch(scene.id){case 'budget':return 1;default:return 0;}}`,
  ])
    assert.throws(
      () => assertNoSharedSceneDispatch(statements(source), 'model'),
      /Remaining scene dispatcher/,
    );
});

test('explicit API aliases require the actual constant field binding and avoid api shadows', async () => {
  const source = statements(
    `function draw(ctx,scene,state,api){const {components}=api;const card=value=>components.card(value);card(state.value);}`,
  )[0];
  const lifted = liftDrawingHelpers(
    source,
    { card: 'drawCard' },
    { apiAliases: { components: 'components' } },
  );
  const migrated = await moduleFrom([
    ...lifted.helpers,
    { type: 'ExportNamedDeclaration', declaration: lifted.draw, specifiers: [], source: null },
  ]);
  const calls = [];
  migrated.draw(
    {},
    {},
    { value: 'identity-17' },
    {
      components: {
        card(value) {
          calls.push(value);
        },
      },
    },
  );
  assert.deepEqual(calls, ['identity-17']);
  const wrong = statements(
    `function draw(ctx,scene,state,api){const {components}=state;const card=value=>components.card(value);card(3);}`,
  )[0];
  assert.throws(
    () =>
      liftDrawingHelpers(wrong, { card: 'drawCard' }, { apiAliases: { components: 'components' } }),
    /actual api.components/,
  );
  const shadow = statements(
    `function draw(ctx,scene,state,api){const {components}=api;const card=value=>[0].map(api=>components.card(value));card(3);}`,
  )[0];
  assert.throws(
    () =>
      liftDrawingHelpers(
        shadow,
        { card: 'drawCard' },
        { apiAliases: { components: 'components' } },
      ),
    /shadowed api/,
  );
});

test('primary stage names preserve a retained painter with the same generated name', async () => {
  const { stagePainterName } = await import('../tools/lib/pilot-module-extraction.mjs');
  const source = statements(`function draw(ctx,scene,state,api){drawIndicator(ctx,scene,state,api);}
    function drawIndicator(ctx,scene,state,api){api.text(ctx,state.value*2);}`);
  const original = await moduleFrom([
    { type: 'ExportNamedDeclaration', declaration: source[0], specifiers: [], source: null },
    source[1],
  ]);
  const broken = structuredClone(source);
  broken[0].id.name = 'drawIndicator';
  await assert.rejects(() => moduleFrom(broken), /already been declared/);
  const name = stagePainterName('drawIndicator', source, source[0]);
  assert.equal(name, 'drawIndicatorStage');
  source[0].id.name = name;
  const migrated = await moduleFrom([
    { type: 'ExportNamedDeclaration', declaration: source[0], specifiers: [], source: null },
    source[1],
  ]);
  const before = receiver(),
    after = receiver();
  original.draw({}, {}, { value: 7 }, before.api);
  migrated[name]({}, {}, { value: 7 }, after.api);
  assert.deepEqual(after.calls, before.calls);
  assert.equal(stagePainterName('drawOther', source, source[0]), 'drawOther');
});
