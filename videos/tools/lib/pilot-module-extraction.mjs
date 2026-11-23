import { parse } from '@babel/parser';
import babelTraverse from '@babel/traverse';
import babelGenerate from '@babel/generator';

const traverse = babelTraverse.default ?? babelTraverse;
const generate = babelGenerate.default ?? babelGenerate;
export const program = (body) => ({
  type: 'File',
  program: { type: 'Program', sourceType: 'module', body, directives: [] },
});
export const code = (node) => generate(node, { comments: true }).code;
export const statements = (source) => parse(source, { sourceType: 'module' }).program.body;
export const clone = (node) => structuredClone(node);
const literal = (value) =>
  typeof value === 'string' ? { type: 'StringLiteral', value } : { type: 'BooleanLiteral', value };

export function declaredNames(node) {
  const ast = program([clone(node)]),
    names = [];
  traverse(ast, {
    Program(p) {
      p.scope.crawl();
      names.push(...Object.keys(p.scope.bindings));
      p.stop();
    },
  });
  return names;
}

export function externalNames(nodes) {
  const names = new Set();
  traverse(program(nodes.map(clone)), {
    ReferencedIdentifier(p) {
      if (!p.scope.getBinding(p.node.name)) names.add(p.node.name);
    },
  });
  return names;
}

export function stagePainterName(preferredName, nodes, primary) {
  const occupied = new Set([
    ...nodes.filter((node) => node !== primary).flatMap(declaredNames),
    ...externalNames(nodes),
  ]);
  if (!occupied.has(preferredName)) return preferredName;
  let candidate = preferredName + 'Stage';
  for (let suffix = 2; occupied.has(candidate); suffix++)
    candidate = preferredName + 'Stage' + suffix;
  return candidate;
}

export function publicStageDrawFacade(functionNode, sceneIds) {
  if (
    functionNode?.type !== 'FunctionDeclaration' ||
    functionNode.async ||
    functionNode.generator ||
    functionNode.params.length !== 4 ||
    functionNode.params.some(
      (parameter) => parameter.type !== 'Identifier' || parameter.name === 'definition',
    ) ||
    !Array.isArray(sceneIds) ||
    !sceneIds.length ||
    sceneIds.some((id) => typeof id !== 'string') ||
    new Set(sceneIds).size !== sceneIds.length
  )
    throw new Error('A public stage facade needs a four-argument painter and unique stage IDs');
  const root = clone(functionNode);
  traverse(program([root]), {
    'ReturnStatement|ThrowStatement'(p) {
      if (p.getFunctionParent()?.node === root)
        throw new Error(
          'A no-op public stage facade cannot replace an explicit painter return or throw',
        );
    },
  });
  const parameters = root.params.map((parameter) => parameter.name);
  return statements(`export function ${root.id.name}(${parameters.join(',')}) {
    if (${JSON.stringify(sceneIds)}.includes(${parameters[1]}.id))
      return definition.draw(${parameters.join(',')});
  }`)[0];
}

export function assertNoSharedSceneDispatch(nodes, group) {
  const comparisons = new Set(['===', '!==', '==', '!=', '<', '<=', '>', '>=', 'in', 'instanceof']);
  traverse(program(nodes.map(clone)), {
    MemberExpression(p) {
      const object = p.node.object;
      const isScene =
        (object.type === 'Identifier' && object.name === 'scene') ||
        (object.type === 'MemberExpression' && object.property.name === 'scene');
      if (!isScene || p.node.property.name !== 'id') return;
      let parent = p.parentPath;
      // A scene ID can be part of an ordinary cue-key string. Follow string
      // construction only far enough to catch a comparison routing on that key.
      while (parent.isBinaryExpression({ operator: '+' }) || parent.isTemplateLiteral())
        parent = parent.parentPath;
      if (
        (parent.isBinaryExpression() && comparisons.has(parent.node.operator)) ||
        parent.isSwitchStatement() ||
        parent.isConditionalExpression()
      )
        throw new Error(
          `Remaining scene dispatcher in shared ${group} requires explicit per-stage extraction`,
        );
    },
  });
}

function staticValue(node) {
  if (!node) return { known: false };
  if (
    node.type === 'StringLiteral' ||
    node.type === 'BooleanLiteral' ||
    node.type === 'NumericLiteral'
  )
    return { known: true, value: node.value };
  if (node.type === 'ArrayExpression') {
    const values = node.elements.map(staticValue);
    if (values.every((x) => x.known)) return { known: true, value: values.map((x) => x.value) };
  }
  return { known: false };
}

function isBooleanExpression(node) {
  if (node.type === 'BooleanLiteral') return true;
  if (node.type === 'UnaryExpression' && node.operator === '!') return true;
  if (
    node.type === 'BinaryExpression' &&
    ['===', '!==', '==', '!=', '<', '<=', '>', '>=', 'in', 'instanceof'].includes(node.operator)
  )
    return true;
  return (
    node.type === 'LogicalExpression' &&
    isBooleanExpression(node.left) &&
    isBooleanExpression(node.right)
  );
}

