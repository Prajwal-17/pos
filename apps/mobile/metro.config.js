const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// expo-sqlite uses WebAssembly in the browser. Metro must treat the binary as an
// asset, and the dev server must opt into the cross-origin isolation required by
// SharedArrayBuffer.
config.resolver.assetExts.push("wasm", "db");
config.server.enhanceMiddleware = (middleware) => (request, response, next) => {
  response.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  return middleware(request, response, next);
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16
});
