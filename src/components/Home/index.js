import React, { Component } from 'react'
import {
  Box,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Container,
  Grid,
  Link,
  Typography,
} from '@material-ui/core'
import Alert from '@material-ui/lab/Alert';

import { compose } from 'recompose';
import { withFirebase } from '../Firebase';
import { withAuthorization, AuthUserContext, withAuthentication } from '../Session';
import { withRouter } from 'react-router-dom';

import * as ROUTES from '../../constants/routes';

import { ReactComponent as FullLogo } from '../../img/logoFull.svg';
import { ReactComponent as SmallLogo } from '../../img/logoSmall.svg';
import LoadingIndicator from '../LoadingIndicator';

class HomeBase extends Component {
  constructor(props){
    super(props)

    this.state = {
      logo: FullLogo,
      user: null,
      loading: false,
      error: null,
    }
  }

  componentDidMount(){

    this.setState({
      loading: true,
    })

    const currentUser = this.props.authUser

    if(currentUser){
      console.log('we have an authenticated user');
      this.setState({
        user: currentUser,
        loading: false,
      })
    } else {
      console.log('no authenticated user');
      this.setState({
        user: null,
        loading: false,
      })
    }
  }

  clickedSignOut = () => {
    const result = window.confirm(`Are you sure you want to sign out from the application?`)

    if(result){
      {/* User answered Yes, log them out, set user to null*/}
      this.props.firebase.doSignOut()
      this.setState({
        user: null,
      })
    } else {
      {/* User answered No, ignore request */}
      return
    }
  }

  clickedSignIn = () => {
    console.log('clicked the sign in button')

    this.setState({
      error: null,
      loading: true,
    })

    this.props.firebase.doSignInWithGoogle().then(socialAuthUser => {
      {/*Domain Check*/}
      const emailDomain = socialAuthUser.additionalUserInfo.profile.email.split('@')[1];
      if(emailDomain==='umich.edu'){
        {/*Passed Domain Check*/}

        {/*New User Check*/}
        const isNewUser = socialAuthUser.additionalUserInfo.isNewUser;
        if(isNewUser){
          {/*Passed New User Check*/}
          console.log('new user...')
          this.props.firebase
          .user(socialAuthUser.user.uid)
          .set({
            username: socialAuthUser.user.displayName,
            email: socialAuthUser.user.email,
            photoURL: socialAuthUser.user.photoURL,
            clockedIn: false,
            note: '',
            firstName: socialAuthUser.additionalUserInfo.profile.given_name,
            lastInitial: socialAuthUser.additionalUserInfo.profile.family_name[0] + '.',
          })
          .catch(error => {
            console.log(error)
            this.setState({error: JSON.stringify(error)})
          })
        } else {
          {/*Failed New User Check*/}
          console.log('existing user...')
        }
        this.setState({
          user: socialAuthUser,
          loading: false,
        })
      } else {
        {/*Failed Domain Check*/}

        const userToDelete = this.props.firebase.auth.currentUser

        userToDelete.delete().then(() => {
          this.setState({
            error: "Only users with an @umich.edu email address are permitted to use this application.",
            loading: false,
          })
        }).catch( error =>{
          this.setState({
            error: JSON.stringify(error),
            loading: false,
          })
          console.log('Error deleting user:', error)
        })
      }
    })

  }

  pushRoute = (destination) => {
    console.log('pushroute:', this.props)
    this.props.history.push(destination)
  }


  render(){
    {/*Loading Screen*/}
    if(this.state.loading){
      return(
        <LoadingIndicator />
      )
    }
    {/*Sign In Screen*/}
    if(!this.state.user){
      return(
        <SignIn {...this.props} buttonFunction = { this.clickedSignIn } error={this.state.error}/>
      )
    }

    {/*Signed-In Screen*/}
    return(
      <HomeMenu {...this.props} buttonFunction={ this.clickedSignOut} pushRoute ={ this.pushRoute }/>
    )
  }
}

const SignIn = (props) => {
  return(
    <Box m={5}>
      <Grid container justify="center" spacing={2}>
        {/*Text*/}
        <Grid item xs={12}>
          <Typography variant="h3">Sign In</Typography>
        </Grid>

        {/*Logo*/}
        <Grid item xs={12}>
          <Grid justify="center" container>
            <FullLogo style={{width: '300px'}}/>
          </Grid>
        </Grid>

        {/*Error Display*/}
        { props.error &&
          <Grid item xs={12}>
            <Alert severity = "warning">{ props.error }</Alert>
          </Grid>
        }

        {/*Button*/}
        <Grid item xs={12}>
          <Grid container justify="center">
            <Button variant='contained' onClick = { props.buttonFunction }>Sign in with Google</Button>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  )
}

const HomeMenu = (props) => {
  return(
    <Box m={5}>
      <Grid container justify="center" spacing={2}>
        {/*Breadcrumbs*/}
        <Breadcrumbs aria-label="breadcrumb">
          <Typography color="textPrimary">Home</Typography>
        </Breadcrumbs>
        
        {/*Text*/}
        <Grid item xs={12}>
          <Typography variant="h3">Employee Tools</Typography>
        </Grid>

        {/*Logo*/}
        <Grid item xs={12}>
          <Grid justify="center" container>
            <SmallLogo style={{width: '300px'}}/>
          </Grid>
        </Grid>

        {/*Whiteboard Button*/}
        <Grid item xs={12}>
          <Grid container justify="center">
            <Button variant="contained" color="primary" onClick={ () => { props.pushRoute(ROUTES.WHITEBOARD)}}>Whiteboard</Button>
          </Grid>
        </Grid>

        {/*Sign-Out Button*/}
        <Grid item xs={12}>
          <Grid container justify="center">
            <Button variant='contained' onClick = { props.buttonFunction }>Sign Out</Button>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  )
}

const Home = compose(
  withFirebase,
  withRouter,
)(HomeBase)

const HomeWithUser = () => (
  <AuthUserContext.Consumer>
    { authUser => (
        <Home authUser={authUser} />
      )
    }
  </AuthUserContext.Consumer>
)


export default HomeWithUser;
