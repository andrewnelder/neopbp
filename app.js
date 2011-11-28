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
	    , nickname = null;
	  
	  socket.on('request game', function(data) {
		 // determine if a game exists or not and send a response
		 db.exists('name:'+data['gamename'], function(err, exists) {
			 if (exists) {
				 db.get('name:'+data['gamename'], function(err, gameid) {
					 socket.emit('game found', {gameid: gameid});
				 });
				 
			 } else {
				 socket.emit('game not found');
			 }
		 });
	  });
	  
	  socket.on('create game', function(data) {
		 db.exists('name:'+data['gamename'], function(err, exists) {
			 if (!exists) {
				 db.incr('gameid', function(err, gameid) {
					 db.set('name:'+data['gamename'], ""+gameid, function() {
						 db.get('name:'+data['gamename'], function(err, gameid) {
							 socket.emit('game found', {gameid: gameid}); 
						 });
					 });
				 });
			 } else {
				 db.get('name:'+data['gamename'], function(err, gameid) {
					 socket.emit('game found', {gameid: gameid}); 
				 });
			 }
		 });
	  });
	  
	  socket.on('join game', function(data) {
	    
	    gameid = data['gameid'];
	    gamename = data['gamename'];
	    nickname = data['nickname'];

	    socket.join(gameid);

	    db.lrange('gameposts:'+gameid, 0, -1, function(err, all_keys) {
	    	for (var i = 0; i < all_keys.length; i++) {
	    		console.log(all_keys[i]);
	    		db.get('post:'+all_keys[i], function(err, postData) {
	    			postData = postData.split("<<>>");
	    			author = fromCrypt(postData[0]);
	    			message = fromCrypt(postData[1]);
	    			socket.emit('message', {message: message, author: author});
	    		});
	    	}
	    });
	    socket.emit('joined', {message: "You have joined the game [" + gamename + "(" + gameid + ")" + "] as [" + nickname + "].", author: 'system'});
	    socket.broadcast.to(gameid).emit('message', {message: nickname + ' joined the game.', author: 'system'});
	    
	  });
	  
	  socket.on('add game entry', function(data) {
	    if (gameid) {
	      data['message'] = nl2br(data['message'], false);
	      socket.broadcast.to(gameid).emit('message', data);
	      socket.emit('message', data);
	      db.incr('postid', function(err, postid) {
	    	 db.set('post:'+postid, toCrypt(nickname) + "<<>>" + toCrypt(data['message']), function() {
	    		 db.lpush('gameposts:'+gameid, postid, function() {
	    			 console.log('Added post ['+postid+'] to game ['+gameid+'].');
	    		 });
	    	 }); 
	      });
	    } else {
	      socket.emit('message', {message: 'You are not in a room.', author: 'system'});
	    }
	  });
	});

function toCrypt (text) {
	var cipher = crypto.createCipher('des-ede3-cbc','s3cr37k3Y');
	var crypted = cipher.update(text,'utf8','hex');
	crypted += cipher.final('hex');
	return crypted;
}

function fromCrypt (text) {
	var decipher = crypto.createDecipher('des-ede3-cbc','s3cr37k3Y');
	var decrypted = decipher.update(text,'hex','utf8');
	decrypted += decipher.final('utf8');
	return decrypted;
}

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