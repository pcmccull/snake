/**
 * SnakeGame object
 */
function Server() {
	this.firebaseUrl = "http://demo.firebase.com/snake";
	this.snakeData = new Firebase(this.firebaseUrl + '7249669454/');
	this.initializePlayer();	
	this.$this = $(this);
}
Server.READY = "READY";
Server.ADD_ENEMY = "ADD_ENEMY";
Server.REMOVE_ENEMY = "REMOVE_ENEMY";
Server.UPDATE_ENEMY = "UPDATE_ENEMY";
Server.CHANGE_LEVEL = "CHANGE_LEVEL";
Server.ADD_FOOD = "ADD_FOOD";
Server.REMOVE_FOOD = "REMOVE_FOOD";
	
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
	this.game = gamesList.push({id:gameId}, function (result) {
		if (result) {
			self.joinGame(gameId);
		} else {
			//TODO handle unable to create game
			console.log("Error: unable to create game");
		}
	});
};
Server.prototype.on = function (id, func) {  
	this.$this.on(id, func);
};
Server.prototype.off = function (id, func) {  
	this.$this.off(id, func);
};
Server.prototype.trigger = function (id, obj) {
	this.$this.trigger(id, obj);
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
	this.$this.trigger(Server.READY, this.playerName);
	this.playerCount = 0;
	this.listeners = [];
	this.listeners.push({
		key: "child_added", 
		obj: this.playerList,
		func: this.playerList.on("child_added", function (snapshot) {	
			self.trigger(Server.ADD_ENEMY, snapshot.val());
			self.playerCount++;		
			self.updatePlayerCount();
		})
	});
	this.listeners.push({
		key: "value",
		obj: this.playerList,
		func: this.playerList.on("value", function (snapshot) {
			self.trigger(Server.UPDATE_ENEMY, snapshot.val());
		})
	});
	this.listeners.push({
		key: "child_removed", 
		obj: this.playerList,
		func: this.playerList.on("child_removed", function (snapshot) {
			self.playerCount--;
			self.updatePlayerCount();	
			self.trigger(Server.REMOVE_ENEMY, snapshot.val());
		}) 
	});
	this.listeners.push({
		key: "value", 
		obj: this.levelData ,
		func: this.levelData .on("value", function (snapshot) {			
			self.trigger(Server.CHANGE_LEVEL, snapshot.val());	
		})
	});
	this.listeners.push({
		key: "child_added", 
		obj: this.food,
		func: this.food.on("child_added", function (snapshot) {	
			self.trigger(Server.ADD_FOOD, snapshot.val());
			self.foodList.push({ref:snapshot, point: snapshot.val()});
			
		})
	});
	this.listeners.push({
		key: "child_removed", 
		obj: this.food,
		func: this.food.on("child_removed", function (snapshot) {
			self.trigger(Server.REMOVE_FOOD, snapshot.val());
			self.findAndRemoveFood(snapshot.val().x, snapshot.val().y);			
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

	

