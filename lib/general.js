/*****************************************************************************
 * Globals                                                                   *
 *****************************************************************************/

var REPLYBOXMAXSIZE = '200px'
  , REPLYBOXMINSIZE = '30px'
  , nickname = null
  , gameid = null
  , game = io.connect('http://localhost:8080/');

/*****************************************************************************
 * Functions                                                                 *
 *****************************************************************************/

function determineAuthorType(author) {
  var author_type = 'from';
  if (author == 'system') { author_type = 'system'; }
  if (author == nickname) { author_type = 'to'; }
  return author_type;
}

function addGameEntry(txt, author) {
  var author_type = determineAuthorType(author);
  new_entry = '<div id='+author+' class="game-entry '+author_type+'">' + txt + 
              '<br /><div class="game-entry-author">'+author+'</div></div>';
  $('#game-text').prepend(new_entry);
  $('#'+author).fadeIn('slow');
}

/*****************************************************************************
 * Response Handlers                                                         *
 *****************************************************************************/

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


/*****************************************************************************
 * Form Handlers                                                             *
 *****************************************************************************/

$(function() {

  $('#gameid-field').keypress(function(e){
    if (e.keyCode == 13 && $.trim($("#gameid-field").val()) != '') {
      gameid = $("#gameid-field").val();
      $('#gameid-parameter-window').css('display', 'none');
      $('#nickname-parameter-window').css('display', 'block');
      return false;
    }
  });

  $('#nickname-field').keypress(function(e){
    if (e.keyCode == 13 && $.trim($("#nickname-field").val()) != '') {
      nickname = $("#nickname-field").val();
      $('#nickname-parameter-window').css('display', 'none');
      $('#game-window').css('display', 'block');
      game.emit('join game', {gid: gameid, nick: nickname});
      return false;
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