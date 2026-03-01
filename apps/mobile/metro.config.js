const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and avoid duplicate module errors
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules")
];

// 3. Force Metro to resolve modules from the workspace root for pnpm compatibility
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
