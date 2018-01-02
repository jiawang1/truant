import React, { Component } from 'react';
import hoistStatics from 'hoist-non-react-statics';
import { getDisplayName } from './utils';

/**
 * @param  {} importComponent : function used to load component asynchronized
 * @param  {} importState : function used to load state of component async, the state should include both reducer and saga.
 */
const AsyncFactory = importState => importComponent => {

  class AsyncComponent extends Component {
    constructor() {
      super();
      this.ref = null;
      this.setWrappedInstance = this.setWrappedInstance.bind(this);
      this.state = {
        component: null
      };
    }
    async load() {
      let aTargets = [importComponent];
      importState && aTargets.push(importState);
      const components = await Promise.all(aTargets.map(target => target()));

      //TODO inject reducer and saga
      this.setState({
        component: components[0].default
      });
    }
    getWrappedInstance() {
        return typeof this.ref.getWrappedInstance === 'function' ? this.ref.getWrappedInstance() : this.ref;
    }
    setWrappedInstance(ref) {
      this.ref = ref;
    }
    componentWillMount() {
      if (!this.state.component) {
        try {
          this.load();
        } catch (error) {

        }
      }
    }
    render() {
      const props = { ref: this.setWrappedInstance, ...this.props };
      return this.state.component ? React.createElement(this.state.component, { ...props }) : null;
    }
  };
   AsyncComponent.getDisplayName = `AsyncComponent(${getDisplayName(importComponent)})`;
   return AsyncComponent;

};

export default AsyncFactory;
