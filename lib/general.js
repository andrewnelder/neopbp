/*****************************************************************************
 * Instantiation                                                             *
 *****************************************************************************/

var gameLog = $('#game-text')
  , nickname = null
  , gameid = null
  , game = io.connect('localhost:8080');


/*****************************************************************************
 * Functions                                                                 *
 *****************************************************************************/

function addGameEntry(txt, author) {
  var author_type = 'from';
  if (author == 'system') { author_type = 'system'; }
  new_entry = '<div class="game-entry '+author_type+'">' + txt + 
              '<br /><div class="game-entry-author">'+author+'</div></div>';
  gameLog.append(new_entry);
}


/*****************************************************************************
 * Response Handlers                                                         *
 *****************************************************************************/

/*
 * 'joined' response
 */
game.on('joined', function(msg) {
	// connected message
	addGameEntry(msg, 'system');
});
 
/*
 * 'message' response
 */
game.on('msg', function(msg) {
	// message received
	addGameEntry(msg, 'system');
});


/*****************************************************************************
 * Form Handlers                                                             *
 *****************************************************************************/

$('#parameter-form').submit(function(e) {
  e.preventDefault();
  nickname = $('#nickname-field').val();
  gameid = $('#gameid-field').val();

  // TODO: Add these validators back in after debugging.
  //if (nickname && gameid && nickname != '' && gameid != '') {
  $('#parameter-window').css('display', 'none');
  $('#game-window').css('display', 'block');
  game.emit('join game', {gid: gameid});
  //game.emit('set nickname', nickname)
  
  //}
  
});

$('#reply-form').submit(function(e) {
  e.preventDefault();
  var msg = $('#reply-field').val();
  if (msg && msg != '') { game.emit('add game entry', msg); }
});

addGameEntry('something', 'system');