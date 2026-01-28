"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const config_1 = require("prisma/config");
function findRepoRoot(startDir) {
    let dir = startDir;
    while (true) {
        if ((0, node_fs_1.existsSync)((0, node_path_1.resolve)(dir, 'pnpm-workspace.yaml'))) {
            return dir;
        }
        const parent = (0, node_path_1.resolve)(dir, '..');
        if (parent === dir) {
            return startDir;
        }
        dir = parent;
    }
}
function resolveEnvFile() {
    const explicit = process.env.ENV_FILE?.trim();
    if (explicit) {
        return (0, node_path_1.isAbsolute)(explicit)
            ? explicit
            : (0, node_path_1.resolve)(findRepoRoot(process.cwd()), explicit);
    }
    const cwd = process.cwd();
    const repoRoot = findRepoRoot(cwd);
    const isProduction = process.env.NODE_ENV === 'production';
    const preferredName = isProduction ? '.env.production' : '.env.local';
    const candidates = [
        (0, node_path_1.resolve)(cwd, preferredName),
        (0, node_path_1.resolve)(repoRoot, preferredName),
        (0, node_path_1.resolve)(cwd, '.env'),
        (0, node_path_1.resolve)(repoRoot, '.env'),
    ];
    for (const candidate of candidates) {
        if ((0, node_fs_1.existsSync)(candidate)) {
            return candidate;
        }
    }
    return undefined;
}
const envFile = resolveEnvFile();
if (envFile) {
    (0, dotenv_1.config)({ path: envFile });
}
else {
    (0, dotenv_1.config)();
}
exports.default = (0, config_1.defineConfig)({
    schema: 'prisma/schema.prisma',
    migrations: {
        seed: 'node prisma/seed.js',
    },
});
//# sourceMappingURL=prisma.config.js.map