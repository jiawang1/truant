import AsyncFactory from '../../internal/AsyncFactory';
import React, { Component } from 'react';
import { Route } from 'react-router-dom';

const UnitRoute = AsyncFactory(() => import('./VideoPage'));

export default () => {
  return (
    <Route path="/video" component={UnitRoute} />
  );
};
