const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Some packages (notably zustand v5's ESM build) use `import.meta.env`,
// which Metro's web bundle can't execute since it isn't loaded as a
// native <script type="module">. Preferring the "browser"/"require"/
// "react-native" export conditions over the default "import" condition
// makes Metro resolve those packages to their CJS build instead, which
// doesn't contain import.meta. See: https://github.com/pmndrs/zustand/discussions/2817
config.resolver.unstable_conditionNames = ["browser", "require", "react-native"];

module.exports = withNativeWind(config, {
  input: "global.css",
});