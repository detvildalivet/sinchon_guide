// @mj-studio/react-native-naver-map ships real native Fabric components that
// aren't registered in the Jest (JS-only) environment. Jest auto-picks up a
// __mocks__/<pkg>.js file adjacent to node_modules for any node_modules
// package (scoped packages nest under __mocks__/<scope>/<name>.js), so this
// file stands in for it in tests — plain View-based components are enough to
// let a smoke test render the tree without crashing.
const React = require('react');
const { View } = require('react-native');

function NaverMapView(props, ref) {
  return React.createElement(View, { ...props, ref });
}

const ForwardedNaverMapView = React.forwardRef(NaverMapView);
ForwardedNaverMapView.displayName = 'MockNaverMapView';

function NaverMapMarkerOverlay(props, ref) {
  return React.createElement(View, { ...props, ref }, props.children);
}

const ForwardedNaverMapMarkerOverlay = React.forwardRef(NaverMapMarkerOverlay);
ForwardedNaverMapMarkerOverlay.displayName = 'MockNaverMapMarkerOverlay';

function NaverMapPathOverlay(props) {
  return React.createElement(View, props);
}

module.exports = {
  __esModule: true,
  NaverMapView: ForwardedNaverMapView,
  NaverMapMarkerOverlay: ForwardedNaverMapMarkerOverlay,
  NaverMapPathOverlay,
};
