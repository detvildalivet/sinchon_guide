// react-native-maps ships a real native TurboModule that isn't registered in
// the Jest (JS-only) environment. Jest auto-picks up a __mocks__/<pkg>.js
// file adjacent to node_modules for any node_modules package, so this file
// stands in for it in tests — plain View-based components are enough to let
// a smoke test render the tree without crashing.
const React = require('react');
const { View } = require('react-native');

function MapView(props, ref) {
  return React.createElement(View, { ...props, ref });
}

const ForwardedMapView = React.forwardRef(MapView);
ForwardedMapView.displayName = 'MockMapView';

function Marker(props) {
  return React.createElement(View, props, props.children);
}

function Polyline(props) {
  return React.createElement(View, props);
}

module.exports = {
  __esModule: true,
  default: ForwardedMapView,
  Marker,
  Polyline,
  PROVIDER_GOOGLE: 'google',
  PROVIDER_DEFAULT: 'default',
};
