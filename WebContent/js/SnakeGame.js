//requestAnimationFrame polyfill http://paulirish.com/2011/requestanimationframe-for-smart-animating/
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

//start the snake game
$(function() {
	new SnakeGame();
});

/**
 * SnakeGame object
 */
function SnakeGame() {
	this.firebaseUrl = "http://demo.firebase.com/snake";
	this.snakeData = new Firebase(this.firebaseUrl + '7249669454/');
	$("#game").hide();
	this.initializePlayer();	
}
SnakeGame.prototype.initializePlayer = function () {
	var self = this;
	
	//update the total players and set the players name
	var totalPlayers = this.snakeData.child("totalPlayers");	
	totalPlayers.transaction(function(current_value) {	
	  return current_value + 1;
	}, function(success, snapshot) {
		self.playerName = "guest_" + snapshot.val();
		self.findGame();
	});
};
SnakeGame.prototype.findGame = function (gameId) {
	var self = this;
	var gamesList = this.snakeData.child("games_list");
	
	gamesList.once('value', function(snapshot) {
	
		if (snapshot.val() === null) {
			self.createGame();
		} else {
			snapshot.forEach(function(childSnapshot) {
				  var data = childSnapshot.val();
				  self.joinGame(data.id);
				});
		}
	});
};
SnakeGame.prototype.createGame = function () {
	var self = this;
	var gamesList = this.snakeData.child("games_list");
	var gameId = 'game_' + (+ new Date);
	gamesList.push({id:gameId}, function (result) {
		if (result) {
			self.joinGame(gameId);
		} else {
			//TODO handle unable to create game
			console.log("Error: unable to create game");
		}
	});
	
};
SnakeGame.prototype.joinGame = function (gameId) {
	
	this.gameData = new Firebase(this.firebaseUrl + gameId);
	this.playerCount = 0;
	this.gameData.on("child_added", function (snapshot) {
		self.playersCount++;
		self.updatePlayerCount();
	});
	this.gameData.on("child_removed", function (snapshot) {
		self.playerCount--;
		self.updatePlayerCount();		
	});
	$("#joiningMessage").hide();
	$("#game").show();
	
	this.playerData = this.gameData.push({player:this.playerName, moves:[]});
	this.playerData.removeOnDisconnect();
	
	console.log(this.playerData);
};
SnakeGame.prototype.startGame = function () {
	  var canvas = $('#playArea'); 
	 
	  var canvas = $canvas[0]; //get the actual dom element
	  var ctx = canvas.getContext('2d'); //get the context
	  ctx.fillStyle = '#fe57a1'; //hot pink!
	  ctx.fillRect(10, 10, 30, 50); //fill a rectangle (x, y, width, height)
}
SnakeGame.prototype.updatePlayerCount = function () {
	
}


	

