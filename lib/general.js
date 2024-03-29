/*****************************************************************************
 * Globals                                                                   *
 *****************************************************************************/

var REPLYBOXMAXSIZE = '200px'
  , REPLYBOXMINSIZE = '30px';

/*****************************************************************************
 * Functions                                                                 *
 *****************************************************************************/

function determineAuthorType(author) {
  var author_type = 'from';
  if (author == 'system') { author_type = 'system'; }
  if (author == nickname) { author_type = 'to'; }
  return author_type;
}

function updateUserList(activeUsers) {
  $('ul#active-user-list').html('');
  for (var uidx = 0; uidx < activeUsers.length; uidx++) {
    $('ul#active-user-list').append('<li><a href="#" class="active-user-list-entry">' + activeUsers[uidx] + '</a></li>');
  }
}

function addGameEntry(txt, author) {
  var author_type = determineAuthorType(author);

  txt = postProcessText(txt, author);

  // Write it up
  if ($.trim(txt) != '') {
    new_entry = '<div id='+author+' class="game-entry rounded-corners '+author_type+'">' + txt + 
                '<br /><div class="game-entry-author">'+author+'</div></div>';
    $('#game-text').prepend(new_entry);
    $('#'+author).fadeIn('slow');
  }
}

function postProcessText(txt, author) {
  txt = processPrivateMessages(txt, author);
  txt = processSpoilers(txt);
  txt = processOOC(txt);
  return txt;
}

// Private messages
function processPrivateMessages(txt, author) {
  var pm_regex = /\[pm:(.+?)\]([\s\S]*?)\[\/pm\]/gi;
  var pm_match = pm_regex.exec(txt);
  while (pm_match != null) {
    if (pm_match[1] == nickname || author == nickname) {
      txt = txt.replace("[pm:"+pm_match[1]+"]"+pm_match[2]+"[/pm]","<font class='pm'>" + ((author == nickname) ? '[ ' + pm_match[1] + ' ] - ' : '') + pm_match[2] + "</font>");
    } else {
      txt = txt.replace(/\[pm:.+?\][\s\S]*?\[\/pm\]/gi, '');
    }
    pm_match = pm_regex.exec(txt);
  }
  return txt;
}

// Spoilers
function processSpoilers(txt) {
  var spoiler_regex = /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi;
  var spoiler_match = spoiler_regex.exec(txt);
  while (spoiler_match != null) {
    txt = txt.replace("[spoiler]"+spoiler_match[1]+"[/spoiler]", "<font class='spoiler'>" + spoiler_match[1] + "</font>");
    spoiler_match = spoiler_regex.exec(txt);
  }
  return txt;
}

function processOOC(txt) {
  var ooc_regex = /\[ooc\]([\s\S]*?)\[\/ooc\]/gi;
  var ooc_match = ooc_regex.exec(txt);
  while (ooc_match != null) {
    txt = txt.replace("[ooc]"+ooc_match[1]+"[/ooc]", "<font class='ooc'>" + ooc_match[1] + "</font>");
    ooc_match = ooc_regex.exec(txt);
  }
  return txt;

}

function getGameLog() {
  game.emit('game log');
}

/*****************************************************************************
 * Form Handlers                                                             *
 *****************************************************************************/

$(function() {

  $('input#nickname-field').keypress(function(e){
    var temp_nickname = $.trim($('input#nickname-field').val());
    if (e.keyCode == 13 && temp_nickname != '') {
      console.log('[CLIENT INFO] Nickname <'+temp_nickname+'> has been submitted.');
      game.emit('nickname', {nick: temp_nickname});
      return false;
    }
  });

  $('input#gamename-field').keypress(function(e){
    var temp_gamename = $.trim($('input#gamename-field').val());
    gamename = temp_gamename;
    if (e.keyCode == 13 && temp_gamename != '') {
      console.log('[CLIENT INFO] Game name <'+temp_gamename+'> has been submitted.');
      game.emit('game name', {gname: temp_gamename});
      return false;
    }
  });

  $('input#gamepw-field').keypress(function(e){
    var temp_gamepw = $.trim($("input#gamepw-field").val());
    if (e.keyCode == 13 && temp_gamepw != '') {
      console.log('[CLIENT INFO] The password has been submitted.');
      game.emit('gamepw', {pass: temp_gamepw});
      return false;
    }
  });

  $('form#creategame-form').submit(function(e) {
    e.preventDefault();
    var ppass = $.trim($('#plpass-field').val());
    var dpass = $.trim($('#stpass-field').val());
    if (ppass != '' && dpass != '') {
      game.emit('game create', {gname: gamename, ppass: ppass, dpass: dpass});
    }
  });

  $('form#reply-form').submit(function(e) {
    e.preventDefault();
    var temp_contents = $('textarea#reply-field').val();
    if (temp_contents != '') {
      game.emit('message', {contents: temp_contents, author: nickname});
      $("textarea#reply-field").val('');
    }
  });

  /* TODO: BASE THIS ON REPLY-FORM */
  $('form#reply-form').blur(function() {
    if ($.trim($('div#reply-field').val()) == '') {
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

  $("a.active-user-list-entry").click(function() {
    console.log('oh shit!');
    $("#reply-field").val('[SOMETHING]' + '[SOMETHINGELSE]');
    return false;
  });

});
