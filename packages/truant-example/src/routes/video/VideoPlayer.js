import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

export class VideoPlayer extends Component {

  constructor(props) {
    super(props);
    this.state = {
      classStartPause: 'start',
      videoUrl: ''
    };
  }

  handleStartAndPause(e) {
    let classStartPause;
    if (this.state.classStartPause === 'start') {
      classStartPause = 'pause';
      this.eleVideo.play();
    } else {
      classStartPause = 'start';
      this.eleVideo.pause();
    }
    this.setState({
      classStartPause
    });
  }

  handleStop() {
    this.eleVideo.stop();
    this.setState({
      classStartPause: 'start'
    });
  }

  play() {
    this.eleVideo.play();
  }
  pause() {
    this.eleVideo.pause();
  }
  canPlay() {
    console.log('can play triggered');
  }

  handleError(e) {
    console.log('handle error');
    console.log(e);
  }

  componentDidMount() {
    this.initVideo();
  }

  componentWillReceiveProps(nextProps) {

  }

  componentWillUnmount() {
    console.log('unmount method called ');
    this.finalizeVideo();
    this.eleVideo = null;
  }
  initVideo() {
    this.eleVideo.addEventListener('canplay', this.canPlay);
    this.eleVideo.addEventListener('error', this.handleError);
  }

  finalizeVideo() {
    this.eleVideo.removeEventListener('canPlay', this.canPlay);
    this.eleVideo.removeEventListener('error', this.handleError);
  }

  render() {
    const { src, width, height, poster } = this.props;
    return (<div className='video-player'>
      <div className='view-area'>
        <video style={{ display: 'block', width: width || '100%', height: height || 'auto' }}
          ref={ref => { this.eleVideo = ref; }}
          src={src}
          poster={poster}
        >

        </video>
      </div>
      <div className='control-area'>
        <div className={`button-${this.state.classStartPause} circle`} onClick={(e) => { this.handleStartAndPause(e); }}>
          <span></span>
        </div>
        <div className='button-stop circle' onClick={(e) => { this.handleStop(e); }}>
          <span></span>
        </div>
        <div className='button-stop circle' onClick={(e) => { this.handleStop(e); }}>
          <span></span>
        </div>
        <div className='button-stop circle' onClick={(e) => { this.handleStop(e); }}>
          <span></span>
        </div>
      </div>
    </div>);
  }
}

VideoPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  width: PropTypes.string,
  height: PropTypes.string,
  poster: PropTypes.string
};

VideoPlayer.defaultProps = {
  width: '100%',
  height: 'auto',
  poster: '',
  showProgress: true
};


export default connect()(VideoPlayer);