export function specializeScene(
  nodes,
  sceneId,
  { foldLiteralStrings = true, foldBooleanIdentities = true, preserveNumericLocals = false } = {},
) {
  const ast = program(nodes.map(clone));
  const drawParameters = new Set();
  traverse(ast, {
    Function(p) {
      const parent = p.parentPath.isExportNamedDeclaration()
        ? p.parentPath.parentPath
        : p.parentPath;
      if (
        !parent.isProgram() ||
        p.node.params.length !== 4 ||
        p.node.params[1]?.type !== 'Identifier' ||
        p.node.params[1].name !== 'scene'
      )
        return;
      drawParameters.add(p.scope.getBinding('scene').identifier);
    },
  });
  traverse(ast, {
    MemberExpression(p) {
      if (
        !p.node.computed &&
        p.node.object.type === 'Identifier' &&
        p.node.object.name === 'scene' &&
        p.node.property.name === 'id' &&
        drawParameters.has(p.scope.getBinding('scene')?.identifier)
      )
        p.replaceWith(literal(sceneId));
    },
  });
  // Only syntactically literal expressions are folded. Timing/model arithmetic stays intact.
  for (let pass = 0; pass < 6; pass++)
    traverse(ast, {
      ReferencedIdentifier(p) {
        const binding = p.scope.getBinding(p.node.name);
        if (!binding?.constant || !binding.path.isVariableDeclarator()) return;
        const value = staticValue(binding.path.node.init);
        if (preserveNumericLocals && typeof value.value === 'number') return;
        if (value.known && ['boolean', 'string', 'number'].includes(typeof value.value)) {
          p.replaceWith(
            typeof value.value === 'number'
              ? { type: 'NumericLiteral', value: value.value }
              : literal(value.value),
          );
        }
      },
      BinaryExpression: {
        exit(p) {
          const a = staticValue(p.node.left),
            b = staticValue(p.node.right);
          if (
            foldLiteralStrings &&
            p.node.operator === '+' &&
            typeof a.value === 'string' &&
            typeof b.value === 'string' &&
            a.known &&
            b.known
          ) {
            p.replaceWith(literal(a.value + b.value));
            return;
          }
          if (!a.known || !b.known || !['===', '!=='].includes(p.node.operator)) return;
          p.replaceWith(
            literal(p.node.operator === '===' ? a.value === b.value : a.value !== b.value),
          );
        },
      },
      TemplateLiteral: {
        exit(p) {
          if (
            !foldLiteralStrings ||
            p.parentPath.isTaggedTemplateExpression() ||
            !p.node.expressions.every((expression) => expression.type === 'StringLiteral') ||
            p.node.quasis.some((quasi) => quasi.value.cooked === null)
          )
            return;
          let value = p.node.quasis[0].value.cooked;
          p.node.expressions.forEach((expression, index) => {
            value += expression.value + p.node.quasis[index + 1].value.cooked;
          });
          p.replaceWith(literal(value));
        },
      },
      CallExpression: {
        exit(p) {
          const c = p.node.callee;
          if (
            c.type !== 'MemberExpression' ||
            c.computed ||
            c.property.name !== 'includes' ||
            p.node.arguments.length !== 1
          )
            return;
          const binding = c.object.type === 'Identifier' ? p.scope.getBinding(c.object.name) : null;
          const a = staticValue(
              binding?.constant && binding.path.isVariableDeclarator()
                ? binding.path.node.init
                : c.object,
            ),
            b = staticValue(p.node.arguments[0]);
          if (a.known && Array.isArray(a.value) && b.known) {
            for (const reference of binding?.referencePaths ?? []) {
              const member = reference.parentPath;
              const call = member.parentPath;
              if (
                !member.isMemberExpression() ||
                member.node.computed ||
                member.node.object !== reference.node ||
                member.node.property.name !== 'includes' ||
                !call.isCallExpression() ||
                call.node.callee !== member.node
              )
                throw new Error(
                  `Mutable or escaping routing array ${binding.identifier.name} cannot be specialized`,
                );
            }
            p.replaceWith(literal(a.value.includes(b.value)));
          }
        },
      },
      UnaryExpression: {
        exit(p) {
          const a = staticValue(p.node.argument);
          if (p.node.operator === '!' && a.known) p.replaceWith(literal(!a.value));
        },
      },
      LogicalExpression: {
        exit(p) {
          const a = staticValue(p.node.left);
          const right = staticValue(p.node.right);
          if (
            foldBooleanIdentities &&
            isBooleanExpression(p.node.left) &&
            right.known &&
            ((p.node.operator === '||' && right.value === false) ||
              (p.node.operator === '&&' && right.value === true))
          ) {
            p.replaceWith(p.node.left);
            return;
          }
          if (!a.known) return;
          if (p.node.operator === '&&') {
            p.replaceWith(a.value ? p.node.right : p.node.left);
            return;
          }
          if (p.node.operator === '||') p.replaceWith(a.value ? p.node.left : p.node.right);
        },
      },
      ConditionalExpression: {
        exit(p) {
          const a = staticValue(p.node.test);
          if (a.known) p.replaceWith(a.value ? p.node.consequent : p.node.alternate);
        },
      },
      IfStatement: {
        exit(p) {
          const a = staticValue(p.node.test);
          if (a.known) {
            if (a.value) p.replaceWith(p.node.consequent);
            else if (p.node.alternate) p.replaceWith(p.node.alternate);
            else p.remove();
          }
        },
      },
      SwitchStatement: {
        exit(p) {
          const value = staticValue(p.node.discriminant);
          if (!value.known) return;
          const cases = p.node.cases;
          let i = cases.findIndex((c) => c.test && staticValue(c.test).value === value.value);
          if (i < 0) i = cases.findIndex((c) => !c.test);
          if (i < 0) {
            p.remove();
            return;
          }
          const body = [];
          for (; i < cases.length; i++) {
            const entries = clone(cases[i].consequent);
            const block = entries.at(-1);
            const statements = block?.type === 'BlockStatement' ? block.body : entries;
            const last = statements.at(-1);
            if (last?.type === 'BreakStatement' && !last.label) {
              statements.pop();
              body.push(...entries);
              break;
            }
            body.push(...entries);
            if (last?.type === 'ReturnStatement' || last?.type === 'ThrowStatement') break;
          }
          p.replaceWith({ type: 'BlockStatement', body, directives: [] });
        },
      },
    });
  return ast.program.body;
}

