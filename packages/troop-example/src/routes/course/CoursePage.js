import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getTroopConnector } from '@school/troop-adapter';

const eventList = [
  'load/course',
  'load/enrollable/courses',
  'load/enrollment',
  'load/level',
  'load/results',
  'load/unit',
  'hub:memory/route/uri'
];

let num = 0;
let unitInfo = 0;

export default class CoursePage extends Component {
  constructor() {
    super();
    this.state = {
      results: [],
      sentInfo: null
    };
  }
  componentWillMount() {
    const { connector } = this.context;
    eventList.forEach(event => {
      let eventname = event;
      connector.subscribe(eventname, data => {
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

    setTimeout(()=>{
      connector.subscribe('hub:memory/context', data=>{
        console.log(data)
      })
    }, 10000);

  }

  sendEvent(){
    const { connector } = this.context;
    connector.publish('bridge/send/unit', {data: ++unitInfo} ).then(data=>{
      this.setState({
        sentInfo: unitInfo
      });
    });
  }

  render() {
    return (
      <div className="react-block" style={{}}>
        <div className="event-list">
        <ul>
          {this.state.results.map(result => {
            return (
              <li key={num++} style={{ display: 'block', padding: '10' }}>
                <div>{num}</div>
                <div>
                  <span> listen to troop event {result.eventname} </span>
                  <span style={{ color: 'green', display: 'block' }}>
                    {' '}
                    get troop event result {result.data.toString()}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        </div>
        <div className="action">
        <div>
            <button onClick={ ()=>{  this.sendEvent()} }> send to troop  </button>
            { this.state.sentInfo? <span>result: { this.state.sentInfo } </span>: null  }
            </div>
        </div>
      </div>
    );
  }
}

CoursePage.contextTypes = {
  connector: PropTypes.object
};
