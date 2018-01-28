import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { VideoPlayer } from '../src/routes/video/VideoPlayer';

storiesOf('VideoPlayer', module)
  .add('no source', () => (
    <VideoPlayer src="http://test" poster="this is no source story test" />
  ));
