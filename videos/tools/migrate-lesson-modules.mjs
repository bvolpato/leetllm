#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';
import babelTraverse from '@babel/traverse';
import { format } from 'prettier';

const traverse = babelTraverse.default ?? babelTraverse;
const videosDirectory = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repositoryDirectory = path.dirname(videosDirectory);
const formatterOptions = JSON.parse(
  await fs.readFile(new URL('../.prettierrc.json', import.meta.url), 'utf8'),
);
const locationFields = new Set([
  'start',
  'end',
  'loc',
  'range',
  'extra',
  'leadingComments',
  'innerComments',
  'trailingComments',
]);
const digest = (value) => createHash('sha256').update(value).digest('hex');

function parseModule(source) {
  return parse(source, { sourceType: 'module', createImportExpressions: true });
}

export function semanticHash(source) {
  const program = parseModule(source).program;
  traverse(
    { type: 'File', program },
    {
      RegExpLiteral(nodePath) {
        nodePath.node.flags = [...nodePath.node.flags].sort().join('');
      },
      Program: removeRedundantEmptyStatements,
      BlockStatement: removeRedundantEmptyStatements,
      SwitchCase(nodePath) {
        nodePath.node.consequent = nodePath.node.consequent.filter(
          (statement) => statement.type !== 'EmptyStatement',
        );
      },
    },
  );
  return digest(
    JSON.stringify(program, (key, value) =>
      locationFields.has(key) ? undefined : typeof value === 'bigint' ? value.toString() : value,
    ),
  );
}

function removeRedundantEmptyStatements(nodePath) {
  // A loop's empty body is meaningful. Only statement-list entries are discarded.
  // Parsed directives are retained, so removing a directive barrier still fails.
  nodePath.node.body = nodePath.node.body.filter(
    (statement) => statement.type !== 'EmptyStatement',
  );
}

export function assertSameProgram(before, after) {
  if (semanticHash(before) !== semanticHash(after)) {
    throw new Error('Formatting changed the JavaScript AST; the source was not written');
  }
}

export async function formatSource(source, filename = 'lesson.mjs') {
  let previous = source;
  for (let pass = 0; pass < 4; pass++) {
    const code = await format(previous, {
      ...formatterOptions,
      filepath: filename,
      parser: 'babel',
    });
    assertSameProgram(source, code);
    if (code === previous) return code;
    previous = code;
  }
  throw new Error(`Formatter did not converge for ${filename}; no source was written`);
}

function sourceBinding(nodePath) {
  const binding = nodePath.scope.getBinding(nodePath.node.name);
  return binding?.path;
}

function isSceneId(nodePath, visited = new Set()) {
  if (nodePath.isIdentifier()) {
    const binding = sourceBinding(nodePath);
    if (!binding?.isVariableDeclarator() || visited.has(binding.node)) return false;
    visited.add(binding.node);
    return isSceneId(binding.get('init'), visited);
  }
  if (!nodePath.isMemberExpression()) return false;
  const property = nodePath.get('property');
  if (
    !(nodePath.node.computed
      ? property.isStringLiteral({ value: 'id' })
      : property.isIdentifier({ name: 'id' }))
  )
    return false;
  const object = nodePath.get('object');
  if (!object.isIdentifier()) return false;
  const binding = object.scope.getBinding(object.node.name);
  const owner = binding?.path.parentPath;
  return Boolean(owner?.isFunction() && owner.node.params[1] === binding.identifier);
}

function stringArray(nodePath) {
  if (nodePath.isIdentifier()) {
    const binding = sourceBinding(nodePath);
    if (!binding?.isVariableDeclarator()) return null;
    nodePath = binding.get('init');
  }
  if (!nodePath.isArrayExpression()) return null;
  const elements = nodePath.get('elements');
  return elements.every((element) => element.isStringLiteral())
    ? elements.map((element) => element.node.value)
    : null;
}

