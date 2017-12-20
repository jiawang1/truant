import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

class DefaultPage extends Component {
  constructor(props) {
    super(props);
  }

  handleIncrease() {
    const { dispatch } = this.props;
    dispatch({ type: 'sample/increase', command: 'increase' }).then((data) => {
      console.log(data);
    });
  }

  handleDecrease() {
    const { dispatch } = this.props;
    dispatch({ type: 'sample/decrease' });
  }

  handleFlash() {
    const { dispatch } = this.props;
    dispatch({ type: "sample/calculate" });
  }

  getRandom() {
    const { dispatch } = this.props;
    dispatch({ type: 'sample/getRandom' });
  }

  render() {
    const { random, num } = this.props;
    return (<div>
      <h5>Welcome to School project!</h5>
      <div>
        <span>{random}</span>
        <input
          type="button"
          value="get random"
          onClick={() => {
            this.getRandom();
          }}
        />
      </div>
      <div>
        <span>{num}</span>
        <input
          type="button"
          value=" + "
          onClick={() => {
            this.handleIncrease();
          }}
        />
        <input
          type="button"
          value=" - "
          onClick={() => {
            this.handleDecrease();
          }}
        />
        <input
          type="button"
          value=" flash "
          onClick={() => {
            this.handleFlash();
          }}
        />
        <Link to="/course"> to course page</Link>
      </div>
    </div>
    );
  }
}

export default connect(({ sampleState }) => ({ random: sampleState.get('random'), num: sampleState.get('num') }))(DefaultPage);
