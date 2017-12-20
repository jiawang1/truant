import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import SampleRoute from '../routes/sample';
import CourseRoute from '../routes/course';
import UnitRoute from '../routes/video';

const Routes = () => {
  return (
    <React.Fragment>
      <SampleRoute />
      <CourseRoute />
      <UnitRoute />
    </React.Fragment>
  );
  //return aRoutes.map(route => React.createElement(route, { key: route.toString() }));
};

export const RootApp = ({ store }) => {
  return (
    <Provider store={store}>
      <HashRouter >
        <Routes />
      </HashRouter>
    </Provider>
  );
};
