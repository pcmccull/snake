/**
 * SnakeGame object
 */
function Server(onReady, addEnemy, removeEnemy, updateEnemy) {
	this.firebaseUrl = "http://demo.firebase.com/snake";
	this.snakeData = new Firebase(this.firebaseUrl + '7249669454/');
	this.initializePlayer();	
	this.onReady = onReady;
	this.addEnemy = addEnemy;
	this.removeEnemy = removeEnemy;
	this.updateEnemy = updateEnemy;
}
Server.prototype.initializePlayer = function () {
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
Server.prototype.findGame = function (gameId) {
	var self = this;
	var gamesList = this.snakeData.child("games_list");
	
	gamesList.once('value', function(snapshot) {
	
		if (snapshot.val() === null) {
			self.createGame();
		} else {
			snapshot.forEach(function(childSnapshot) {
				  var data = childSnapshot.val();
				  self.currentLevel = data.currentLevel;
				  self.joinGame(data.id);
				  
				});
		}
	});
};
Server.prototype.createGame = function () {
	var self = this;
	var gamesList = this.snakeData.child("games_list");
	var gameId = 'game_' + (+ new Date);
	console.log("joining: " + gameId);
	this.game = gamesList.push({id:gameId}, function (result) {
		if (result) {
			self.joinGame(gameId);
		} else {
			//TODO handle unable to create game
			console.log("Error: unable to create game");
		}
	});
	this.game.currentLevel = 0;
	
};
Server.prototype.joinGame = function (gameId) {
	var self = this;
	this.gameData = new Firebase(this.firebaseUrl + gameId);
	this.playerData = this.gameData.push({player:this.playerName, turns:[]});
	this.playerData.removeOnDisconnect();
	this.onReady(this.currentLevel, this.playerName);
	this.playerCount = 0;
	console.log("joining: " + gameId);
	this.gameData.on("child_added", function (snapshot) {	
		self.addEnemy(snapshot.val());
		
		self.playersCount++;		
		self.updatePlayerCount();
		
	});
	this.gameData.on("value", function(snapshot) {
		self.updateEnemy(snapshot.val());
		console.log(snapshot.val());
	});
	this.gameData.on("child_removed", function (snapshot) {
		self.playerCount--;
		self.updatePlayerCount();	
		self.removeEnemy(snapshot.val());
	});
	
	
	
	console.log(this.playerData);
};

Server.prototype.updateMySnake = function (snake) {
	this.playerData.child('turns').set(snake.turns);
};

Server.prototype.updatePlayerCount = function () {
	console.log(this.playerCount);
};


	

