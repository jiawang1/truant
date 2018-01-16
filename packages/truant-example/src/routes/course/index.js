import { Route } from 'react-router-dom';
import React, { Component } from 'react';
import CoursePage from './CoursePage';


export default () => (
  <Route path="/course" component={CoursePage} />
);
