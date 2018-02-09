import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { renderToTroop } from '@school/troop-adapter';

class UnitCorner extends Component {
  constructor() {
    super();
    this.state = {};
  }

  componentWillMount() {
    const { connector } = this.context;
    connector.subscribe('hub:memory/bridge/send/unit', data => {
      this.setState({
        unitInfo:data.data
      });
    });
  }

  render() {
    console.log(this.props);
    return (
      <div className="unit-corner">
        <span style={{display: "block"}}>Unit part rendered by react</span>
        <span>{  this.state.unitInfo? `from react: ${this.state.unitInfo}`: '' }</span>
      </div>
    );
  }
}
UnitCorner.contextTypes = {
  connector: PropTypes.object
};

export default renderToTroop({ sub: 'bridge/unitPage' })(UnitCorner);
