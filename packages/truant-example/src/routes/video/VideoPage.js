import React, { Component } from 'react';
import { connect } from "react-redux";
import VideoPlayer from './VideoPlayer';


class VideoPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      classStartPause: 'start'
    };
  }

  handleStartAndPause(e) {
    let classStartPause = this.state.classStartPause === 'start' ? 'pause' : 'start';
    this.setState({
      classStartPause
    });
  }

  handleStop() {


  }

  render() {
    return (<div className='video-frame'>
      <VideoPlayer />
    </div>);
  }
}

export default connect()(VideoPage);
