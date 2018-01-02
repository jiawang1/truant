import { expect } from 'chai';
import React, { Component } from 'react';
import { render, shallow, mount } from 'enzyme';
import withErrorBoundary from '../../src/internal/withErrorBoundary';

describe('test HOC with Error Boundary', () => {
  class MockComponent extends Component {
    testMock() {
      return this;
    }
    render() {
      return (<div><span>test HOC</span></div>);
    }
  }
  const MockErrorComponent = () => {
    throw new Error('test');
    return (<div>
      <span>test HOC</span>
    </div>);
  };
  const MockFallback = () => (<div className="error">error</div>);

  it('test withErrorBoundary normal case', () => {
    const TComponent = withErrorBoundary()(MockComponent);
    const wrapper = render(<TComponent />);
    expect(wrapper.find('span').text()).to.equal('test HOC');
  });

  it('test withErrorBoundary exception case', () => {
    const EComponent = withErrorBoundary({ FallbackComponent: MockFallback })(MockErrorComponent);
    const EWrapper = mount(<EComponent />);
    expect(EWrapper.find('.error')).to.have.lengthOf(1);
  });

  // it('test with ref', () => {
  //   debugger;
  //   let _ref = null;
  //   const refCompoent = ref => { _ref = ref; };
  //   const EComponent = withErrorBoundary(MockErrorComponent, { withRef: refCompoent });
  //   mount(<EComponent />);
  //   debugger;
  //   expect(_ref.testMock).to.not.null;
  // });
});
