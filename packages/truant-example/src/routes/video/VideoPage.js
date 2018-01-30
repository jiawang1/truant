import React, { Component } from 'react';
import { connect } from 'react-redux';
import VideoPlayer from './VideoPlayer';

class VideoPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      classStartPause: 'start',
      videoSrc: ''
    };
  }

  handleStartAndPause(e) {
    const classStartPause = this.state.classStartPause === 'start' ? 'pause' : 'start';
    this.setState({
      classStartPause
    });
  }

  handleSelect(e) {
    this.setState({
      videoSrc: e.target.value
    });
  }

  /**
   * https://schooluat-ak.englishtown.com/Juno/11/12/07/v/111207/GE_1.1.2_v2.mp4
  https://simpl.info/video/video/chrome.webm
   */

  render() {
    return (
      <div>
        <div className="video-frame">
          <VideoPlayer src={this.state.videoSrc} width="100%" height="300" />
        </div>
        <div>
          <select
            type="select"
            name="videoType"
            value={this.state.videoSrc}
            onChange={e => {
              this.handleSelect(e);
            }}
          >
            <option value="https://schooluat-ak.englishtown.com/Juno/11/12/07/v/111207/GE_1.1.2_v2.mp4">
              {'video1'}
            </option>
            <option value="https://simpl.info/video/video/chrome.webm">{'video2'}</option>
          </select>
        </div>
      </div>
    );
  }
}

export default connect()(VideoPage);
