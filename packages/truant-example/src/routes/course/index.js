import { Switch, Route } from 'react-router-dom';
import CoursePage from './CoursePage';
import React, { Component } from 'react';




export default (...props) => {
  return (
      <Route  path="/course" component={CoursePage} />
  );
};


