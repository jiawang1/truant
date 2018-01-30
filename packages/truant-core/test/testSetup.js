import jsdom from 'jsdom';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// configure enzyme adapter
Enzyme.configure({ adapter: new Adapter() });

// setup DOM
const { JSDOM } = jsdom;
if (typeof document === 'undefined') {
  const _dom = new JSDOM(
    '<!doctype html><html><body><meta id="context-root" value="" /> </body></html>'
  );
  global.window = _dom.window;
  global.document = window.document;
  global.navigator = window.navigator;

  // for react-slick media query issue
  window.matchMedia =
    window.matchMedia ||
    function() {
      return {
        matches: false,
        addListener: function() {},
        removeListener: function() {}
      };
    };
}
