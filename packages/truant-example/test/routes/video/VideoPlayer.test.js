import { render } from 'enzyme';
import React from 'react';
import { expect } from 'chai';
import configureStore from 'redux-mock-store';
import VideoPlayer from '../../../src/routes/video/VideoPlayer';

describe('video', () => {
  const initialState = {};
  const mockStore = configureStore();
  let store;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  it('verify initial rendering, start, stop should be there, no pause', () => {
    const wrapper = render(<VideoPlayer store={store} />);
    expect(wrapper.find('.button-start').length).to.equal(1);
    expect(wrapper.find('.button-pause').length).to.equal(0);
    expect(wrapper.find('.button-stop').length).to.at.least(1);
  });
});
