/**
 * SnakeGame object
 */
function Server(onReady, addEnemy, removeEnemy, updateEnemy, onChangeLevel, addFood, removeFood) {
	this.firebaseUrl = "http://demo.firebase.com/snake";
	this.snakeData = new Firebase(this.firebaseUrl + '7249669454/');
	this.initializePlayer();	
	this.onReady = onReady;
	this.addEnemy = addEnemy;
	this.removeEnemy = removeEnemy;
	this.updateEnemy = updateEnemy;
	this.onChangeLevel = onChangeLevel;
	this.addFood = addFood,
	this.removeFood = removeFood;
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
};
Server.prototype.joinGame = function (gameId) {
	var self = this;
	this.gameData = new Firebase(this.firebaseUrl + gameId);
	this.levelData = new Firebase(this.firebaseUrl + gameId + "/level");
	this.food = new Firebase(this.firebaseUrl + gameId + "/food");
	this.foodList = [];	
	//set the level to zero by default
	this.setDefaultValue(this.firebaseUrl + gameId, "level", 0);
	this.playerList = new Firebase(this.firebaseUrl + gameId + "/player_list");
	this.playerData = this.playerList.push({player: this.playerName, turns: []});
	this.playerData.removeOnDisconnect();
	this.onReady(this.playerName);
	this.playerCount = 0;
	this.listeners = [];
	this.listeners.push({
		key: "child_added", 
		obj: this.playerList,
		func: this.playerList.on("child_added", function (snapshot) {	
			self.addEnemy(snapshot.val());
			console.log("added: ", snapshot.val());
			self.playerCount++;		
			self.updatePlayerCount();
		})
	});
	this.listeners.push({
		key: "value",
		obj: this.playerList,
		func: this.playerList.on("value", function (snapshot) {
			self.updateEnemy(snapshot.val());
		})
	});
	this.listeners.push({
		key: "child_removed", 
		obj: this.playerList,
		func: this.playerList.on("child_removed", function (snapshot) {
			self.playerCount--;
			self.updatePlayerCount();	
			self.removeEnemy(snapshot.val());
		}) 
	});
	this.listeners.push({
		key: "value", 
		obj: this.levelData ,
		func: this.levelData .on("value", function (snapshot) {	
			self.onChangeLevel(snapshot.val());
			console.log("new level: ", snapshot.val());			
		})
	});
	this.listeners.push({
		key: "child_added", 
		obj: this.food,
		func: this.food.on("child_added", function (snapshot) {	
			self.addFood(snapshot.val());
			self.foodList.push({ref:snapshot, point: snapshot.val()});
			console.log("added food: ", snapshot);
		})
	});
	this.listeners.push({
		key: "child_removed", 
		obj: this.food,
		func: this.food.on("child_removed", function (snapshot) {
			self.removeFood(snapshot.val());
			self.findAndRemoveFood(snapshot.val().x, snapshot.val().y);
			console.log("remove food: ", snapshot);
		}) 
	});
};
Server.prototype.createFood = function(x, y) {	
	this.food.push({x: x, y:y});
};
Server.prototype.eatFood = function (x, y) {
	var ref = this.findAndRemoveFood(x, y);
	
	if (ref != undefined)  {
		this.food.child(ref.name()).remove();
	}
};
Server.prototype.findAndRemoveFood = function (x, y) {
	var bFound = false;
	var i = 0;
	while (!bFound && i < this.foodList.length) {
		var item = this.foodList[i];
		if (item.point.x == x && item.point.y == y) {
			this.foodList.splice(i, 1);
			return item.ref;
		} else {
			i++;
		}
	}
};
Server.prototype.updateLevel = function (level) {
	 this.levelData.set(level);
};
Server.prototype.disconnect = function () {
	if (this.playerData) {
		this.playerData.remove();
		
		for (var i = 0; i < this.listeners.length; i++) {
			this.listeners[i].obj.off(this.listeners[i].key, this.listeners[i].func);
		}
	}
};

Server.prototype.updateMySnake = function (snake) {
	this.playerData.child('turns').set(snake.turns);
};

Server.prototype.updatePlayerCount = function () {
	//this.playerCount
};

Server.prototype.setDefaultValue = function (db, id, value) {
	var reference = new Firebase(db);
	reference.child(id).transaction(function(currentData) {
		if (currentData === null)
			return value;
	}, function(success) {
		
	});
};

	

