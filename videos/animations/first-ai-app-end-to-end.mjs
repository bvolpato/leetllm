import { runDemo } from '../films/first-ai-app-end-to-end/demo.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export * from '../films/first-ai-app-end-to-end/index.mjs';
export { default } from '../films/first-ai-app-end-to-end/index.mjs';
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) &&
  process.argv.includes('--demo')
) {
  runDemo();
}
