import React from 'react';
import { getTroopConnector } from './troopConnector';
import PropTypes from 'prop-types';

export default class TroopWrapper extends React.Component {
  componentWillMount() {
    this.connector = getTroopConnector();
  }

  getChildContext() {
    return {
      connector: this.connector
    };
  }

  render() {
    const { children, asWrapper, ...props } = this.props;
    if(asWrapper){
      return this.connector ? React.cloneElement(React.Children.only(children), props ) : null;
    }else{
      return this.connector ? React.Children.only(children) : null;
    }
  }
}

TroopWrapper.childContextTypes = {
  connector: PropTypes.object,
  asWrapper: PropTypes.bool
};

TroopWrapper.defaultProps = {
  asWrapper:false
};
