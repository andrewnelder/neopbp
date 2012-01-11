/*****************************************************************************
 * Globals                                                                   *
 *****************************************************************************/

var nickname = null
  , gamename = null
  , gameid = null
  , urole = null
  , game = io.connect('http://localhost:8080/');


var REPLYBOXMAXSIZE = '200px'
  , REPLYBOXMINSIZE = '30px';

var stateEnum = {
  GAMENAME: 1,
  NICKNAME: 2,
  PASSWORD: 3,
  CREATEGAME: 4,
  GAME: 5
}

function changeState(state) {
  $('#game-window').css('display', 'none');
  $('.parameter-window').css('display', 'none');
  switch (state) {
    case (stateEnum.GAMENAME):
      $('#gamename-parameter-window').css('display', 'block');
      break;

    case (stateEnum.NICKNAME):
      $('#nickname-parameter-window').css('display', 'block');
      break;

    case (stateEnum.PASSWORD):
      $('#gamepw-parameter-window').css('display', 'block');
      break;

    case (stateEnum.CREATEGAME):
      $('#creategame-parameter-window').css('display', 'block');
      break;

    case (stateEnum.GAME):
      $('#game-window').val('');
      $('#game-window').css('display', 'block');
      getGameLog();
      break;

    default:
      // TODO: Create a loading state.  Since state changes depend on
      //       requests, it makes sense to have a lobby.
      console.log('[ERROR] Unable to isolate state.');
      break;
  }
}

/*****************************************************************************
 * Response Handlers                                                         *
 *****************************************************************************/

game.on('game name acknowledged', function(data) {
  if (data['success']) {
    console.log('[INFO] The game was found.');
    humane.log('The game was found.');
    gamename = ""+data['gname'];
    changeState(stateEnum.NICKNAME);
  } else {
    console.log('[INFO] The game was not found.');
    changeState(stateEnum.CREATEGAME);
  }
});

game.on('game create acknowledged', function(data) {
  if (data['success']) {
    console.log('[INFO] The game was created successfully.');
    gameid = ""+data['gid'];
    gamename = ""+data['gname'];
    changeState(stateEnum.NICKNAME);
  } else {
    console.log('[INFO] Unable to create the game.');
    humane.error('Unable to create the game.  Try joining again by reloading the page.');
  }
});

game.on('nickname acknowledged', function(data) {
  if (data['success']) {
    console.log('[INFO] The nickname was accepted.');
    nickname = ""+data['nick'];
    changeState(stateEnum.PASSWORD);
  } else {
    console.log('[INFO] The nickname was not accepted.');
    humane.error('The nickname was not accepted.');
  }
});

game.on('gamepw acknowledged', function(data) {
  if (data['success']) {
    console.log('[INFO] The password was accepted.');
    urole = data['urole'];
    changeState(stateEnum.GAME);
  } else {
    console.log('[INFO] The password was not accepted.');
    humane.error('The password was not accepted.');
  }
});

/*
 * 'message' response
 */
game.on('message', function(data) {
  addGameEntry(data['contents'], data['author']);
});

/*
 *
 */
game.on('active user list', function(data) {
  updateUserList(data['aul'].split('<<>>'));
});
