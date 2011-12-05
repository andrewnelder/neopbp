/*
 * Regular Imports
 */
var fs = require('fs')
  , path = require('path')
  , url = require('url')
  , crypto = require('crypto');

/*
 * Create Socket.IO Client
 */
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app);
app.listen(8080);

/*
 * Create Redis (Database) Client
 */
var redis = require('redis')
  , db = redis.createClient();

db.on("error", function (err) {
    console.log("[DB Error] " + err);
});

io.sockets.on('connection', function(socket) {

var gameid = null
  , gamename = null
  , nickname = null
  , gameinstance = null;

/*****************************************************************************
 * Login and Game Creation                                                   *
 *****************************************************************************/

  // The client has requested access to a particular game name.  Determine if
  // it exists.  If it does, return the gameid.  Otherwise, trigger a game
  // creation on the client.
  //
  // request: game name
  //   gname   - the game name
  // response: game name response
  //   success - 0/1 if the game was successfuly found
  //   gid     - the id of the game (optional)
  //   message - any error or failure messages (optional)
  socket.on('game name', function(data) {
    gamename = ""+data['gname'];
    db.exists('name:'+gamename, function(err, exists) {
      if (exists) {
        db.get('name:'+gamename, function(err, gid) {
          gameid = ""+gid;
          // FLAG: join might have a callback
          socket.join(gameid);
          socket.emit('game name acknowledged', {success: true, gid: gid, gname: gamename});
        });
      } else {
        socket.emit('game name acknowledged', {success: false, message: 'A game by that name already exists.'});
      }
    });
  }); // game name

  // The client has requested to create a game.  Determine if the game already
  // exists.  If the game does not already exist, create it and return gid.
  // If it already exists, then trigger game selection screen on the client.
  //
  // TODO: Add password support!
  //
  // request: game create
  //   gname   - the game name
  //   ppass   - the player password
  //   dpass   - the dungeon-master password
  // response: game create response
  //   success - 0/1 if the game was successfully created
  //   gid     - the id of the game (optional)
  //   message - any error or failure messages (optional)
  socket.on('game create', function(data) {
    gamename = ""+data['gname'];
    db.exists('name:'+gamename, function(err, exists) {
      if (!exists) {
        db.incr('gameid', function(err, gid) {
          db.set('name:'+gamename, ""+gid, function() {
            db.get('name:'+gamename, function(err, gid) {
              gameid = ""+gid;
              // TODO: join might have a callback
              socket.join(gameid);
              socket.emit('game create acknowledged', {success: true, gid: gid, gname: gamename});
            });
          });
        });
      } else {
        db.get('name:'+gamename, function(err, gid) {
          socket.emit('game create acknowledged', {success: false, message: 'A game by that name already exists.'});
        });
      }
    });
  }); // game create

  // The client has requested a nickname.  Return receipt to client.
  //
  // NOTE: Thie will eventually need to be modified to include a relationship
  //       between a logged-in account and a username.
  //
  // request: nickname
  //   nick    - the nickname
  // response: nickname response
  //   success - 0/1 if the name was successfully received
  //   nick    - altered/unaltered nickname if name was found already (optional)
  //   message - any error or failure messages (optional)
  socket.on('nickname', function(data) {
    nickname = data['nick'];
    socket.emit('nickname acknowledged', {success: true, nick: nickname});
  }); // nickname

  // The client has sent either the player- or dm-password to be validated.
  //
  // TODO: Incorporate password support.  Currently sends acknowledged as
  //       a player.
  //
  // request: password
  //   pass    - the password
  // response: password response
  //   success - 0/1 if password is correct
  //   urole   - the user-role (0 - player, 1 - dm)
  socket.on('gamepw', function(data) {
    var encrypted_pass = toCrypt(data['pass']);
    socket.emit('gamepw acknowledged', {success: true, urole: 0});
  }); // password

/*****************************************************************************
 * Messaging                                                                 *
 *****************************************************************************/

  // The client has requested that a message be added to the game log.  There
  // are no rules or requirements for the size/shape of this message; however,
  // it may contain special flags for parsing.
  //
  // This function is also responsible for storing the message in the database.
  //
  // request: message
  //   contents - the message contents
  //   urole    - the user-role (0 - player, 1 - dm)
  // response: message
  //   contents - the modified message contents
  //   author   - nickname of author
  //   
  socket.on('message', function(data) {
    var formatted_contents = processMessage(data['contents']);
    if (gameid) {
      db.incr('postid', function(err, postid) {
        db.set('post:'+postid, toCrypt(nickname) + "<<>>" + toCrypt(formatted_contents), function() {
          db.lpush('gameposts:'+gameid, postid, function() {
            socket.broadcast.to(gameid).emit('message', {contents: formatted_contents, author: nickname});
            socket.emit('message', {contents: formatted_contents, author: nickname});
            console.log('Added post ['+postid+'] to game ['+gameid+'].');
          });
        });
      });
    }
  }); // message

  // The client has attempted to send a user a private message.
  //
  // TODO: This is a later feature.  Not sure what the requirements are on
  //       the code.  Address request/response messages.
  socket.on('private message', function(data) {
    // do something
  }); // private message

  // The client has requested the recorded game log and history.
  //
  // TODO: Convert this from straight movement to a batched upload and make
  //       sure the client is blocking.  That way no messages will be missed.
  //
  // request: game log
  // response: message(s) [many responses will be sent]
  //   contents - the formatted message contents
  //   author   - the nickname of the author
  socket.on('game log', function(data) {
    db.lrange('gameposts:'+gameid, 0, -1, function(err, all_keys) {
      for (var i = 0; i < all_keys.length; i++) {
        console.log(all_keys[i]);
        db.get('post:'+all_keys[i], function(err, postData) {
          postData = postData.split("<<>>");
          author = fromCrypt(postData[0]);
          message = fromCrypt(postData[1]);
          socket.emit('message', {contents: message, author: author});
        });
      }
    });
  }); // game log
}); // socket listener

