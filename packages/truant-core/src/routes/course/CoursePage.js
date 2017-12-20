import React, { Component } from 'react';
import { connect } from "react-redux";
import { Link } from 'react-router-dom';

class CoursePage extends Component {


  render() {
    const { location, match, history } = this.props;
    console.log(location);
    console.log(match);
    console.log(history);
    return (<div>
      <span>"this is a test for course"</span>
      <div style={{ paddingLeft: 20 , marginBottom: 20 }}>go to video page</div>
      <Link  style={{ paddingLeft: 20 }} to='/video'>go to video</Link>
    </div>);
  }
}

export default connect()(CoursePage);