export function simplifyUnreachableIfTests(nodes) {
  const ast = program(nodes.map(clone));
  traverse(ast, {
    IfStatement: {
      exit(p) {
        const test = p.node.test;
        if (test.type !== 'LogicalExpression' || test.operator !== '&&') return;
        if (test.right.type !== 'BooleanLiteral') return;
        if (test.right.value) {
          p.node.test = test.left;
          return;
        }
        // An unreachable var still creates a function binding. Keep that branch intact.
        let hoistedVar =
          p.node.consequent.type === 'VariableDeclaration' && p.node.consequent.kind === 'var';
        p.get('consequent').traverse({
          Function(inner) {
            inner.skip();
          },
          VariableDeclaration(declaration) {
            if (declaration.node.kind === 'var') hoistedVar = true;
          },
        });
        if (hoistedVar) return;
        const evaluation = {
          type: 'ExpressionStatement',
          expression: {
            type: 'UnaryExpression',
            operator: 'void',
            prefix: true,
            argument: test.left,
          },
        };
        p.replaceWith(
          p.node.alternate
            ? { type: 'BlockStatement', body: [evaluation, p.node.alternate], directives: [] }
            : evaluation,
        );
      },
    },
  });
  return ast.program.body;
}

function projectSceneIdCapture(functionNode, helperMap, captures) {
  const entries = Object.entries(captures);
  if (entries.length !== 1 || entries[0][1] !== 'scene.id')
    throw new Error('Drawing helper captures currently support one explicit scene.id projection');
  const alias = entries[0][0];
  if (!/^[A-Za-z_$][\w$]*$/.test(alias) || ['ctx', 'api', 'scene'].includes(alias))
    throw new Error('Scene-ID capture needs a distinct ordinary identifier');
  const ast = program([clone(functionNode)]);
  traverse(ast, {
    Function(root) {
      if (root.node !== ast.program.body[0]) return;
      if (root.node.params[1]?.name !== 'scene')
        throw new Error('Scene-ID capture requires the actual draw scene parameter');
      const sceneBinding = root.scope.getBinding('scene');
      root.traverse({
        Identifier(p) {
          if (p.node.name === alias && (p.isBindingIdentifier() || p.isReferencedIdentifier()))
            throw new Error(`Drawing helper capture alias ${alias} is already used`);
        },
      });
      const names = Object.keys(helperMap);
      const records = new Map(
        names.map((name, index) => {
          const binding = root.scope.getBinding(name);
          if (!binding) throw new Error(`Missing drawing helper ${name}`);
          const fn = binding.path.isVariableDeclarator() ? binding.path.get('init') : binding.path;
          if (!fn.isFunction()) throw new Error(`Non-function drawing helper ${name}`);
          return [name, { binding, fn, index, needsCapture: false, dependencies: new Set() }];
        }),
      );
      const ownerFor = (reference) =>
        reference.findParent((p) =>
          [...records.values()].some((record) => record.fn.node === p.node),
        );
      const isSceneId = (p) =>
        !p.node.computed &&
        p.node.object.type === 'Identifier' &&
        p.node.object.name === 'scene' &&
        p.node.property.name === 'id' &&
        p.scope.getBinding('scene') === sceneBinding;
      for (const record of records.values()) {
        record.fn.traverse({
          MemberExpression(p) {
            if (isSceneId(p)) record.needsCapture = true;
          },
        });
      }
      for (const [name, record] of records)
        for (const reference of record.binding.referencePaths) {
          if (!reference.parentPath.isCallExpression() || reference.key !== 'callee')
            throw new Error(`Drawing helper ${name} escapes its direct calls`);
          const owner = ownerFor(reference);
          const caller =
            owner && [...records.values()].find((value) => value.fn.node === owner.node);
          if (caller) {
            // The legacy lifter rewrites direct dependencies before copying callers.
            // Refuse forward/recursive calls rather than silently missing explicit arguments.
            if (record.index >= caller.index)
              throw new Error(
                'Projected drawing helpers need dependency-first order without recursion',
              );
            caller.dependencies.add(name);
          }
        }
      for (const record of records.values())
        if ([...record.dependencies].some((name) => records.get(name).needsCapture))
          record.needsCapture = true;
      if (![...records.values()].some((record) => record.needsCapture))
        throw new Error('The explicit scene.id capture is unused by the selected drawing helpers');
      for (const record of records.values())
        if (record.needsCapture) {
          record.fn.traverse({
            MemberExpression(p) {
              if (isSceneId(p)) p.replaceWith({ type: 'Identifier', name: alias });
            },
          });
          record.fn.node.params.unshift({ type: 'Identifier', name: alias });
          for (const reference of record.binding.referencePaths)
            reference.parentPath.node.arguments.unshift({ type: 'Identifier', name: alias });
        }
      root.node.body.body.unshift(statements(`const ${alias}=scene.id;`)[0]);
      root.stop();
    },
  });
  return ast.program.body[0];
}

