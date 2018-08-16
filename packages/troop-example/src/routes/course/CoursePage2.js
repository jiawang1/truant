import React, { Component } from 'react';
import { getTroopConnector } from '@school/troop-adapter';

const eventList = [
  'load/course',
  'load/enrollable/courses',
  'load/enrollment',
  'load/level',
  'load/results',
  'load/unit'
];

let num = 1;

export default class CoursePage extends Component {
  constructor() {
    super();
    this.state = {
      results: []
    };

    getTroopConnector().then(connector => {
      this.connector = connector;
      eventList.forEach(event => {
        let eventname = event;
        this.connector.subscribe(eventname, data => {
          const results = this.state.results.slice();
          results.push({
            eventname,
            data
          });
          this.setState({
            results
          });
        });
      });
    });
  }

  render() {
    return (
      <div>
        <ul>
          {this.state.results.map(result => {
            return (
              <li key={num++}>
                <span> listen to troop event  {result.eventname} </span>
                <span style={{ color: 'green', display:'block' }}> get troop event result {result.data.toString()}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

// CoursePage.contextTypes = {
//   connector: PropTypes.object
// };
