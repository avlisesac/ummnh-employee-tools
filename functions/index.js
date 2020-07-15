const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.dailyJob = functions.pubsub.schedule('every day 00:00').onRun(async context => {
  functions.logger.log(`Checking for users that didn't clock out...`)
  return clockOutAllUsers();
})

async function clockOutAllUsers(){
  try{
    admin.initializeApp();
  } catch (e){
    functions.logger.log('error!:', e)
  }

  admin.database().ref('users').once('value', snapshot => {
    const allUsers = snapshot.val()
    const userKeys = Object.keys(allUsers)

    if(userKeys){
      functions.logger.log('There are some users that forgot to clock out, proceeding to clock them out.')
    } else {
      functions.logger.log('No users still clocked in, nothing to do here.')
    }

    for(var i = 0; i < userKeys.length; i++){
      const currentUserID = userKeys[i]
      const currentUser = allUsers[currentUserID]

      if(currentUser.clockedIn){
        functions.logger.log('user forgot to clock out:', currentUserID, currentUser.email);
        admin.database().ref(`users/${currentUserID}`).update({
          clockedIn: false
        }, function(error){
          if(error){
            functions.logger.log('error clocking out user:', error)
          } else {
            functions.logger.log(currentUser.email, 'has been successfully clocked out.')
          }
        })
      }
    }
  })
}
