import React, { Component } from 'react'

import {
  Box,
  Breadcrumbs,
  Button,
  Container,
  Grid,
  GridListTile,
  GridList,
  Link,
  ListSubheader,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@material-ui/core'

import NotInterestedIcon from '@material-ui/icons/NotInterested';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';

import { withAuthorization, AuthUserContext } from '../Session';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';

import LoadingIndicator from '../LoadingIndicator';

import { compose } from 'recompose';

class WhiteboardBase extends Component {
  constructor(props){
    super(props)

    this.state = {
      loading: false,
      clockedInUsers: null,
      clockedOutUsers: null,

      errorBool: false,
      errorText: '',
      textFieldValue: '',
      user: null,
    }
  }

  componentDidMount(){
    this.setState({ loading: true });

    this.props.firebase.users().on('value', snapshot => {
      const usersObject = snapshot.val();
      const currentUserObject = usersObject[this.props.authUser.uid]

      console.log('current users updated value:', currentUserObject)

      const usersList = Object.keys(usersObject).map(key => ({
        ...usersObject[key],
        uid: key,
      }))

      const clockedInUsers = usersList.filter( user =>{
        return user.clockedIn
      })

      const clockedOutUsers = usersList.filter( user => {
        return !user.clockedIn
      })

      this.setState({
        users: usersList,
        clockedInUsers: clockedInUsers,
        clockedOutUsers: clockedOutUsers,
        user: currentUserObject,
        loading: false,
      })
    })
  }

  componentWillUnmount() {
    this.props.firebase.users().off();
  }

  submitNote = (textFieldValue) => {
    this.props.firebase.user(this.props.authUser.uid).update({
      note: this.state.textFieldValue
    })
    this.setState({
        textFieldValue: ''
    })
  }

  makeLogEntry = () => {
    {/*Create date and time objects*/}
    const date = new Date();
    const currentDate = date.toDateString();
    const currentTime = date.toTimeString();
    const statusMessage = (this.state.user.clockedIn) ? 'Clocking Out' : 'Clocking In';

    {/*Create Punch Log Entry*/}
    this.props.firebase.punchLog().child(currentDate).push().set({
      email: this.state.user.email,
      status: statusMessage,
      time: currentTime,
    })
  }

  toggledInOut = event => {
    const userClockedIn = this.state.user.clockedIn

    if(!userClockedIn){
      {/*Ask if user has done daily online COVID screening questionnaire*/}
      const completedScreening = window.confirm(
        `Press OK to certify that you have completed U-M's daily online COVID screening check. If you have not, please press Cancel and return after you have completed the check (link below).`
      )

      if(!completedScreening){
        {/*If the user hasn't completed the screening, break out of this function*/}
        return
      }

    }
    this.makeLogEntry()

    {/*Update User's Status*/}
    this.props.firebase.user(this.props.authUser.uid).update({
      clockedIn: !this.state.user.clockedIn
    })
  }

  onChange = event => {
    this.setState({
      [event.target.name]: event.target.value,
    }, () => {
      if(this.state.textFieldValue.length > 50){
        this.setState({
          errorBool: true,
          errorText: "Please make your message shorter.",
        })
      } else {
        this.setState({
          errorBool: false,
          errorText: '',
        })
      }
    })
  }

  pushRoute = (destination) => {
    this.props.history.push(destination)
  }


  render(){
    if(this.state.user && this.state.clockedInUsers && this.state.clockedOutUsers){
      return(
        <Box m={5}>
          <Grid container direction="column" justify='center' alignItems='center' spacing={2}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link color="inherit" style={{cursor: 'pointer'}} onClick={() => {this.pushRoute(ROUTES.HOME)}}>Home</Link>
            <Typography color="textPrimary">Whiteboard</Typography>
          </Breadcrumbs>

            <Grid item xs={12}>
              <Typography variant="h2">Whiteboard</Typography>
            </Grid>
            {/*Tools*/}
            <Grid item xs={12}>
              <Typography variant="h4">Hi, {this.state.user.firstName}</Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant='h6'>Your Status:</Typography>
              <Grid container>
                <Typography variant="h6">Out</Typography>
                <Switch checked={this.state.user.clockedIn} onChange={this.toggledInOut} name="inOut" />
                <Typography variant="h6">In</Typography>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <a href="https://healthscreen.umich.edu/" target="_blank">Online Screening Check</a>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <TextField
                    error={this.state.errorBool}
                    helperText={this.state.errorText}
                    label="Update your note..."
                    name="textFieldValue"
                    onChange={this.onChange}
                    value={this.state.textFieldValue}
                    variant="filled"

                  />
                </Grid>

                <Grid item>
                  <Button
                    variant="contained"
                    color="secondary"
                    disabled={this.state.errorBool}
                    onClick={() => this.submitNote(this.state.textFieldValue) }>
                    Update
                  </Button>
                </Grid>

              </Grid>
            </Grid>

          {/*In Section*/}
          <Grid item xs ={12} style ={{backgroundColor: 'white', width: '100%',  borderBottom: 'thick solid gray'}}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h4">In</Typography>
              </Grid>
              { this.state.clockedInUsers.map(user => (
                <EmployeeCard user = { user } key = { user.uid }/>
              ))}
              </Grid>
            </Grid>

            {/*Out Section*/}
            <Grid item xs ={12} style ={{backgroundColor: 'white', width: '100%'}}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h4">Out</Typography>
                </Grid>
                { this.state.clockedOutUsers.map(user => (
                  <EmployeeCard user = { user } key = { user.uid }/>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Box>
      )
    }
    return(
      <LoadingIndicator />
    )
  }
}

const WhiteboardAuth = (props) => (
  <AuthUserContext.Consumer>
    {
      authUser => (
        <WhiteboardBase authUser = { authUser } {...props}/>
      )
    }
  </AuthUserContext.Consumer>
)

const EmployeeCard = (props) => {
  const clockedIn = props.user.clockedIn

  const clockIcon = (clockedIn) ? <CheckCircleOutlineIcon style = {{ color: 'green'}} /> : <NotInterestedIcon style = {{color:'red'}} />
  const name = props.user.firstName + ' ' + props.user.lastInitial;
  const elevationHeight = (clockedIn) ? 3 : 1;
  const backgroundColor = (clockedIn) ? 'white' : 'lightGrey'
  const status = (clockedIn) ? 'In' : 'Out'


  return(
    <Grid item xs={12} sm={6} md={4}>
      <Paper style={{backgroundColor: backgroundColor}} elevation={elevationHeight}>
        <Box m={2} p={2}>
          <Grid container direction="column" justify="center" alignItems="center" spacing={1}>
            {/*User Icon*/}
            <Grid item xs={12}>
              <img src = { props.user.photoURL } alt = "userImage" className = "userImage"/>
            </Grid>

            {/*User Name*/}
            <Grid item xs={12}>
              <Typography variant="h6">{name}</Typography>
            </Grid>

            {/*User Status*/}
            <Grid item xs={12}>
              <Grid container spacing={1}>
                <Grid item>{clockIcon}</Grid>
                <Grid item><Typography variant="subtitle2">{status}</Typography></Grid>
              </Grid>
            </Grid>


            {/*User Note*/}
            <Grid item xs={12}>
              <Typography variant="body2" style={{color: 'black'}}>Note: {props.user.note}</Typography>
            </Grid>

          </Grid>
        </Box>
      </Paper>
    </Grid>
  )
}

const condition = authUser => !!authUser;

const Whiteboard = compose(
  withFirebase,
  withAuthorization(condition),
)(WhiteboardAuth)

export default Whiteboard;
