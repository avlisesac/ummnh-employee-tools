import React from 'react'
import {
  BrowserRouter as Router,
  Route,
} from 'react-router-dom';

import HomePage from '../Home';
import WhiteboardPage from '../Whiteboard';

import * as ROUTES from '../../constants/routes';
import { withAuthentication } from '../Session';

const App = () => {
  return(
    <Router>
    <div className = "app">
    <Route exact path = {ROUTES.HOME} component = {HomePage} />
    <Route path = {ROUTES.WHITEBOARD} component ={WhiteboardPage} />
    </div>
    </Router>

  )
}

export default withAuthentication(App);