function selectedScenes(testPath) {
  const ids = new Set();
  const visit = (nodePath) => {
    if (nodePath.isBinaryExpression() && ['===', '=='].includes(nodePath.node.operator)) {
      for (const [field, other] of [
        ['left', 'right'],
        ['right', 'left'],
      ]) {
        if (isSceneId(nodePath.get(field)) && nodePath.get(other).isStringLiteral()) {
          ids.add(nodePath.node[other].value);
        }
      }
    }
    if (nodePath.isCallExpression()) {
      const callee = nodePath.get('callee');
      if (
        callee.isMemberExpression() &&
        callee.get('property').isIdentifier({ name: 'includes' }) &&
        nodePath.node.arguments.length === 1 &&
        isSceneId(nodePath.get('arguments.0'))
      ) {
        for (const id of stringArray(callee.get('object')) ?? []) ids.add(id);
      }
    }
  };
  visit(testPath);
  testPath.traverse({ BinaryExpression: visit, CallExpression: visit });
  return [...ids];
}

function freeBindings(branchPath) {
  const names = new Map();
  branchPath.traverse({
    ReferencedIdentifier(reference) {
      const name = reference.node.name;
      const binding = reference.scope.getBinding(name);
      if (!binding) return;
      const declaration = binding.path.node;
      if (declaration.start >= branchPath.node.start && declaration.end <= branchPath.node.end)
        return;
      names.set(name, {
        name,
        kind: binding.kind,
        scope: binding.scope.path.isProgram() ? 'module' : 'enclosing-function',
        reassigned: binding.constantViolations.length > 0,
      });
    },
  });
  return [...names.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function caseTerminates(statements) {
  let last = statements.at(-1);
  while (last?.type === 'BlockStatement') last = last.body.at(-1);
  return (
    last?.type === 'ReturnStatement' ||
    last?.type === 'ThrowStatement' ||
    (last?.type === 'BreakStatement' && !last.label)
  );
}

export function inspectSource(source) {
  const ast = parseModule(source);
  const imports = [];
  const dispatchers = [];
  const unresolved = new Set();
  const exported = new Set();
  const initializers = [];

  traverse(ast, {
    ImportDeclaration(nodePath) {
      imports.push({ source: nodePath.node.source.value, dynamic: false });
    },
    ImportExpression(nodePath) {
      const argument = nodePath.node.source;
      const literal = argument.type === 'StringLiteral';
      imports.push({ source: literal ? argument.value : null, dynamic: true });
      if (!literal) unresolved.add('Computed dynamic import requires manual dependency review');
    },
    CallExpression(nodePath) {
      const callee = nodePath.node.callee;
      if (
        callee.type === 'MemberExpression' &&
        callee.property.name === 'has' &&
        nodePath.get('arguments').some((argument) => isSceneId(argument))
      )
        unresolved.add('Set.has scene dispatch needs an explicit stage-to-painter route');
      for (const argument of nodePath.node.arguments) {
        if (argument.type !== 'ObjectExpression') continue;
        const names = argument.properties
          .filter((property) => property.type === 'ObjectProperty')
          .map((property) => property.key.name ?? property.key.value);
        if (
          names.includes('scene') &&
          names.filter((name) => ['ctx', 'api', 'state', 'scene'].includes(name)).length >= 2
        )
          unresolved.add(
            'Opaque drawing context bag must be flattened into explicit stage/helper arguments',
          );
      }
    },
    ExportNamedDeclaration(nodePath) {
      const declaration = nodePath.get('declaration');
      if (declaration.isFunctionDeclaration() || declaration.isClassDeclaration()) {
        if (declaration.node.id) exported.add(declaration.node.id.name);
      } else if (declaration.node) {
        for (const name of Object.keys(declaration.getBindingIdentifiers())) exported.add(name);
      }
      for (const specifier of nodePath.node.specifiers) {
        exported.add(specifier.exported.name ?? specifier.exported.value);
      }
      if (nodePath.node.source)
        imports.push({ source: nodePath.node.source.value, reexport: true });
    },
    ExportAllDeclaration(nodePath) {
      imports.push({ source: nodePath.node.source.value, reexport: true });
      unresolved.add('Star re-export namespace must be checked through its module graph');
    },
    ExportDefaultDeclaration() {
      exported.add('default');
    },
    SwitchStatement(nodePath) {
      if (!isSceneId(nodePath.get('discriminant'))) return;
      const branches = [];
      let sharedIds = [];
      for (const casePath of nodePath.get('cases')) {
        const test = casePath.get('test');
        if (!test.node) continue;
        if (!test.isStringLiteral()) {
          unresolved.add('Computed scene case requires manual decomposition');
          continue;
        }
        sharedIds.push(test.node.value);
        if (!casePath.node.consequent.length) continue;
        branches.push({
          ids: sharedIds,
          freeBindings: freeBindings(casePath),
          terminal: caseTerminates(casePath.node.consequent),
        });
        if (sharedIds.length > 1)
          unresolved.add('Shared scene case needs an explicit shared implementation');
        if (!caseTerminates(casePath.node.consequent))
          unresolved.add('Scene fallthrough requires manual decomposition');
        sharedIds = [];
      }
      dispatchers.push({ kind: 'switch', branches });
    },
    IfStatement(nodePath) {
      const ids = selectedScenes(nodePath.get('test'));
      if (!ids.length) return;
      dispatchers.push({
        kind: 'conditional',
        condition: source.slice(nodePath.node.test.start, nodePath.node.test.end),
        branches: [{ ids, freeBindings: freeBindings(nodePath.get('consequent')) }],
      });
    },
    Program(nodePath) {
      for (const statement of nodePath.node.body) {
        if (
          [
            'ForStatement',
            'ForOfStatement',
            'ForInStatement',
            'WhileStatement',
            'ExpressionStatement',
          ].includes(statement.type)
        ) {
          initializers.push({ type: statement.type, line: statement.loc.start.line });
        }
      }
    },
  });

  if (dispatchers.length)
    unresolved.add('Extract scene bodies and their lexical dependencies before switching entries');
  if (initializers.length)
    unresolved.add('Top-level executable initialization needs an explicit fixture builder');
  if (!dispatchers.length && exported.has('draw'))
    unresolved.add('Draw delegates through helpers; inspect their scene ownership');
  return {
    semanticSha256: semanticHash(source),
    imports,
    exports: [...exported].sort(),
    dispatchers,
    topLevelInitializers: initializers,
    decomposition: { status: 'manual-review-required', unresolved: [...unresolved] },
  };
}

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) files.push(...(await sourceFiles(path.join(directory, entry.name))));
    else if (entry.isFile() && entry.name.endsWith('.mjs'))
      files.push(path.join(directory, entry.name));
    else if (entry.isSymbolicLink()) throw new Error(`Refusing symbolic-link input: ${entry.name}`);
  }
  return files;
}

