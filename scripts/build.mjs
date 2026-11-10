import {cp, mkdir, readdir} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
await mkdir(output, {recursive: true});

// Publish only browser files; tooling, tests and repository metadata stay out.
const entries = await readdir(root, {withFileTypes: true});
for (const entry of entries) {
  const browserFile = entry.isFile() && (/\.(html|css|js)$/.test(entry.name) || ['favicon.svg', '.nojekyll'].includes(entry.name));
  const browserDirectory = entry.isDirectory() && ['assets', 'data'].includes(entry.name);
  if (browserFile || browserDirectory) {
    await cp(new URL(entry.name, root), new URL(entry.name, output), {recursive: true});
  }
}
console.log('Site estático preparado em dist/.');
