import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = join(workspaceRoot, 'package.json');
const viteConfigFiles = [
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.cjs',
  'vite.config.ts',
  'vite.config.mts',
  'vite.config.cts',
];

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readPackageJson() {
  try {
    return JSON.parse(await readFile(packageJsonPath, 'utf8'));
  } catch {
    return {};
  }
}

async function workspaceUsesVite(packageJson) {
  const dependencyBuckets = [
    packageJson.dependencies,
    packageJson.devDependencies,
    packageJson.peerDependencies,
    packageJson.optionalDependencies,
  ];

  const hasViteDependency = dependencyBuckets.some((dependencies) => dependencies?.vite);
  const buildScript = packageJson.scripts?.build ?? '';
  const devScript = packageJson.scripts?.dev ?? '';
  const hasViteScript = /\bvite\b/.test(`${buildScript} ${devScript}`);
  const hasViteConfig = await Promise.any(
    viteConfigFiles.map((file) => fileExists(join(workspaceRoot, file)).then((exists) => {
      if (!exists) throw new Error('missing');
      return true;
    })),
  ).catch(() => false);

  return hasViteDependency || hasViteScript || hasViteConfig;
}

async function findViteBinary() {
  const binaryName = process.platform === 'win32' ? 'vite.cmd' : 'vite';
  const localBinary = join(workspaceRoot, 'node_modules', '.bin', binaryName);

  if (await fileExists(localBinary)) {
    return localBinary;
  }

  return null;
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: workspaceRoot,
      env: { ...process.env, NODE_ENV: 'development' },
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', () => resolve(1));
    child.on('close', resolve);
  });
}

const packageJson = await readPackageJson();

if (!(await workspaceUsesVite(packageJson))) {
  console.log('ORCH-018: workspace without Vite; skipping vite build.');
  process.exit(0);
}

const viteBinary = await findViteBinary();

if (!viteBinary) {
  console.log('ORCH-018: Vite detected but local vite binary is unavailable; skipping vite build.');
  process.exit(0);
}

process.exit(await run(viteBinary, ['build']));