export function liftDrawingHelpers(
  functionNode,
  helperMap,
  { captures = {}, apiAliases = {} } = {},
) {
  if (Object.keys(captures).length)
    functionNode = projectSceneIdCapture(functionNode, helperMap, captures);
  const ast = program([clone(functionNode)]),
    helpers = [];
  traverse(ast, {
    Function(p) {
      if (p.node !== ast.program.body[0]) return;
      const scope = p.scope;
      const helperRoots = new Set(
        Object.keys(helperMap).map((name) => {
          const binding = scope.getBinding(name);
          return binding?.path.isVariableDeclarator() ? binding.path.node.init : binding?.path.node;
        }),
      );
      for (const [alias, field] of Object.entries(apiAliases)) {
        const binding = scope.getOwnBinding(alias);
        const declaration = binding?.path;
        const property =
          declaration?.isVariableDeclarator() && declaration.node.id.type === 'ObjectPattern'
            ? declaration.node.id.properties.find(
                (property) =>
                  property.type === 'ObjectProperty' &&
                  !property.computed &&
                  property.key.name === field &&
                  property.value.type === 'Identifier' &&
                  property.value.name === alias,
              )
            : null;
        if (
          !['C', 'components', 'teaching'].includes(field) ||
          !binding?.constant ||
          !property ||
          declaration.node.init?.type !== 'Identifier' ||
          declaration.node.init.name !== 'api' ||
          declaration.scope.getBinding('api') !== scope.getBinding('api')
        )
          throw new Error(
            `Helper API alias ${alias} must be a constant destructuring of the actual api.${field}`,
          );
        for (const reference of binding.referencePaths) {
          const owner = reference.findParent((parent) => helperRoots.has(parent.node));
          if (owner && reference.scope.getBinding('api') !== scope.getBinding('api'))
            throw new Error(`Helper API alias ${alias} crosses a shadowed api parameter`);
        }
      }
      const aliases = new Set();
      for (const [name, newName] of Object.entries(helperMap)) {
        if (aliases.has(newName)) throw new Error(`Duplicate drawing helper alias ${newName}`);
        aliases.add(newName);
        const binding = scope.getBinding(name);
        if (!binding) throw new Error(`Missing drawing helper ${name}`);
        if (newName === name) continue;
        for (const reference of binding.referencePaths) {
          const captured = reference.scope.getBinding(newName);
          if (captured && captured !== binding)
            throw new Error(
              `Drawing helper alias capture: ${name} -> ${newName}; choose a distinct alias`,
            );
        }
        p.traverse({
          ReferencedIdentifier(reference) {
            if (reference.node.name === newName && !reference.scope.getBinding(newName))
              throw new Error(
                `Drawing helper alias ${newName} would capture an existing external reference`,
              );
          },
        });
      }
      for (const [name, newName] of Object.entries(helperMap)) {
        const binding = scope.getBinding(name);
        if (!binding) throw new Error(`Missing drawing helper ${name}`);
        let helper;
        if (binding.path.isVariableDeclarator()) {
          const init = binding.path.node.init;
          if (!['ArrowFunctionExpression', 'FunctionExpression'].includes(init?.type))
            throw new Error(`Non-function drawing helper ${name}`);
          helper = {
            type: 'FunctionDeclaration',
            id: { type: 'Identifier', name: newName },
            params: clone(init.params),
            generator: false,
            async: init.async,
            body:
              init.body.type === 'BlockStatement'
                ? clone(init.body)
                : {
                    type: 'BlockStatement',
                    body: [{ type: 'ReturnStatement', argument: clone(init.body) }],
                    directives: [],
                  },
          };
        } else if (binding.path.isFunctionDeclaration()) {
          helper = clone(binding.path.node);
          helper.id.name = newName;
        } else throw new Error(`Unsupported helper binding ${name}`);
        helper.params.unshift(...statements('function args(ctx, api) {}')[0].params);
        helpers.push(helper);
        for (const reference of binding.referencePaths) {
          if (!reference.parentPath.isCallExpression() || reference.key !== 'callee')
            throw new Error(`Drawing helper ${name} escapes its direct calls`);
          reference.node.name = newName;
          reference.parentPath.node.arguments.unshift(
            { type: 'Identifier', name: 'ctx' },
            { type: 'Identifier', name: 'api' },
          );
        }
        binding.path.remove();
      }
      p.stop();
    },
  });
  // Lifted helpers have explicit Canvas/API arguments, not a hidden closure/context object.
  const lifted = program(helpers);
  traverse(lifted, {
    ReferencedIdentifier(p) {
      if (p.scope.getBinding(p.node.name)) return;
      const replacements = {
        C: 'api.C',
        c: 'api.components',
        t: 'api.teaching',
        g: 'api.teaching',
        ...Object.fromEntries(
          Object.entries(apiAliases).map(([alias, field]) => [alias, `api.${field}`]),
        ),
      };
      if (replacements[p.node.name])
        p.replaceWith(
          statements(`const value=${replacements[p.node.name]};`)[0].declarations[0].init,
        );
      else if (helperMap[p.node.name]) {
        if (!p.parentPath.isCallExpression() || p.key !== 'callee')
          throw new Error(`Shared helper ${p.node.name} escapes`);
        p.node.name = helperMap[p.node.name];
        p.parentPath.node.arguments.unshift(
          { type: 'Identifier', name: 'ctx' },
          { type: 'Identifier', name: 'api' },
        );
      }
    },
  });
  return {
    draw: ast.program.body[0],
    helpers: lifted.program.body.map((node) => ({
      type: 'ExportNamedDeclaration',
      declaration: node,
      specifiers: [],
      source: null,
    })),
  };
}

