import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

const CoursePage = () =>
  (<div>
    <span>this is a test for course</span>
    <div style={{ paddingLeft: 20, marginBottom: 20 }}>go to video page</div>
    <Link style={{ paddingLeft: 20 }} to="/sample">back to sample</Link>
  </div>);

export default connect()(CoursePage);
