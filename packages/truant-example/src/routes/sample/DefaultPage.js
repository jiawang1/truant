import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

class DefaultPage extends Component {
  constructor(props) {
    super(props);
  }
  componentWillUnmount() {
    console.log('######### component unmount #########');
  }
  getRandom() {
    const { dispatch } = this.props;
    dispatch({ type: 'sample/getRandom' });
  }
  handleDecrease() {
    const { dispatch } = this.props;
    dispatch({ type: 'sample/decrease' });
  }

  handleFlash() {
    const { dispatch } = this.props;
    dispatch({ type: "sample/calculate" });
  }

  handleIncrease() {
    const { dispatch } = this.props;
    dispatch({ type: 'sample/increase', command: 'increase' }).then(data => {
      console.log('got promise feedback');
      console.log(data);
    });
  }

  render() {
    const { random, num } = this.props;
    return (<div className='home-default-page'>
      <h5>Welcome to School project!</h5>

      <div>
        <span>{random}</span>
        <input
          className="button"
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
          className="button"
          type="button"
          value=" + "
          onClick={() => {
            this.handleIncrease();
          }}
        />
        <input
          className="button"
          type="button"
          value=" - "
          onClick={() => {
            this.handleDecrease();
          }}
        />
        <input
          className="button"
          type="button"
          value=" flash "
          onClick={() => {
            this.handleFlash();
          }}
        />
        <div style={{ position: 'relative', top: 30 }}>
          <Link className="link" to="/course"> to course page</Link>
        </div>
      </div>
    </div>
    );
  }
}

DefaultPage.propTypes = {
  random: PropTypes.number,
  num: PropTypes.number
};

DefaultPage.defaultProps = {
  random: 0,
  num: 0
};

export default connect(({ sampleState }) => ({ random: sampleState.get('random'), num: sampleState.get('num') }))(DefaultPage);