/*****************************************************************************
 * Functions                                                                 *
 *****************************************************************************/

// Formats a message's contents to be HTML friendly.
function processMessage (text) {
  text = nl2br(text, false);
  return text;
}

// Encrypts a piece of text.
function toCrypt (text) {
	var cipher = crypto.createCipher('des-ede3-cbc','s3cr37k3Y');
	var crypted = cipher.update(text,'utf8','hex');
	crypted += cipher.final('hex');
	return crypted;
}

// Decrypts a piece of text.
function fromCrypt (text) {
	var decipher = crypto.createDecipher('des-ede3-cbc','s3cr37k3Y');
	var decrypted = decipher.update(text,'hex','utf8');
	decrypted += decipher.final('utf8');
	return decrypted;
}

// Replaces new-line characters with html-breaks.
function nl2br (str, is_xhtml) {
    var breakTag = '<br />';
    if (typeof is_xhtml != 'undefined' && !is_xhtml) {
        breakTag = '<br>';
    }
    return (str + '').replace(/([^>]?)\n/g, '$1'+ breakTag +'\n');
}

/*****************************************************************************
 * Web-request Handler                                                       *
 *****************************************************************************/

function handler (request, response) {
  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri)
    , game_id = null;

  path.exists(filename, function(exists) {
    if(!exists) {         // throw 404 if nothing is found
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
    } else {              // otherwise render normally
      if (fs.statSync(filename).isDirectory()) filename += '/index.html';
        fs.readFile(filename, "binary", function(err, file) {
        if(err) {         // unknown file
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.write(err + "\n");
          response.end();
        } else {          // static file
          response.writeHead(200);
          response.write(file, "binary");
          response.end();
        }
      });
    }
  });
}
