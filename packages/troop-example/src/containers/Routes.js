import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { TroopWrapper } from '@school/troop-adapter';
import { HashRouter } from 'react-router-dom';
import LogonRoute from '../routes/logon';
import CourseRoute from '../routes/course';
import LoadingProgress from '../components/LoadingProgress/LoadingProgress';
import UnitCorner from '../components/unitPage/UnitCorner';

const Routes = () => (
  <React.Fragment>
    <LoadingProgress />
    <LogonRoute />
    <CourseRoute />
  </React.Fragment>
);

export default ({ store }) => (
  <Provider store={store}>
    <TroopWrapper>
      <HashRouter>
        <Routes />
      </HashRouter>
    </TroopWrapper>
  </Provider>
);
