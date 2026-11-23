#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';
import babelTraverse from '@babel/traverse';
import { readLesson } from '../lib/lesson.mjs';
import { formatSource, inspectSource } from './migrate-lesson-modules.mjs';
import {
  clone,
  code,
  declaredNames,
  externalNames,
  stagePainterName,
  publicStageDrawFacade,
  assertNoSharedSceneDispatch,
  clarifyStageLocals,
  createFixtureBuilder,
  splitDirectDemoEntry,
  adaptStageSignature,
  voidRootBooleanReturns,
  omitLeadingPainter,
  omitLeadingSetDispatch,
  projectPrivateSetMembership,
  liftDrawingHelpers,
  specializeScene,
  statements,
} from './lib/pilot-module-extraction.mjs';

const repository = fileURLToPath(new URL('../..', import.meta.url));
const evidenceRoot = path.join(repository, 'build/video-delivery-20261106/source-migration/pilots');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const traverse = babelTraverse.default ?? babelTraverse;
const pilots = {
  conformal: {
    sha256: '8d6a7bab7161103ae5bd4c3fe06f9ac725c8f2af193db1fc61ccb26646047214',
    draws: {
      draw: {
        txt: 'text',
        eq: 'equation',
        line: 'line',
        caption: 'caption',
        dot: 'dot',
        panel: 'panel',
        arrow: 'arrow',
        axis: 'axis',
        intervalRow: 'intervalRow',
      },
    },
    fixtureNames: [
      'PREDICTIONS',
      'ACTUALS',
      'RESIDUALS',
      'SORTED',
      'ALPHA',
      'RANK',
      'THRESHOLD',
      'DISPLAY_ORDER',
      'TEST_PREDICTIONS',
      'TEST_OUTCOMES',
      'SCALES',
      'TEST_SCALES',
      'ROUTER',
    ],
    constructionNames: ['clamp', 'phase', 'cueProgress', 'cueStarted', 'cueDone'],
  },
  'mixed-precision': {
    sha256: '4edb26aa4b424524fbb60b9ca80ecf43a0325300772612d2c6ca2763a6bd047e',
    draws: {
      draw: { T: 'text', M: 'equation', card: 'card', grid: 'numberGrid' },
      drawPrecisionExtension: { T: 'extensionText', M: 'extensionEquation', box: 'extensionBox' },
    },
    fixtureNames: [
      'reductionPrecisionFixture',
      'policyPrecisionFixture',
      'unequalTokenFixture',
      'precisionBoundaryFixture',
    ],
    arithmeticNames: ['roundBinary', 'fp16', 'bf16'],
    extension: {
      name: 'drawPrecisionExtension',
      existing: ['formats', 'controller', 'ordering', 'memory'],
      added: ['communication', 'policy-mismatch', 'fp8-contract', 'earned-transfer'],
    },
  },
  'state-space-models': {
    sha256: '3f2db8fdd5104ad419511ba86f5b54492a025ade004a4e66633306243d17924b',
    draws: {
      draw: { T: 'text', M: 'equation', card: 'card' },
      drawUpgrade: {
        T: 'extensionText',
        M: 'extensionEquation',
        A: 'arrow',
        R: 'rectangle',
        box: 'box',
        footer: 'footer',
      },
    },
    fixtureNames: [
      'xs',
      'hs',
      'weights',
      'contrib',
      'pairs',
      'DELTA_BEAT_SECONDS',
      'CHECKPOINT_BEAT_SECONDS',
      'KERNEL_INTERVENTION_SECONDS',
    ],
    arithmeticNames: ['run', 'compose', 'selectiveCoefficients'],
    extension: {
      name: 'drawUpgrade',
      existing: [],
      added: [
        'held-input',
        'structured-block',
        'prefix-construction',
        'ssd-and-refinement',
        'complete-buffers',
        'earned-transfer',
      ],
    },
  },
};

export function pilotConfiguration(id) {
  if (!pilots[id]) throw new Error(`Unknown pilot ${id}`);
  return {
    id,
    baselineDirectory: path.relative(repository, path.join(evidenceRoot, id, 'baseline')),
    ...clone(pilots[id]),
  };
}

