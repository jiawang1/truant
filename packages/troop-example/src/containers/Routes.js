import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import LogonRoute from '../routes/logon';
import LoadingProgress from '../components/LoadingProgress/LoadingProgress';

const Routes = () => (
  <React.Fragment>
    <LoadingProgress />
    <LogonRoute />
  </React.Fragment>
);

export default ({ store }) => (
  <Provider store={store}>
    <HashRouter>
      <Routes />
    </HashRouter>
  </Provider>
);
