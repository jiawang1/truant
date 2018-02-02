import { AsyncFactory } from '@school/truant-core';
import React, { Component } from 'react';
import { Route } from 'react-router-dom';

const VidoeRoute = AsyncFactory()(() => import('./VideoPage'));

export default () => {
  return <Route path="/video" component={VidoeRoute} />;
};