export async function prepareMigration(id, planPath) {
  if (!/^[a-z][a-z0-9-]*$/.test(id ?? '')) throw new Error('Invalid lesson ID');
  const entry = path.join(repository, `videos/animations/${id}.mjs`);
  const source = await fs.readFile(entry, 'utf8');
  const ast = parse(source, { sourceType: 'module' });
  const lessonPath = `videos/lessons/${id}.lesson.yaml`;
  const markup = await fs.readFile(path.join(repository, lessonPath));
  const namespace = await import(pathToFileURL(entry));
  const baselineDirectory = path.join(path.dirname(path.resolve(planPath)), id + '-baseline');
  const draws = {};
  const helperDependencies = {};
  const helperWords = {
    T: 'text',
    M: 'equation',
    A: 'arrow',
    R: 'rectangle',
    txt: 'text',
    eq: 'equation',
  };
  const unresolved = inspectSource(source)
    .decomposition.unresolved.filter(
      (reason) => reason.includes('Set.has') || reason.includes('context bag'),
    )
    .map((reason) => ({ reason }));
  traverse(ast, {
    FunctionDeclaration(p) {
      if (
        p.node.params.length !== 4 ||
        p.node.params[1]?.name !== 'scene' ||
        (!p.parentPath.isProgram() && !p.parentPath.isExportNamedDeclaration())
      )
        return;
      const helpers = {};
      const dependencies = {};
      for (const [name, binding] of Object.entries(p.scope.bindings)) {
        const init = binding.path.isVariableDeclarator() ? binding.path.get('init') : binding.path;
        if (!init?.isFunction()) continue;
        const outside = new Set();
        init.traverse({
          ReferencedIdentifier(reference) {
            const origin = reference.scope.getBinding(reference.node.name);
            if (
              origin &&
              !(origin.path.node.start >= init.node.start && origin.path.node.end <= init.node.end)
            )
              outside.add(reference.node.name);
          },
        });
        if (
          [...outside].some((value) =>
            ['state', 'scene', 'b', 'p', 'beat', 'progress', 'cues'].includes(value),
          )
        )
          continue;
        if (![...outside].some((value) => ['ctx', 'api', 'C', 'c', 't', 'g'].includes(value)))
          continue;
        const word = helperWords[name] ?? name;
        helpers[name] =
          p.node.id.name === 'draw' ? word : p.node.id.name + word[0].toUpperCase() + word.slice(1);
        dependencies[name] = [...outside].sort();
      }
      draws[p.node.id.name] = helpers;
      helperDependencies[p.node.id.name] = dependencies;
    },
  });
  const fixtureNames = [];
  for (const entry of ast.program.body) {
    const node = entry.declaration ?? entry;
    if (node.type === 'VariableDeclaration')
      for (const declaration of node.declarations)
        if (
          declaration.id.type === 'Identifier' &&
          [
            'ArrayExpression',
            'ObjectExpression',
            'NumericLiteral',
            'StringLiteral',
            'BooleanLiteral',
          ].includes(declaration.init?.type)
        )
          fixtureNames.push(declaration.id.name);
    if (
      [
        'ForStatement',
        'ForOfStatement',
        'ForInStatement',
        'WhileStatement',
        'ExpressionStatement',
        'IfStatement',
        'SwitchStatement',
        'TryStatement',
        'ThrowStatement',
        'BlockStatement',
      ].includes(node.type)
    )
      unresolved.push({
        line: node.loc.start.line,
        reason:
          'Executable module entry/initialization requires an explicit entry contract or pure fixture builder',
      });
  }
  if (!draws.draw)
    unresolved.push({
      reason:
        'The public draw is not a conventional named four-argument function; manual entry decomposition is required',
    });
  await fs.mkdir(baselineDirectory, { recursive: true });
  await fs.writeFile(path.join(baselineDirectory, 'animation.mjs'), source, { flag: 'wx' });
  await fs.writeFile(path.join(baselineDirectory, 'lesson.yaml'), markup, { flag: 'wx' });
  await fs.writeFile(
    path.join(baselineDirectory, 'authority.json'),
    JSON.stringify(
      {
        id,
        source: { path: `videos/animations/${id}.mjs`, sha256: digest(source) },
        markup: { path: lessonPath, sha256: digest(markup) },
        namedExports: Object.keys(namespace).sort(),
        scope:
          'Exact mechanical baseline only. This capture adds no manuscript, source, native or movie acceptance.',
      },
      null,
      2,
    ) + '\n',
    { flag: 'wx' },
  );
  const plan = {
    id,
    reviewed: false,
    preserveNumericLocals: true,
    foldStageIdStrings: true,
    foldBooleanIdentities: true,
    sha256: digest(source),
    baselineDirectory: path.relative(repository, baselineDirectory),
    draws,
    helperDependencies,
    fixtureNames,
    arithmeticNames: [],
    constructionNames: [],
    unresolved,
    requiredReview:
      'Read complete source/narration, verify helper closures, explicit extension routing, module purity/cycles and unchanged export contracts. Resolve initialization/carries manually. Set reviewed true only after the actual owner review. Run split without --write first, then provider/native parity.',
  };
  await fs.writeFile(planPath, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
  return plan;
}

function exportNode(node) {
  return { type: 'ExportNamedDeclaration', declaration: clone(node), specifiers: [], source: null };
}

function splitDeclarations(nodes) {
  return nodes.flatMap((node) =>
    node.type === 'VariableDeclaration'
      ? node.declarations.map((declaration) => ({
          ...clone(node),
          declarations: [clone(declaration)],
        }))
      : [node],
  );
}

function makeImports(nodes, modules, originalImports, prefix = './') {
  const needed = externalNames(nodes),
    imports = [];
  for (const [module, names] of Object.entries(modules)) {
    const selected = names.filter((name) => needed.has(name)).sort();
    if (selected.length)
      imports.push(...statements(`import {${selected.join(',')}} from '${prefix}${module}.mjs';`));
    for (const name of selected) needed.delete(name);
  }
  for (const original of originalImports) {
    const copy = clone(original);
    if (prefix === '../' && copy.source.value.startsWith('.'))
      copy.source.value = '../' + copy.source.value;
    copy.specifiers = copy.specifiers.filter((specifier) => needed.has(specifier.local.name));
    if (copy.specifiers.length) imports.push(copy);
    for (const specifier of copy.specifiers) needed.delete(specifier.local.name);
  }
  const globals = new Set(Object.getOwnPropertyNames(globalThis));
  const unresolved = [...needed].filter((name) => !globals.has(name));
  if (unresolved.length)
    throw new Error(
      `Unresolved lexical dependencies require manual decomposition: ${unresolved.sort().join(', ')}`,
    );
  return imports;
}

async function emit(filename, nodes, files) {
  const generated = code({
    type: 'File',
    program: { type: 'Program', sourceType: 'module', body: nodes, directives: [] },
  });
  const formatted = await formatSource(generated, filename);
  files.set(filename, formatted);
}

export async function planPilot(id, previousManifest, suppliedPlan) {
  if (!/^[a-z][a-z0-9-]*$/.test(id ?? '')) throw new Error('Invalid lesson ID');
  const config = suppliedPlan ?? pilots[id];
  if (config?.sceneDraws && !config.stageDraws) config.stageDraws = config.sceneDraws;
  if (!config)
    throw new Error('A reviewed explicit decomposition plan is required for this lesson');
  if (
    suppliedPlan &&
    (config.id !== id ||
      !config.baselineDirectory ||
      !config.draws?.draw ||
      !/^[0-9a-f]{64}$/.test(config.sha256))
  )
    throw new Error(
      'The explicit plan needs id, baselineDirectory, exact sha256 and a draw helper map',
    );
  const baselineDirectory = config.baselineDirectory
    ? path.resolve(repository, config.baselineDirectory)
    : path.join(evidenceRoot, id, 'baseline');
  const baseline = path.join(baselineDirectory, 'animation.mjs');
  const source = await fs.readFile(baseline, 'utf8');
  assert.equal(
    digest(source),
    config.sha256,
    'The preserved baseline differs from the authorized pilot hold',
  );
  const current = await fs.readFile(path.join(repository, `videos/animations/${id}.mjs`), 'utf8');
  if (previousManifest) {
    assert.equal(previousManifest.id, id);
    assert.equal(previousManifest.sourceSha256, config.sha256);
    for (const record of previousManifest.files)
      assert.equal(
        digest(await fs.readFile(path.join(repository, record.path))),
        record.sha256,
        `The owned output changed: ${record.path}`,
      );
  } else
    assert.equal(
      digest(current),
      config.sha256,
      'The live entry has changed; do not overwrite another writer',
    );
  const ast = parse(source, { sourceType: 'module' });
  let directDemo;
  if (config.directDemoEntry !== undefined) {
    if (!Number.isInteger(config.directDemoEntry) || (config.initializerBuilders ?? []).length)
      throw new Error(
        'A direct demo entry needs one original statement index, without fixture-builder ranges',
      );
    directDemo = splitDirectDemoEntry(ast.program.body[config.directDemoEntry]);
    ast.program.body.splice(config.directDemoEntry, 1);
  }
  const originalImports = ast.program.body
    .filter((node) => node.type === 'ImportDeclaration')
    .map(clone);
  const fixtureNames = new Set(config.fixtureNames ?? []);
  let previousStart = ast.program.body.length;
  for (const builder of [...(config.initializerBuilders ?? [])].sort(
    (a, b) => b.startStatement - a.startStatement,
  )) {
    const { startStatement: start, endStatement: end, name, returns } = builder;
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      end < start ||
      end >= previousStart
    )
      throw new Error(
        'Initializer builder ranges must be valid, nonoverlapping original Program.body indices',
      );
    const selected = ast.program.body.slice(start, end + 1);
    ast.program.body.splice(
      start,
      end - start + 1,
      ...createFixtureBuilder(name, selected, returns),
    );
    previousStart = start;
    fixtureNames.add(name);
    for (const binding of returns) fixtureNames.add(binding);
  }
  for (const declaration of originalImports) {
    if (!declaration.specifiers.length)
      throw new Error('Side-effect imports require manual module decomposition');
    if (declaration.source.value.startsWith('.')) {
      const target = path.resolve(repository, 'videos/animations', declaration.source.value);
      let relative = path
        .relative(path.join(repository, 'videos/films', id), target)
        .split(path.sep)
        .join('/');
      if (!relative.startsWith('.')) relative = './' + relative;
      declaration.source.value = relative;
    }
  }
  const authority = JSON.parse(
    await fs.readFile(path.join(baselineDirectory, 'authority.json'), 'utf8'),
  );
  if (authority.id !== id || authority.source.sha256 !== config.sha256)
    throw new Error('Baseline authority does not bind the planned source');
  if (authority.namedExports.includes('default'))
    throw new Error('An existing default export requires manual entry-contract review');
  const publicNames = authority.namedExports
    .filter((name) => name !== 'draw' && name !== 'default')
    .sort();
  if (directDemo && publicNames.includes('runDemo'))
    throw new Error('The preserved public runDemo name needs an explicit entry adapter');
  for (const name of config.omitNames ?? [])
    if (publicNames.includes(name)) throw new Error(`Cannot omit preserved public export ${name}`);
  const unwrapped = ast.program.body
    .filter((node) => !['ImportDeclaration', 'EmptyStatement'].includes(node.type))
    .map((node) => clone(node.declaration ?? node));
  const drawNodes = unwrapped.filter(
    (node) => node.type === 'FunctionDeclaration' && node.id.name in config.draws,
  );
  if (
    suppliedPlan &&
    !config.stageDraws &&
    !config.extension &&
    Object.keys(config.draws).length > 1
  )
    throw new Error(
      'Multiple drawing dispatchers require explicit stageDraws/sceneDraws root routes; whole dispatchers will not be copied into every stage',
    );
  for (const name of Object.keys(config.draws))
    if (!drawNodes.some((node) => node.id.name === name))
      throw new Error(
        `Draw dispatcher ${name} is not a named function declaration; decompose it manually`,
      );
  if (
    id !== 'state-space-models' &&
    unwrapped.some(
      (node) =>
        !['FunctionDeclaration', 'VariableDeclaration', 'ClassDeclaration'].includes(node.type),
    )
  )
    throw new Error(
      'Executable top-level initialization requires a pure fixture builder before automatic decomposition',
    );
  const drawing = [],
    transformedDraws = [];
  for (const node of drawNodes) {
    const lifted = liftDrawingHelpers(node, config.draws[node.id.name], {
      captures: config.helperCaptures?.[node.id.name],
      apiAliases: config.helperApiAliases?.[node.id.name],
    });
    transformedDraws.push(lifted.draw);
    drawing.push(...lifted.helpers);
  }
  const groups = {
    arithmetic: [],
    fixtures: [],
    construction: [],
    model: [],
    defaults: [],
    validation: [],
  };
  for (const node of splitDeclarations(unwrapped)) {
    const names = declaredNames(node);
    if (names.some((name) => config.omitNames?.includes(name))) continue;
    if (names.some((name) => name in config.draws)) continue;
    if (
      id === 'state-space-models' &&
      (names.includes('selective') || names.includes('h') || node.type === 'ForOfStatement')
    )
      continue;
    let destination = 'model';
    if (names.some((name) => config.arithmeticNames?.includes(name))) destination = 'arithmetic';
    else if (names.some((name) => fixtureNames.has(name))) destination = 'fixtures';
    else if (names.some((name) => config.constructionNames?.includes(name)))
      destination = 'construction';
    else if (names.some((name) => config.validationNames?.includes(name)))
      destination = 'validation';
    else if (
      names.some(
        (name) => config.defaultsNames?.includes(name) || config.drawingNames?.includes(name),
      )
    )
      destination = 'defaults';
    groups[destination].push(exportNode(node));
  }
  groups.defaults.push(...drawing);
  for (const [group, nodes] of Object.entries(groups)) assertNoSharedSceneDispatch(nodes, group);
  if (id === 'state-space-models') {
    const loop = unwrapped.find((node) => node.type === 'ForOfStatement');
    groups.fixtures.push(
      ...statements(
        `export function buildSelectiveStates(values = xs) { const selective=[];let h=0; ${code(loop).replace('of xs', 'of values')} return selective; } export const selective=buildSelectiveStates(xs);`,
      ),
    );
  }
  const moduleNames = Object.fromEntries(
    Object.entries(groups).map(([name, nodes]) => [
      name,
      nodes.flatMap((node) => declaredNames(node)),
    ]),
  );
  const graph = Object.fromEntries(
    Object.entries(groups).map(([name, nodes]) => {
      const dependencies = externalNames(nodes);
      return [
        name,
        Object.entries(moduleNames)
          .filter(
            ([other, names]) =>
              other !== name && names.some((binding) => dependencies.has(binding)),
          )
          .map(([other]) => other),
      ];
    }),
  );
  function visit(module, trail = []) {
    if (trail.includes(module))
      throw new Error(
        `Cyclic model/fixture groups require manual decomposition: ${[...trail, module].join(' -> ')}`,
      );
    for (const dependency of graph[module]) visit(dependency, [...trail, module]);
  }
  for (const module of Object.keys(graph)) visit(module);
  const drawingNames = groups.defaults.flatMap((node) => declaredNames(node));
  const files = new Map(),
    bundle = `videos/films/${id}`;
  for (const [name, nodes] of Object.entries(groups)) {
    if (!nodes.length || name === 'defaults') continue;
    const modules = Object.fromEntries(
      Object.entries(moduleNames).filter(([other]) => other !== name),
    );
    await emit(
      `${bundle}/${name}.mjs`,
      [...makeImports(nodes, modules, originalImports), ...nodes],
      files,
    );
  }
  await emit(
    `${bundle}/defaults.mjs`,
    [...makeImports(groups.defaults, moduleNames, originalImports), ...groups.defaults],
    files,
  );
  const lesson = await readLesson(`videos/lessons/${id}.lesson.yaml`, repository);
  const publicFacades = new Map();
  for (const [name, contract] of Object.entries(config.publicStageDrawExports ?? {})) {
    const original = drawNodes.find((node) => node.id.name === name);
    const selectedIds = lesson.scenes
      .filter((scene) => {
        const route = config.stageDraws?.[scene.id];
        return (typeof route === 'string' ? route : route?.draw) === name;
      })
      .map((scene) => scene.id);
    if (
      !publicNames.includes(name) ||
      !original ||
      contract.unmatched !== 'noop' ||
      JSON.stringify(contract.scenes) !== JSON.stringify(selectedIds)
    )
      throw new Error(
        `Public stage facade ${name} must match its exact ordered explicit routes and reviewed no-op contract`,
      );
    publicFacades.set(name, code(publicStageDrawFacade(original, contract.scenes)));
  }
  const sceneEntries = [];
  const stageBindings = new Set([
    ...publicNames,
    'draw',
    'definition',
    'defineCanvasLesson',
    'validateModel',
  ]);
  const legacyPilotLayout = Boolean(
    pilots[id] && config.sha256 === pilots[id].sha256 && config.groupPublicExports === undefined,
  );
  for (const scene of lesson.scenes) {
    let selectedDraws = transformedDraws.map(clone);
    if (config.stageDraws) {
      const choice = config.stageDraws[scene.id];
      if (!choice) throw new Error(`No explicit painter for ${scene.id}`);
      const selected = typeof choice === 'string' ? { draw: choice } : choice;
      selectedDraws = selectedDraws.filter(
        (node) => node.id.name === selected.draw || selected.helpers?.includes(node.id.name),
      );
      let main = selectedDraws.find((node) => node.id.name === selected.draw);
      if (!main) throw new Error(`Unknown stage painter ${selected.draw}`);
      if (selected.projectPrivateSets !== undefined) {
        if (
          !Array.isArray(selected.projectPrivateSets) ||
          selected.projectPrivateSets.some((name) => typeof name !== 'string') ||
          new Set(selected.projectPrivateSets).size !== selected.projectPrivateSets.length
        )
          throw new Error('projectPrivateSets must be an array of distinct binding names');
        for (const registry of selected.projectPrivateSets) {
          const previous = main;
          main = projectPrivateSetMembership(main, {
            registry,
            sceneId: scene.id,
            moduleNodes: ast.program.body,
          });
          selectedDraws[selectedDraws.indexOf(previous)] = main;
        }
      }
      if (selected.omitLeadingPainter) {
        const previous = main;
        main = omitLeadingPainter(main, selected.omitLeadingPainter, {
          reviewedPurePrefixCalls: config.reviewedPurePrefixCalls,
          moduleNodes: ast.program.body,
        });
        selectedDraws[selectedDraws.indexOf(previous)] = main;
      }
      if (selected.omitLeadingSetDispatch) {
        const previous = main;
        main = omitLeadingSetDispatch(main, {
          ...selected.omitLeadingSetDispatch,
          sceneId: scene.id,
          moduleNodes: ast.program.body,
          reviewedPurePrefixCalls: config.reviewedPurePrefixCalls,
        });
        selectedDraws[selectedDraws.indexOf(previous)] = main;
      }
      if (selected.signature) {
        const previous = main;
        main = adaptStageSignature(main, selected.signature);
        selectedDraws[selectedDraws.indexOf(previous)] = main;
      } else if (main.params.length !== 4)
        throw new Error(
          `Painter ${selected.draw} needs an explicit argument adapter for its ${main.params.length}-argument signature`,
        );
      main.id.name = 'draw';
      if (selected.discardBooleanReturn) {
        const last = main.body.body.at(-1);
        if (last?.type !== 'ReturnStatement' || last.argument?.type !== 'BooleanLiteral')
          throw new Error('Expected an explicit final boolean painter return');
        main.body.body.pop();
      }
      if (selected.voidBooleanReturns) {
        const previous = main;
        main = voidRootBooleanReturns(main);
        selectedDraws[selectedDraws.indexOf(previous)] = main;
      }
    } else if (config.extension) {
      const extension = config.extension;
      if (extension.added.includes(scene.id)) {
        selectedDraws = selectedDraws.filter((node) => node.id.name === extension.name);
        selectedDraws[0].id.name = 'draw';
        const finalStatement = selectedDraws[0].body.body.at(-1);
        assert.equal(finalStatement?.type, 'ReturnStatement');
        assert.equal(finalStatement.argument?.value, true);
        selectedDraws[0].body.body.pop();
      } else if (!extension.existing.includes(scene.id)) {
        selectedDraws = selectedDraws.filter((node) => node.id.name === 'draw');
        selectedDraws[0] = omitLeadingPainter(selectedDraws[0], extension.name, {
          reviewedPurePrefixCalls: config.reviewedPurePrefixCalls,
          moduleNodes: ast.program.body,
        });
      }
    }
    const specialized = clarifyStageLocals(
      specializeScene(selectedDraws, scene.id, {
        foldLiteralStrings: config.foldStageIdStrings ?? !legacyPilotLayout,
        foldBooleanIdentities: config.foldBooleanIdentities ?? !legacyPilotLayout,
        preserveNumericLocals: config.preserveNumericLocals ?? false,
      }),
    );
    if (
      inspectSource(
        code({
          type: 'File',
          program: { type: 'Program', sourceType: 'module', directives: [], body: specialized },
        }),
      ).decomposition.unresolved.some((reason) => reason.includes('context bag'))
    )
      throw new Error(
        `${scene.id}: an opaque drawing context bag remains; flatten it before migration`,
      );
    const preferredFunctionName =
      'draw' +
      scene.id
        .split('-')
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join('');
    const main = specialized.find(
      (node) => node.type === 'FunctionDeclaration' && node.id.name === 'draw',
    );
    const functionName = stagePainterName(preferredFunctionName, specialized, main);
    main.id.name = functionName;
    const body = specialized.map((node) => (node === main ? exportNode(node) : node));
    const modules = { ...moduleNames, defaults: drawingNames };
    const cues = scene.beats.flatMap((beat) => beat.visual_cues ?? []).map((cue) => cue.id);
    const baseStageName = scene.id
      .split('-')
      .map((part, index) => (index ? part[0].toUpperCase() + part.slice(1) : part))
      .join('');
    let stageName = config.stageImportNames?.[scene.id] ?? baseStageName;
    if (config.suffixAllStageBindings || stageBindings.has(stageName)) stageName += 'Stage';
    while (stageBindings.has(stageName)) stageName += 'Stage';
    stageBindings.add(stageName);
    await emit(
      `${bundle}/stages/${scene.id}.mjs`,
      [
        ...makeImports(body, modules, originalImports, '../'),
        ...body,
        ...statements(
          `export default {id:'${scene.id}',draw:${functionName},cues:${JSON.stringify(cues)}};`,
        ),
      ],
      files,
    );
    sceneEntries.push({ id: scene.id, draw: functionName, stageName });
  }
  const imports = sceneEntries
    .map((scene) => `import ${scene.stageName} from './stages/${scene.id}.mjs';`)
    .join('\n');
  const exportGroups = new Map();
  const individualExports = publicNames
    .filter((name) => !publicFacades.has(name))
    .map((name) => {
      const module = Object.entries(moduleNames).find(([, names]) => names.includes(name))?.[0];
      if (!module) throw new Error(`Missing preserved public export ${name}`);
      if (!exportGroups.has(module)) exportGroups.set(module, []);
      exportGroups.get(module).push(name);
      return `export {${name}} from './${module}.mjs';`;
    })
    .join('\n');
  const helperExports = legacyPilotLayout
    ? individualExports
    : [...exportGroups]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([module, names]) => `export {${names.join(',')}} from './${module}.mjs';`)
        .join('\n');
  const validateModule = Object.entries(moduleNames).find(([, names]) =>
    names.includes('validateModel'),
  )?.[0];
  const entry = `import {defineCanvasLesson} from '../../lib/lesson-definition.mjs';\nimport {validateModel} from './${validateModule}.mjs';\n${imports}\n${helperExports}\nconst definition=defineCanvasLesson({id:'${id}',validateModel,scenes:[${sceneEntries.map((scene) => scene.stageName).join(',')}]});\n${publicFacades.size ? [...publicFacades.values()].join('\n') + '\n' : ''}export const draw=definition.draw;\nexport default definition;`;
  await emit(`${bundle}/index.mjs`, statements(entry), files);
  const shim = `export * from '../films/${id}/index.mjs';\nexport {default} from '../films/${id}/index.mjs';`;
  if (directDemo) {
    await emit(
      `${bundle}/demo.mjs`,
      [...makeImports([directDemo.demo], moduleNames, originalImports), directDemo.demo],
      files,
    );
    await emit(
      `videos/animations/${id}.mjs`,
      [
        ...makeImports(
          [directDemo.guard],
          { demo: ['runDemo'] },
          originalImports,
          `../films/${id}/`,
        ),
        ...statements(shim),
        directDemo.guard,
      ],
      files,
    );
  } else await emit(`videos/animations/${id}.mjs`, statements(shim), files);
  return {
    id,
    sourceSha256: config.sha256,
    publicNames: ['draw', ...publicNames].sort(),
    sceneIds: sceneEntries.map((scene) => scene.id),
    files,
  };
}

