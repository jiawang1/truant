import React from 'react';
import ReactDOM from 'react-dom';
import hoistStatics from 'hoist-non-react-statics';
import { getTroopConnector } from './troopConnector';
import TroopWrapper from './TroopWrapper';

export const renderToTroop = (option = {}) => WrappedComponent => {
  const { sub } = option;

  const wrap = WrappedComponent => {
    return React.createElement(TroopWrapper, { asWrapper: true }, React.createElement(WrappedComponent));
  };

  const connector = getTroopConnector();
  connector.subscribe(sub, (option = {}) => {
    const { node, ...props } = option;
    ReactDOM.render(wrap(WrappedComponent), node);
  });
};