async function writeUnchangedFile(filename, before, after) {
  if ((await fs.readFile(filename, 'utf8')) !== before)
    throw new Error(`Source changed during formatting: ${filename}`);
  const temporary = `${filename}.migrate-${process.pid}.tmp`;
  let created = false;
  try {
    await fs.writeFile(temporary, after, { flag: 'wx', mode: (await fs.stat(filename)).mode });
    created = true;
    if ((await fs.readFile(filename, 'utf8')) !== before)
      throw new Error(`Source changed before replacement: ${filename}`);
    await fs.rename(temporary, filename);
  } finally {
    if (created) await fs.rm(temporary, { force: true });
  }
}

export async function inspectFile(filename, { write = false, check = false } = {}) {
  const absolute = path.resolve(filename);
  if (!absolute.startsWith(videosDirectory + path.sep) || !absolute.endsWith('.mjs')) {
    throw new Error('Only .mjs source files inside videos are accepted');
  }
  if ((await fs.lstat(absolute)).isSymbolicLink()) throw new Error('Refusing symbolic-link input');
  if ((await fs.realpath(absolute)) !== absolute)
    throw new Error('Refusing a symbolic-link parent path');
  const before = await fs.readFile(absolute, 'utf8');
  const after = await formatSource(before, absolute);
  const changed = before !== after;
  if (write && changed) await writeUnchangedFile(absolute, before, after);
  return {
    path: path.relative(repositoryDirectory, absolute),
    sourceSha256: digest(before),
    formattedSha256: digest(after),
    formatting: changed ? (write ? 'written' : 'required') : 'unchanged',
    checkPassed: !check || !changed,
    ...inspectSource(before),
  };
}