export async function runMigration(args) {
  const id = args.shift(),
    write = args.includes('--write');
  const refreshIndex = args.indexOf('--refresh');
  const refreshPath = refreshIndex >= 0 ? args[refreshIndex + 1] : undefined;
  if (refreshIndex >= 0) args.splice(refreshIndex, 2);
  const planIndex = args.indexOf('--plan');
  const planPath = planIndex >= 0 ? args[planIndex + 1] : undefined;
  if (planIndex >= 0) args.splice(planIndex, 2);
  if (args.some((arg) => arg !== '--write'))
    throw new Error(
      'Use migrate-pilot-lessons.mjs ID [--write] [--refresh previous-manifest.json]',
    );
  const previousManifest = refreshPath
    ? JSON.parse(await fs.readFile(refreshPath, 'utf8'))
    : undefined;
  const suppliedPlan = planPath ? JSON.parse(await fs.readFile(planPath, 'utf8')) : undefined;
  if (write && suppliedPlan && suppliedPlan.reviewed !== true)
    throw new Error(
      'The decomposition plan is still a draft; actual owner review is required before source writes',
    );
  const plan = await planPilot(id, previousManifest, suppliedPlan);
  if (write && previousManifest) {
    const archive = path.join(
      evidenceRoot,
      id,
      'generated-history',
      digest(JSON.stringify(previousManifest)),
    );
    for (const record of previousManifest.files) {
      const destination = path.join(archive, record.path);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(
        path.join(repository, record.path),
        destination,
        fs.constants.COPYFILE_EXCL,
      );
    }
    await fs.writeFile(
      path.join(archive, 'manifest.json'),
      JSON.stringify(previousManifest, null, 2) + '\n',
      { flag: 'wx' },
    );
  }
  const records = [];
  for (const [relative, contents] of plan.files) {
    const absolute = path.join(repository, relative);
    if (write) {
      await fs.mkdir(path.dirname(absolute), { recursive: true });
      const previous = previousManifest?.files.find((record) => record.path === relative);
      if (relative.startsWith('videos/animations/') || previous) {
        assert.equal(digest(await fs.readFile(absolute)), previous?.sha256 ?? plan.sourceSha256);
        await fs.writeFile(absolute, contents);
      } else await fs.writeFile(absolute, contents, { flag: 'wx' });
    }
    records.push({
      path: relative,
      sha256: digest(contents),
      lines: contents.split('\n').length - 1,
    });
  }
  return {
    id,
    write,
    sourceSha256: plan.sourceSha256,
    publicNames: plan.publicNames,
    sceneIds: plan.sceneIds,
    files: records,
  };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url)
  runMigration(process.argv.slice(2))
    .then((result) => process.stdout.write(JSON.stringify(result, null, 2) + '\n'))
    .catch((error) => {
      console.error(error.stack);
      process.exitCode = 1;
    });
