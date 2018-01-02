import { Route } from 'react-router-dom';
import React, { Component } from 'react';
import DefaultPage from './DefaultPage';

/**
 * routes for sample
 */
export default (...props) => (
  <Route {...props} path="/sample" component={DefaultPage} />
);

