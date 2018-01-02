import React, { Component } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import invariant from 'invariant';
import { getDisplayName } from './utils';
// TODO improved
const handleError = (error, info) => {
  if (error) {
    console.error(error);
  }
  if (info) {
    console.log(info);
  }
};
// TODO improved
const fallback = () => ('render failed');

/**
 * @param  {} WrappedComponent  : the component will be wrapped with error capture function
 * @param  {} option : HOC options includes follows properties:
 *    {
 *      @param  {} FallbackComponent=fallback : default error rendering component
 *      @param  {} onError=handleError : default error tracing function
 *    }
 */
const withErrorBoundary = (option = {}) => WrappedComponent => {
  invariant(WrappedComponent, 'Wrapped component must be supplied');
  const { FallbackComponent = fallback, onError = handleError } = option;

  class ErrorBoundary extends Component {
    constructor(props) {
      super(props);
      this.state = {
        hasError: false
      };
      this.ref = null;
      this.setWrappedInstance = this.setWrappedInstance.bind(this);
    }
    componentDidCatch(error, info) {
      this.setState({
        hasError: true
      });
      onError(error, info);
    }
    getWrappedInstance() {
      if (!this.state.hasError) {
        return typeof this.ref.getWrappedInstance === 'function' ? this.ref.getWrappedInstance() : this.ref;
      }
      return undefined;
    }
    setWrappedInstance(ref) {
      this.ref = ref;
    }
    render() {
      if (this.state.hasError) {
        return <FallbackComponent />;
      }
      const props = { ref: this.setWrappedInstance, ...this.props };
      return <WrappedComponent {...props} />;
    }
  }
  ErrorBoundary.displayName = `withErrorBoundary(${getDisplayName(WrappedComponent)})`;
  return hoistStatics(ErrorBoundary, WrappedComponent);
};

export default withErrorBoundary;
