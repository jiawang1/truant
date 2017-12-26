import React, { Component } from 'react';
import invariant from 'invariant';

const handleError = (error, info) => {
  if (error) {
    console.error(error);
  }
  if (info) {
    console.log(info);
  }
};
const fallback = () => ('render failed');

/**
 * @param  {} WrappedComponent
 * @param  {} FallbackComponent=fallback
 * @param  {} onError=handleError
 */
const withErrorBoundary =
  (WrappedComponent, FallbackComponent = fallback, onError = handleError) => {
    invariant(WrappedComponent, 'Wrapped component must be supplied');
    invariant(typeof onError === 'function', 'parameter onError must be a function');

    return class ErrorBoundary extends Component {
      constructor(props) {
        super(props);
        this.state = {
          hasError: false
        };
      }
      componentDidCatch(error, info) {
        this.setState({
          hasError: true
        });
        //onError(error, info);
      }

      render() {
        if (this.state.hasError) {
          return <FallbackComponent />;
        }
        return <WrappedComponent {...this.props} />;
      }
    };
  };

export default withErrorBoundary;