export function clarifyStageLocals(nodes) {
  const ast = program(nodes.map(clone));
  traverse(ast, {
    FunctionDeclaration(p) {
      if (p.node.params.length !== 4 || p.node.params[1]?.name !== 'scene') return;
      for (const [before, after] of Object.entries({
        C: 'themeColors',
        c: 'components',
        t: 'teaching',
        g: 'teaching',
        b: 'currentBeat',
        p: 'progress',
        s: 'phaseForBeat',
        P: 'cueProgress',
        D: 'resultComplete',
      })) {
        if (p.scope.hasOwnBinding(before)) {
          const binding = p.scope.getBinding(before);
          const semanticName =
            before === 's' &&
            !['ArrowFunctionExpression', 'FunctionExpression'].includes(
              binding.path.node.init?.type,
            )
              ? 'modelState'
              : after;
          const usedNames = new Set();
          p.traverse({
            Identifier(reference) {
              if (reference.isBindingIdentifier() || reference.isReferencedIdentifier())
                usedNames.add(reference.node.name);
            },
          });
          let destination = semanticName;
          for (let suffix = 2; usedNames.has(destination); suffix++)
            destination = semanticName + suffix;
          p.scope.rename(before, destination);
        }
      }
    },
    BlockStatement: {
      exit(p) {
        while (p.node.body.length === 1 && p.node.body[0].type === 'BlockStatement')
          p.node.body = p.node.body[0].body;
      },
    },
  });
  for (let pass = 0; pass < 4; pass++) {
    traverse(ast, {
      Program(p) {
        p.scope.crawl();
      },
    });
    traverse(ast, {
      VariableDeclarator(p) {
        const owner = p.getFunctionParent();
        if (!owner || !owner.isFunctionDeclaration() || owner.node.params[1]?.name !== 'scene')
          return;
        if (p.parentPath.parentPath.node !== owner.node.body) return;
        if (p.node.id.type === 'ObjectPattern' && p.node.init?.name === 'api') {
          p.node.id.properties = p.node.id.properties.filter(
            (property) =>
              property.type !== 'ObjectProperty' ||
              p.scope.getBinding(property.value.name)?.referenced,
          );
          if (!p.node.id.properties.length) p.remove();
          return;
        }
        if (p.node.id.type !== 'Identifier' || p.scope.getBinding(p.node.id.name)?.referenced)
          return;
        if (
          [
            'ArrowFunctionExpression',
            'BooleanLiteral',
            'StringLiteral',
            'NumericLiteral',
            'ArrayExpression',
          ].includes(p.node.init?.type)
        )
          p.remove();
      },
    });
  }
  return ast.program.body;
}

