const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  
  // Add resolver settings for Firebase
  config.resolver.alias = {
    ...config.resolver.alias,
    '@firebase/app': require.resolve('@firebase/app'),
    '@firebase/auth': require.resolve('@firebase/auth'),
    '@firebase/firestore': require.resolve('@firebase/firestore'),
  };
  
  return config;
})(); 