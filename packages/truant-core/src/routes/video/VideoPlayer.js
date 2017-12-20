import React, { Component } from 'react';
import { connect } from "react-redux";


export class VideoPlayer extends Component {

  constructor(props) {
    super(props);
    this.state = {
      classStartPause: 'start',
      videoUrl: ''
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
//http://153.37.232.154/om.tc.qq.com/ATbUc17yX9jJlmGn_8wbtFyf-n67FySOOa2omC0GBQqk/j03740cnxxn.p712.1.mp4?sdtfrom=v1105&guid=df47e8d79fd57e564c7dcc6b32d77179&vkey=BDD4698FA634F57592458673D5C94DBDE84F43B7972BE048A4A6D411E8A80F662AB4A96BCB1F5C1A7DA435C2527B54761682CA332B098E5739963482489EE3BC8AEA11A722674FDA84BC4988A7E5EA80CDAE29F3828BCF692FF9CAC07678B75A94AAF031E79299ED7696A27AC44BBC6BDCDC018E8A624221
// /'http://ugcws.video.gtimg.com/flv/240/114/g05452x79qr.p712.1.mp4?sdtfrom=v1105&guid=df47e8d79fd57e564c7dcc6b32d77179&vkey=17B8CAA5B3E64EA9F8DE51B57173C33E51AF61F9E7FF171B6518FA78A1CD2608376A038EF0725D287F29C1A89E5E03E092EFF1896DF7913650BFFE0EFCAC6DD4A0931E456CC874624CE79ADEF610ED7C41871139710F9AC3274A58DEA9B7C6BC8538390475F86BF1CA029B92424058B9977CEB3D48358CDA%22'
render() {
    const { location, match, history } = this.props;

    return (<div className='video-player'>
      <div className='view-area'>
        <video autoPlay = 'true' style={{ display: 'block', width: '100%', height: 100 }} src={this.state.videoUrl} />
      </div>
      <div className='control-area'>
        <div className={`button-${this.state.classStartPause} circle`} onClick={(e) => { this.handleStartAndPause(e); }}>
          <span></span>
        </div>
        <div className='button-stop circle' onClick={(e) => { this.handleStartAndPause(e); }}>
          <span></span>
        </div>
        <div className='button-stop circle' onClick={(e) => { this.handleStartAndPause(e); }}>
          <span></span>
        </div>
        <div className='button-stop circle' onClick={(e) => { this.handleStartAndPause(e); }}>
          <span></span>
        </div>
        <div className='button-stop circle' onClick={(e) => { this.handleStartAndPause(e); }}>
          <span></span>
        </div>
      </div>
    </div>);
  }
}

export default connect()(VideoPlayer);
