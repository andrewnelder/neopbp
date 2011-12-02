/*****************************************************************************
 * Globals                                                                   *
 *****************************************************************************/

var nickname = null
  , gamename = null
  , gameid = null
  , game = io.connect('http://localhost:8080/');

/*****************************************************************************
 * Response Handlers                                                         *
 *****************************************************************************/

game.on('game name acknowledged', function(data) {
  //do something
});

game.on('game create acknowledged', function(data) {
  //do something
});

game.on('nickname acknowledged', function(data) {

});

game.on('password acknowledged', function(data) {

});

/*
 * 'joined' response
 */
game.on('joined', function(data) {
	// connected message
	addGameEntry(data['message'], data['author']);
});
	 
/*
 * 'message' response
 */
game.on('message', function(data) {
	// message received
	addGameEntry(data['message'], data['author']);
});

game.on('game found', function(data) {
	console.log('[SOCKET.IO] Received gameid.');
	gameid = data['gameid'];
	//TODO: Use the password field
	$('div#gamepw-parameter-window').css('display', 'block');
});

game.on('game not found', function() {
	$('div#creategame-parameter-window').css('display', 'block');
});

/*****************************************************************************
 * Form Handlers                                                             *
 *****************************************************************************/

$(function() {

  console.log('[JQUERY] Received callback.');

  $('input#gamename-field').keypress(function(e){
	if (e.keyCode == 13 && $.trim($("input#gamename-field").val()) != '') {
      console.log('[JQUERY] Gamename has been identified.');
      gamename = $("input#gamename-field").val();
      $('div#gamename-parameter-window').css('display', 'none');
      $('div#nickname-parameter-window').css('display', 'block');
      return false;
    }
  });

  $('input#nickname-field').keypress(function(e){
    if (e.keyCode == 13 && $.trim($("input#nickname-field").val()) != '') {
      console.log('[JQUERY] Nickname has been identified.');
      nickname = $("input#nickname-field").val();
      $('div#nickname-parameter-window').css('display', 'none');
      game.emit('request game', {gamename: gamename});
      return false;
    }
  });
  
  $('input#gamepw-field').keypress(function(e){
	    if (e.keyCode == 13 && $.trim($("input#gamepw-field").val()) != '') {
	      console.log('[JQUERY] Password received.');
	      password = $("input#gamepw-field").val();
	      $('div#gamepw-parameter-window').css('display', 'none');
	      $('div#game-window').css('display', 'block');
	      game.emit('join game', {gamename: gamename, gameid: gameid, nickname: nickname, gamepw: password});
	      return false;
	    }
  });

  $('form#creategame-form').submit(function(e) {
    e.preventDefault();
    var plpass = $.trim($('#plpass-field').val());
    var stpass = $.trim($('#stpass-field').val());
    var desc = $.trim($('textarea#desc-field').val());
    if (plpass != '' && stpass != '') {
    	game.emit('create game', {gamename: gamename, plpass: plpass, stpass: stpass, desc: desc});
    	$('div#creategame-parameter-window').css('display', 'none');
        $('div#game-window').css('display', 'block');
    }
  });
  
  $('#reply-form').submit(function(e) {
    e.preventDefault();
    var message = $('textarea#reply-field').val();
    if ($.trim(message) != '') {
      game.emit('add game entry', {message: message, author: nickname});
      $("textarea#reply-field").val('');
    }
  });

  $('#reply-field').blur(function() {
    if ($.trim($(this).val()) == '') {
      $('#reset-reply').click();
    }
  });

  $("#reply-field").focus(function() {
    if ($(this).css('height') != REPLYBOXMAXSIZE) {
      $(this).animate({"height": REPLYBOXMAXSIZE}, "fast" );
      $("#button_block").slideDown("fast");
      return false;
    }
  });

  $('#reply-field').keypress(function(e){
    if (e.ctrlKey && e.keyCode == 13) {
      $('#reply-form').submit();
      return false;
    }
  });

  $("#reset-reply").click(function() {
    $("#reply-field").val('');
    $("#reply-field").animate({"height": REPLYBOXMINSIZE}, "fast" );
    $("#button_block").slideUp("fast");
    return false;
  });
});