export function createFixtureBuilder(name, nodes, returnedNames) {
  const valid = /^[A-Za-z_$][\w$]*$/;
  if (
    !valid.test(name) ||
    !returnedNames.length ||
    returnedNames.some((binding) => !valid.test(binding)) ||
    new Set(returnedNames).size !== returnedNames.length ||
    returnedNames.includes(name)
  )
    throw new Error(
      'Fixture builders need a fresh function name and distinct returned binding names',
    );
  const body = nodes.map((node) => clone(node.declaration ?? node));
  if (body.some((node) => node.type.startsWith('Import') || node.type.startsWith('Export')))
    throw new Error('A fixture body cannot contain module import/re-export statements');
  const properties = returnedNames.map((binding) => ({
    type: 'ObjectProperty',
    key: { type: 'Identifier', name: binding },
    value: { type: 'Identifier', name: binding },
    computed: false,
    shorthand: true,
  }));
  const builder = {
    type: 'FunctionDeclaration',
    id: { type: 'Identifier', name },
    params: [],
    async: false,
    generator: false,
    body: {
      type: 'BlockStatement',
      directives: [],
      body: [
        ...body,
        { type: 'ReturnStatement', argument: { type: 'ObjectExpression', properties } },
      ],
    },
  };
  const capture = {
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [
      {
        type: 'VariableDeclarator',
        id: { type: 'ObjectPattern', properties: clone(properties) },
        init: { type: 'CallExpression', callee: { type: 'Identifier', name }, arguments: [] },
      },
    ],
  };
  return [builder, capture];
}

export function splitDirectDemoEntry(node) {
  const expected = statements(
    `if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--demo')) {}`,
  )[0];
  if (
    node?.type !== 'IfStatement' ||
    node.alternate ||
    node.consequent.type !== 'BlockStatement' ||
    code(node.test) !== code(expected.test)
  )
    throw new Error('Only the exact file-origin-guarded --demo entry can be split automatically');
  const demo = statements('export function runDemo() {}')[0];
  demo.declaration.body = clone(node.consequent);
  const guard = clone(node);
  guard.consequent = statements('{ runDemo(); }')[0];
  return { demo, guard };
}

export function adaptStageSignature(functionNode, signature) {
  if (signature !== 'ctx-state-api') throw new Error(`Unknown stage argument adapter ${signature}`);
  const node = clone(functionNode);
  if (node.params.length !== 3)
    throw new Error('ctx-state-api adapter requires exactly3 existing parameters');
  const names = new Set();
  traverse(program([node]), {
    Identifier(p) {
      names.add(p.node.name);
      if (p.isReferencedIdentifier({ name: 'arguments' }))
        throw new Error('arguments-dependent painters require a manual wrapper');
    },
    ThisExpression() {
      throw new Error('this-dependent painters require a manual wrapper');
    },
  });
  let argumentName = 'scene';
  while (names.has(argumentName))
    argumentName = 'narration' + argumentName[0].toUpperCase() + argumentName.slice(1);
  node.params.splice(1, 0, { type: 'Identifier', name: argumentName });
  return node;
}

export function voidRootBooleanReturns(functionNode) {
  const ast = program([clone(functionNode)]),
    root = ast.program.body[0];
  traverse(ast, {
    ReturnStatement(p) {
      if (p.getFunctionParent()?.node === root && p.node.argument?.type === 'BooleanLiteral')
        p.node.argument = null;
    },
  });
  return root;
}

