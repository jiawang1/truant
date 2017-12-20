import DefaultPage from './DefaultPage';
import { Switch, Route } from 'react-router-dom';
import React, { Component } from 'react';

//export { DefaultPage };
/**
 * routes for sample
 */
export default (...props) => {
  return (
    <Route {...props} path="/sample" component={DefaultPage} />
  );
};

