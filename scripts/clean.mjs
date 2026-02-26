import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

async function removePath(relativePath) {
  const absolutePath = path.join(root, relativePath);
  await fs.rm(absolutePath, { recursive: true, force: true });
}

async function removeRootFilesBySuffix(suffix) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
      .map((entry) => fs.rm(path.join(root, entry.name), { force: true })),
  );
}

async function main() {
  const removablePaths = [
    'node_modules',
    'dist',
    'dist-ssr',
    '.vite',
    '.eslintcache',
    'coverage',
    '.nyc_output',
  ];

  await Promise.all(removablePaths.map((p) => removePath(p)));
  await removeRootFilesBySuffix('.tsbuildinfo');

  // Keep lockfiles and configs intact so the project can be restored with `pnpm install`.
  process.stdout.write('Clean complete.\n');
}

await main();
