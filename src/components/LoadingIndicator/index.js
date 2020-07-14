import React from 'react';
import {
  Box,
  Container,
  CircularProgress,
  Grid,
  Typography,
} from '@material-ui/core'

const LoadingIndicator = () => {
  return(
    <Grid container direction="column" alignItems='center' justify='center' style={{minHeight:'100vh'}} spacing={2}>
      <Grid item xs={12}>
        <Grid container justify = "center">
          <CircularProgress color="secondary" />
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Typography variant='h3' m={5}>Loading...</Typography>
      </Grid>
    </Grid>
  )
}

export default LoadingIndicator;
