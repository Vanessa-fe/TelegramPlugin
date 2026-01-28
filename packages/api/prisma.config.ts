import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

function findRepoRoot(startDir: string): string {
  let dir = startDir;
  while (true) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) {
      return startDir;
    }
    dir = parent;
  }
}

function resolveEnvFile(): string | undefined {
  const explicit = process.env.ENV_FILE?.trim();
  if (explicit) {
    return isAbsolute(explicit)
      ? explicit
      : resolve(findRepoRoot(process.cwd()), explicit);
  }

  const cwd = process.cwd();
  const repoRoot = findRepoRoot(cwd);
  const isProduction = process.env.NODE_ENV === 'production';
  const preferredName = isProduction ? '.env.production' : '.env.local';
  const candidates = [
    resolve(cwd, preferredName),
    resolve(repoRoot, preferredName),
    resolve(cwd, '.env'),
    resolve(repoRoot, '.env'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

const envFile = resolveEnvFile();
if (envFile) {
  config({ path: envFile });
} else {
  config();
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'node prisma/seed.js',
  },
});
