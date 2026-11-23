import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../web/package.json', import.meta.url));
const ts = require('typescript');
const source = fs.readFileSync(0, 'utf8');
const tree = ts.createSourceFile('illustration.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
if (tree.parseDiagnostics.length) {
  throw new Error('Cannot classify layout markers in an invalid TypeScript illustration.');
}

const positions = [];
function visit(node) {
  if (ts.isParameter(node) && node.type && ts.isIdentifier(node.name)) {
    // Python indexes Unicode code points; TypeScript indexes UTF-16 code units.
    positions.push([...source.slice(0, node.name.getStart(tree))].length);
  }
  ts.forEachChild(node, visit);
}
visit(tree);
process.stdout.write(JSON.stringify(positions));
