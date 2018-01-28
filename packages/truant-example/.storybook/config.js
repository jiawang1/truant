import { configure } from '@storybook/react';

function loadStories() {
  require('../stories/VideoPlayer.story.js');
}

configure(loadStories, module);
