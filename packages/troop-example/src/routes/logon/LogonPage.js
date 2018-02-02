import React, { Component } from 'react';
import { connect } from 'react-redux';

class LogonPage extends Component {
  constructor() {
    super();
    this.state = {
      userName: '',
      password: '',
      message: ''
    };
  }

  handleLogon() {
    if (this.state.userName && this.state.password) {
      const { dispatch } = this.props;
      const { userName, password } = this.state;
      dispatch({ type: 'logon/logonSchool', data: { userName, password } });
    } else {
      this.setState({
        message: 'Please input user name and password'
      });
    }
  }

  handleInput(e) {
    this.setState({
      [e.target.id]: e.target.value,
      message: ''
    });
  }

  getUser() {
    const { dispatch } = this.props;
    dispatch({
      type: 'logon/getUser'
    });
  }

  getUserByTroopAPI() {
    const { dispatch } = this.props;
    dispatch({
      type: 'logon/getUserByTroopAPI'
    });
  }

  componentWillReceiveProps(next) {
    const { message } = next;
    if (message) {
      this.setState({
        message
      });
    }
  }

  render() {
    return (
      <React.Fragment>
        <form>
          <div>
            <label htmlFor="userName">User Name</label>
            <input
              id="userName"
              value={this.state.userName}
              onChange={(...args) => {
                this.handleInput(...args);
              }}
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={this.state.password}
              onChange={(...args) => {
                this.handleInput(...args);
              }}
            />
          </div>
          <div>
            <button
              onClick={() => {
                this.handleLogon();
              }}
            >
              Logon
            </button>
          </div>
          <div>{this.state.message}</div>
        </form>
        <div>
          <span
            onClick={() => {
              this.getUser();
            }}
          >
            get user
          </span>
        </div>
        <div>
          <span
            onClick={() => {
              this.getUserByTroopAPI();
            }}
          >
            get user by Troop API
          </span>
        </div>
      </React.Fragment>
    );
  }
}

export default connect(({ logonState }) => ({
  message: logonState.message
}))(LogonPage);