function purePrefixExpression(node, reviewedCalls = new Set()) {
  if (!node) return true;
  if (
    [
      'Identifier',
      'StringLiteral',
      'NumericLiteral',
      'BooleanLiteral',
      'NullLiteral',
      'ArrowFunctionExpression',
      'FunctionExpression',
    ].includes(node.type)
  )
    return true;
  if (['MemberExpression', 'OptionalMemberExpression'].includes(node.type))
    return (
      purePrefixExpression(node.object, reviewedCalls) &&
      (!node.computed || purePrefixExpression(node.property, reviewedCalls))
    );
  if (node.type === 'UnaryExpression' && node.operator !== 'delete')
    return purePrefixExpression(node.argument, reviewedCalls);
  if (['BinaryExpression', 'LogicalExpression'].includes(node.type))
    return (
      purePrefixExpression(node.left, reviewedCalls) &&
      purePrefixExpression(node.right, reviewedCalls)
    );
  if (node.type === 'ConditionalExpression')
    return (
      purePrefixExpression(node.test, reviewedCalls) &&
      purePrefixExpression(node.consequent, reviewedCalls) &&
      purePrefixExpression(node.alternate, reviewedCalls)
    );
  if (node.type === 'ArrayExpression')
    return node.elements.every((element) => purePrefixExpression(element, reviewedCalls));
  if (node.type === 'ObjectExpression')
    return node.properties.every(
      (property) =>
        property.type === 'ObjectProperty' &&
        (!property.computed || purePrefixExpression(property.key, reviewedCalls)) &&
        purePrefixExpression(property.value, reviewedCalls),
    );
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    reviewedCalls.has(node.callee.name)
  )
    return node.arguments.every((argument) => purePrefixExpression(argument, reviewedCalls));
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    node.callee.object.type === 'Identifier'
  ) {
    const allowed = {
      api: ['clamp', 'phase', 'lerp'],
      Math: [
        'abs',
        'min',
        'max',
        'floor',
        'ceil',
        'round',
        'sqrt',
        'exp',
        'log',
        'log1p',
        'sin',
        'cos',
        'tan',
        'tanh',
        'pow',
        'sign',
      ],
    };
    return (
      allowed[node.callee.object.name]?.includes(node.callee.property.name) &&
      node.arguments.every((argument) => purePrefixExpression(argument, reviewedCalls))
    );
  }
  return false;
}

function scopedModule(functionNode, moduleNodes) {
  return program([
    ...moduleNodes
      .filter((node) => {
        const declaration = node.declaration ?? node;
        return (
          declaration !== functionNode &&
          !(
            declaration.type === 'FunctionDeclaration' &&
            declaration.id.name === functionNode.id.name
          )
        );
      })
      .map(clone),
    clone(functionNode),
  ]);
}

function reviewedPrefixCalls(functionNode, options) {
  const names = options.reviewedPurePrefixCalls ?? [];
  if (!names.length) return new Set();
  const ast = scopedModule(functionNode, options.moduleNodes ?? []);
  traverse(ast, {
    Program(p) {
      p.scope.crawl();
      const root = p.get('body').at(-1);
      for (const name of names) {
        if (typeof name !== 'string') throw new Error('Reviewed prefix call names must be strings');
        const binding = p.scope.getBinding(name);
        if (
          !binding?.path.isFunctionDeclaration() ||
          !binding.constant ||
          binding.path.node.async ||
          binding.path.node.generator ||
          root.scope.getBinding(name) !== binding
        )
          throw new Error(
            `Reviewed prefix call ${name} must resolve to an immutable module function`,
          );
      }
      p.stop();
    },
  });
  return new Set(names);
}

function leadingProbeIndex(node, reviewedCalls) {
  let probeIndex = 0;
  while (
    node.body.body[probeIndex]?.type === 'VariableDeclaration' &&
    node.body.body[probeIndex].declarations.every((declaration) =>
      purePrefixExpression(declaration.init, reviewedCalls),
    )
  )
    probeIndex++;
  return probeIndex;
}

function exactRootCall(call, name, params) {
  return (
    call?.type === 'CallExpression' &&
    call.callee.type === 'Identifier' &&
    call.callee.name === name &&
    call.arguments.length === params.length &&
    call.arguments.every(
      (argument, index) =>
        argument.type === 'Identifier' &&
        params[index].type === 'Identifier' &&
        argument.name === params[index].name,
    )
  );
}

export function omitLeadingPainter(functionNode, painter, options = {}) {
  const node = clone(functionNode);
  const probeIndex = leadingProbeIndex(node, reviewedPrefixCalls(functionNode, options));
  const first = node.body.body[probeIndex];
  const terminal =
    first?.consequent?.type === 'BlockStatement'
      ? first.consequent.body
      : first?.consequent
        ? [first.consequent]
        : [];
  if (
    first?.type !== 'IfStatement' ||
    first.alternate ||
    !exactRootCall(first.test, painter, node.params) ||
    terminal.length !== 1 ||
    terminal[0].type !== 'ReturnStatement' ||
    terminal[0].argument !== null
  )
    throw new Error(
      `Leading painter probe does not exactly match ${painter} and the root arguments`,
    );
  node.body.body.splice(probeIndex, 1);
  return node;
}

