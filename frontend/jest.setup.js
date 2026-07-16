import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// react-native-maps has no JS-only fallback in jest; stub the pieces the app uses.
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = React.forwardRef((props, ref) =>
    React.createElement(View, { ...props, ref }),
  );
  const MockMarker = React.forwardRef((props, ref) =>
    React.createElement(View, { ...props, ref }),
  );
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    PROVIDER_GOOGLE: 'google',
  };
});
