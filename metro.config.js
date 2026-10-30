const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  // CMake creates and removes temporary directories during native builds.
  // Watching them can crash Metro's Windows fallback watcher with ENOENT.
  /[/\\]android[/\\](?:.*?[/\\])?(?:build|\.cxx|\.gradle|\.kotlin)[/\\]/,
];
module.exports = config;
