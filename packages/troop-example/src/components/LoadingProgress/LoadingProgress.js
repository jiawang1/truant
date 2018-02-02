import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';


class LoadingProgress extends Component {
  constructor(props) {
    super(props);
    this.appRoot = document.getElementById('app-root');
  }
  componentWillUnmount() {
    this.appRoot = null;
  }

  renderModal(shown) {
    return (
      <div className={`ets-ui-spinnable ${shown ? '' : 'ets-ui-spinnable-hide'}`}>
        <div className="ets-inner" >
          <div className="ets-inner-cell">
            <div className="ets-icon" />
          </div>
        </div>
        <div className="ets-backdrop" />
      </div>
    );
  }
  render() {
    const { shown } = this.props;
    return ReactDOM.createPortal(
      this.renderModal(shown),
      this.appRoot
    );
  }

}
LoadingProgress.propTypes = {
  shown: PropTypes.bool.isRequired
};
LoadingProgress.defaultProps = {
  shown: false
};

export default connect(({ loadingProgressState }) => loadingProgressState)(LoadingProgress);
