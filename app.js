/*
 * Regular Imports
 */
var fs = require('fs')
  , path = require('path')
  , url = require("url");

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
    console.log("Error " + err);
});

io.sockets.on('connection', function(socket) {

	  var roomname = null
	    , nickname = null;
	  
	  socket.on('join game', function(data) {
	    
	    socket.join(data['gid']);
	    roomname = data['gid'];
	    nickname = data['nick'];
	    
	    // TODO: get the name of the room based on the id
	    game_name = data['gid'];

	    socket.emit('joined', {message: "You have joined the game [" + game_name + "] as [" + nickname + "].", author: 'system'});
	    socket.broadcast.to(roomname).emit('message', {message: nickname + ' joined the game.', author: 'system'});
	  
	  });
	    
	  socket.on('add game entry', function(data) {
	    if (roomname) {
	      socket.broadcast.to(roomname).emit('message', data);
	      // TODO: process data and store in db
	      data['message'] = nl2br(data['message'], false);
	      socket.emit('message', data);
	    } else {
	      socket.emit('message', {message: 'You are not in a room.', author: 'system'});
	    }
	  });
	});

function nl2br (str, is_xhtml) {
    var breakTag = '<br />';
    if (typeof is_xhtml != 'undefined' && !is_xhtml) {
        breakTag = '<br>';
    }
    return (str + '').replace(/([^>]?)\n/g, '$1'+ breakTag +'\n');
}

function handler (request, response) {

	var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri)
	, game_id = null;
  
  path.exists(filename, function(exists) {
    if(!exists) {
      
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      
    } else {

		if (fs.statSync(filename).isDirectory()) filename += '/index.html';
		
	    fs.readFile(filename, "binary", function(err, file) {
	      if(err) {        
	        response.writeHead(500, {"Content-Type": "text/plain"});
	        response.write(err + "\n");
	        response.end();
	      } else {
	        response.writeHead(200);
	        response.write(file, "binary");
	        response.end();
	      }
	    });
    }
  });

}