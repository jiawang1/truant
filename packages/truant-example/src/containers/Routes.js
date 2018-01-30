import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import SampleRoute from '../routes/sample';
import CourseRoute from '../routes/course';
import UnitRoute from '../routes/video';
import LoadingProgress from '../components/LoadingProgress/LoadingProgress';

const Routes = () => (
  <React.Fragment>
    <LoadingProgress />
    <SampleRoute />
    <CourseRoute />
    <UnitRoute />
  </React.Fragment>
);

export default ({ store }) => (
  <Provider store={store}>
    <HashRouter>
      <Routes />
    </HashRouter>
  </Provider>
);
