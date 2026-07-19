/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// No native Geolocation module in the Jest (non-device) environment;
// useUserLocation falls back to DEFAULT_COORDINATE regardless, so a bare
// stub is enough to let the module graph load under test.
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  requestAuthorization: jest.fn(),
}));