async function main(args) {
  const command = args.shift() ?? 'inspect';
  if (command === 'prepare') {
    const lessonIndex = args.indexOf('--lesson'),
      planIndex = args.indexOf('--plan');
    if (lessonIndex < 0 || planIndex < 0 || args.length !== 4)
      throw new Error('prepare needs --lesson ID --plan new-plan.json');
    const { prepareMigration } = await import('./migrate-pilot-lessons.mjs');
    const result = await prepareMigration(args[lessonIndex + 1], args[planIndex + 1]);
    process.stdout.write(
      JSON.stringify(
        { id: result.id, reviewed: result.reviewed, unresolved: result.unresolved },
        null,
        2,
      ) + '\n',
    );
    return;
  }
  if (command === 'split') {
    const lessonIndex = args.indexOf('--lesson');
    if (lessonIndex < 0) throw new Error('split needs --lesson ID and an explicit reviewed --plan');
    const id = args[lessonIndex + 1];
    args.splice(lessonIndex, 2);
    if (!args.includes('--plan'))
      throw new Error(
        'split needs an explicit reviewed --plan; inspection does not authorize a decomposition',
      );
    const reportIndex = args.indexOf('--report');
    const report = reportIndex >= 0 ? args[reportIndex + 1] : undefined;
    if (reportIndex >= 0) args.splice(reportIndex, 2);
    const { runMigration } = await import('./migrate-pilot-lessons.mjs');
    const output = JSON.stringify(await runMigration([id, ...args]), null, 2) + '\n';
    if (report) await fs.writeFile(report, output, { flag: 'wx' });
    else process.stdout.write(output);
    return;
  }
  if (!['inspect', 'check', 'format'].includes(command))
    throw new Error('Use inspect, check, or format');
  const files = [];
  let write = false;
  let all = false;
  let report;
  while (args.length) {
    const option = args.shift();
    if (option === '--write') write = true;
    else if (option === '--all') all = true;
    else if (option === '--file') files.push(path.resolve(args.shift() ?? ''));
    else if (option === '--report') report = args.shift();
    else if (option === '--lesson') {
      const id = args.shift();
      if (!/^[a-z0-9][a-z0-9-]*$/.test(id ?? '')) throw new Error('Invalid lesson ID');
      files.push(path.join(videosDirectory, 'animations', `${id}.mjs`));
      const bundle = path.join(videosDirectory, 'films', id);
      try {
        files.push(...(await sourceFiles(bundle)));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    } else throw new Error(`Unknown option: ${option}`);
  }
  if (write && command !== 'format') throw new Error('--write is only available with format');
  if (all) files.push(...(await sourceFiles(path.join(videosDirectory, 'animations'))));
  if (!files.length)
    throw new Error(
      'Choose --lesson ID, --file PATH, or --all; inspection never writes by default',
    );
  const results = [];
  for (const filename of [...new Set(files)].sort()) {
    try {
      results.push(await inspectFile(filename, { write, check: command === 'check' }));
    } catch (error) {
      results.push({
        path: path.relative(repositoryDirectory, filename),
        error: error.message,
        checkPassed: false,
      });
      process.exitCode = 1;
      if (write) break;
    }
  }
  const output = JSON.stringify({ schemaVersion: 1, command, write, results }, null, 2) + '\n';
  if (report) await fs.writeFile(report, output, { flag: 'wx' });
  else process.stdout.write(output);
  if (command === 'check' && results.some((result) => !result.checkPassed)) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