function checkedPrivateSceneSet(functionNode, options, expectedMembership) {
  const { registry, sceneId } = options;
  const ast = scopedModule(functionNode, options.moduleNodes ?? []);
  let checked;
  traverse(ast, {
    Program(p) {
      p.scope.crawl();
      const binding = p.scope.getBinding(registry);
      const declaration = binding?.path.node;
      const initializer = declaration?.init;
      const values = initializer?.arguments?.[0];
      const includesScene =
        values?.type === 'ArrayExpression' &&
        values.elements.some((value) => value?.value === sceneId);
      const root = p.get('body').at(-1);
      if (
        !binding?.path.isVariableDeclarator() ||
        binding.path.parent.kind !== 'const' ||
        !binding.path.parentPath.parentPath.isProgram() ||
        !binding.constant ||
        initializer?.type !== 'NewExpression' ||
        initializer.callee.type !== 'Identifier' ||
        initializer.callee.name !== 'Set' ||
        p.scope.getBinding('Set') ||
        initializer.arguments.length !== 1 ||
        values?.type !== 'ArrayExpression' ||
        !values.elements.every((value) => value?.type === 'StringLiteral') ||
        (expectedMembership !== undefined && includesScene !== expectedMembership) ||
        root.scope.getBinding(registry) !== binding
      )
        throw new Error(
          `${registry} must be a private immutable literal Set${
            expectedMembership === undefined
              ? ''
              : ` ${expectedMembership ? 'including' : 'excluding'} ${sceneId}`
          }`,
        );
      for (const reference of binding.referencePaths) {
        const member = reference.parentPath;
        if (
          !member.isMemberExpression() ||
          member.node.computed ||
          member.node.object !== reference.node ||
          member.node.property.name !== 'has' ||
          !member.parentPath.isCallExpression() ||
          member.parentPath.node.callee !== member.node ||
          member.parentPath.node.arguments.length !== 1
        )
          throw new Error(`${registry} escapes its read-only has calls`);
      }
      checked = { root, binding, includesScene };
      p.stop();
    },
  });
  return checked;
}

export function projectPrivateSetMembership(functionNode, options) {
  if (typeof options.sceneId !== 'string') throw new Error('A projected scene ID must be a string');
  const { root, binding, includesScene } = checkedPrivateSceneSet(functionNode, options);
  const parameter = root.node.params[1];
  if (parameter?.type !== 'Identifier')
    throw new Error('A projected scene needs a plain parameter');
  const sceneBinding = root.scope.getBinding(parameter.name);
  let projected = 0;
  root.traverse({
    CallExpression(p) {
      const callee = p.node.callee,
        argument = p.node.arguments[0];
      if (
        callee.type !== 'MemberExpression' ||
        callee.computed ||
        callee.object.type !== 'Identifier' ||
        callee.object.name !== options.registry ||
        callee.property.name !== 'has' ||
        p.node.arguments.length !== 1 ||
        p.scope.getBinding(callee.object.name) !== binding ||
        argument?.type !== 'MemberExpression' ||
        argument.computed ||
        argument.object.type !== 'Identifier' ||
        argument.object.name !== parameter.name ||
        argument.property.name !== 'id' ||
        p.scope.getBinding(argument.object.name) !== sceneBinding
      )
        return;
      p.replaceWith(literal(includesScene));
      projected++;
    },
  });
  if (!projected) throw new Error(`No root-scene membership of ${options.registry} to project`);
  return root.node;
}

export function omitLeadingSetDispatch(functionNode, options) {
  const { registry, painter } = options;
  const negated = options.negated ?? false;
  if (typeof negated !== 'boolean') throw new Error('Set dispatch negated must be Boolean');
  checkedPrivateSceneSet(functionNode, options, negated);
  const node = clone(functionNode);
  const index = leadingProbeIndex(node, reviewedPrefixCalls(functionNode, options));
  const first = node.body.body[index];
  const rawTest = first?.test;
  const test = negated
    ? rawTest?.type === 'UnaryExpression' && rawTest.operator === '!' && rawTest.prefix
      ? rawTest.argument
      : null
    : rawTest;
  const result =
    first?.consequent?.type === 'BlockStatement' && first.consequent.body.length === 1
      ? first.consequent.body[0]
      : first?.consequent;
  if (
    first?.type !== 'IfStatement' ||
    first.alternate ||
    test?.type !== 'CallExpression' ||
    test.callee.type !== 'MemberExpression' ||
    test.callee.computed ||
    test.callee.object.type !== 'Identifier' ||
    test.callee.object.name !== registry ||
    test.callee.property.name !== 'has' ||
    test.arguments.length !== 1 ||
    test.arguments[0].type !== 'MemberExpression' ||
    test.arguments[0].computed ||
    test.arguments[0].object.type !== 'Identifier' ||
    test.arguments[0].object.name !== node.params[1]?.name ||
    test.arguments[0].property.name !== 'id' ||
    result?.type !== 'ReturnStatement' ||
    !exactRootCall(result.argument, painter, node.params)
  )
    throw new Error(
      `Leading Set dispatch does not exactly match ${registry}, ${painter} and the root arguments`,
    );
  node.body.body.splice(index, 1);
  return node;
}
