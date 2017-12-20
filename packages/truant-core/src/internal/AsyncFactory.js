import React, { Component } from 'react';

/**
 * @param  {} importComponent : function used to load component asynchronized
 * @param  {} importState : function used to load state of component async, the state should include both reducer and saga.
 */
const AsyncFactory = (importComponent, importState) => {

  return class AsyncComponent extends Component {
    constructor() {
      super();
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

    componentDidMount() {
      if (!this.state.component) {
        try {
          this.load();
        } catch (error) {

        }
      }
    }
    render() {
      return this.state.component ? React.createElement(this.state.component, { ...this.props }) : null;
    }
  };
};

export default AsyncFactory;
