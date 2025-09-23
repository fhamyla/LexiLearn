const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  // Preserve and extend resolver settings for Firebase while using Expo's metro-config
  config.resolver = config.resolver || {};
  config.resolver.alias = {
    ...(config.resolver.alias || {}),
    '@firebase/app': require.resolve('@firebase/app'),
    '@firebase/auth': require.resolve('@firebase/auth'),
    '@firebase/firestore': require.resolve('@firebase/firestore'),
  };

  return config;
})();