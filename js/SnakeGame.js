function SnakeGame() {
	this.canvas = new AsciiCanvas();	
	this.initializeControls();	
	
	//start update loop
	var self = this;
	(function updateFunc(time) {
		window.requestAnimationFrame(updateFunc);
		self.update();
	})();	
	
	this.showSplashScreen();
}
SnakeGame.STATE_SPLASH = "STATE_SPLASH";
SnakeGame.STATE_DIFFICULTY = "STATE_DIFFICULTY";
SnakeGame.STATE_PAUSED = "STATE_PAUSED";
SnakeGame.STATE_MULTIPLAYER_PAUSED = "STATE_MULTIPLAYER_PAUSED";
SnakeGame.STATE_PLAYING = "STATE_PLAYING";
SnakeGame.STATE_GAME_OVER = "STATE_GAME_OVER";

SnakeGame.prototype.reset = function () {
	this.snakes = [];
	this.food = [];
	this.snakes.push(new Snake());
	
	this.objectives = [];
	this.objectives.push(undefined);
	this.canvas.clearSnakes();
	this.canvas.clearWalls();
};
SnakeGame.prototype.initializeControls = function () {
	var self = this;
	if ("ontouchstart" in window) {
		$("body").swipe({swipe: function (e, direction, distance) {
			this.yourSnake.setNewDir(SnakeGame.directionMap[direction]);
			}
		});
	} else {
		$(document).on("keydown", function (e) { self.keyDown(e); });
	}
	$(document).focus();
};

SnakeGame.prototype.showSplashScreen = function () {	
	$("div.screen").hide();
	$("#splashScreen").show();
	this.reset();
	this.gameState = SnakeGame.STATE_SPLASH;	 
	this.levelIndex = 7;
	this.level = SnakeGame.levels[this.levelIndex];
	
	if (this.server) {
		this.server.disconnect();
		this.server = undefined;
	}
};
SnakeGame.prototype.showDifficultyScreen = function () {
	this.gameState = SnakeGame.STATE_DIFFICULTY;
	$("#splashScreen").hide();
	$("#difficultyScreen").show();
};
SnakeGame.prototype.showJoiningScreen = function () {
	this.gameState = SnakeGame.STATE_MULTIPLAYER_PAUSED;
	this.enemyMap = {};
	$("div.screen").hide();
	$("#joiningGame").show();
	var self = this;
	this.server = new Server();
	
	this.server.on(Server.READY, function(evt, name) {
			self.options = SnakeGame.difficulty.medium;
			self.name = name;
		});
	this.server.on(Server.ADD_ENEMY, function (evt, enemySnake) {
		self.addEnemySnake(enemySnake);
	});
	this.server.on(Server.REMOVE_ENEMY, function (evt, enemySnake) {
		self.removeEnemySnake(enemySnake);
	});
	this.server.on(Server.UPDATE_ENEMY, function (evt, enemySnake) {
		self.updateEnemySnake(enemySnake);
	});
	this.server.on(Server.CHANGE_LEVEL, function (evt, newLevel) {		
		$("div.screen").hide();
		self.levelIndex = newLevel;
		self.level = SnakeGame.levels[self.levelIndex];
		self.showLevelTitleScreen();
	});
	this.server.on(Server.ADD_FOOD, function (evt, food) {
		self.addFood(food);
	});
	this.server.on(Server.REMOVE_FOOD, function (evt, food) {
		self.removeFood(food);
	});
};

SnakeGame.prototype.addEnemySnake = function (enemySnake) {
	
	if (enemySnake.player == this.name) return;
	
	var snake = new Snake();
	this.enemyMap[enemySnake.player] = snake;
	snake.turns = enemySnake.turns;
	snake.name = enemySnake.player;
	if (this.snakes.length == 0) {
		this.snakes.push(new Snake()); //make sure your snake is added before adding enemies
	}
	this.snakes.push(snake);
};

SnakeGame.prototype.updateEnemySnake = function (allSnakes) {
	for (var i in allSnakes) {
		var snake = this.enemyMap[allSnakes[i].player];
		var turns = allSnakes[i].turns;
		if (snake != undefined && turns != undefined) {
			snake.newTurns = turns;
		}
	}
};
SnakeGame.prototype.removeEnemySnake = function (snake) {
	var bFound = false;
	var i = 0;
	while (!bFound && i < this.snakes.length) {
		if (this.snakes[i].name == snake.player) {
			bFound = true;
			this.clearSnake(this.snakes[i], AsciiCanvas.OTHER_SNAKES );
			this.snakes.splice(i, 1);
		} else {
			i++;
		}
	}
};
SnakeGame.prototype.addFood = function (food) {
	this.food.push(food);
	this.canvas.drawCharacter(food.x, food.y, "\u263C", AsciiCanvas.SNAKE);
	this.lastFoodUpdate = + new Date;
	this.nextFoodUpdate = Math.random() * 5000 + 20;
};
SnakeGame.prototype.removeFood = function (food) {
	var bFound = false;
	var i = 0;
	while (!bFound && i < this.food.length) {
		if (this.food[i].x == food.x && this.food[i].y == food.y) {
			bFound = true;
			this.canvas.drawCharacter(this.food[i].x, this.food[i].y, " ", AsciiCanvas.SNAKE);			
			this.food.splice(i, 1);
		} else {
			i++;
		}
	}
	this.lastFoodUpdate = + new Date;
	this.nextFoodUpdate = Math.random() * 5000 + 20;
};

SnakeGame.prototype.showLevelTitleScreen = function () {
	this.gameState = SnakeGame.STATE_PAUSED;
	$("div.screen").hide();
	$("#levelScreen").show();
	$("#levelTitle").html(this.level.title);	
	this.walls = [];
	this.canvas.clearWalls();
	this.canvas.clearSnakes();
	this.drawWalls();
};

SnakeGame.prototype.showSnakeDiedScreen = function () {
	this.gameState = SnakeGame.STATE_PAUSED;
	$("#snakeDied").show();
};

SnakeGame.prototype.startGame = function () {
	$("div.screen").hide();
	this.gameState = SnakeGame.STATE_PLAYING;
	
	var startingPoint = this.canvas.getRandomPoint();
	var startingDir;
	if (startingPoint.x < this.canvas.width/2) {
		startingDir = {x: 1, y:0}; 
	} else if (startingPoint.y < this.canvas.height/2) {
		startingDir = {x: 0, y: 1};
	} else if (Math.random() < .5) {
		startingDir = {x: -1, y: 0};
	} else {
		startingDir = {x: 0, y: -1};
	}
	this.canvas.clearSnakes();
	this.yourSnake = new Snake(startingPoint.x, startingPoint.y, this.options.startLen, startingDir);
	this.snakes[0] = this.yourSnake;
	this.snakes[0].name = this.name;
	
	this.setMyObjective(1);
	this.drawAllObjectives();
	
	this.lastUpdate = + new Date;
	this.timeAccum = 0;
	this.speed = this.options.speed;
	
	this.lastFoodUpdate = + new Date;
	this.nextFoodUpdate = Math.random() * 5000 + 2000;
	
	
};
SnakeGame.prototype.levelCompleted = function () {
	if (this.levelIndex == SnakeGame.levels.length - 1) {
		//TODO handlegame over
		this.levelIndex = 0;
	} else {
		this.levelIndex++;
	}
	if (this.server) {
		this.server.updateLevel(this.levelIndex);
	} else {
		this.level = SnakeGame.levels[this.levelIndex];
		this.showLevelTitleScreen();
	}
};
SnakeGame.prototype.keyDown = function (e) {
	e = e || window.event;
	//console.log(e.keyCode, this.gameState);
	if (this.gameState == SnakeGame.STATE_SPLASH) {
		if (e.keyCode == SnakeGame.keyCodesMap.NUMBER_ONE) {
			//start single player
			this.showDifficultyScreen();
		} else if (e.keyCode == SnakeGame.keyCodesMap.NUMBER_TWO) {
			//start multiplayer
			this.showJoiningScreen();
		}
	} else if (this.gameState == SnakeGame.STATE_DIFFICULTY) {
		if (e.keyCode == SnakeGame.keyCodesMap.NUMBER_ONE) {
			//easy
			this.options = SnakeGame.difficulty.easy;
			this.showLevelTitleScreen();
		} else if (e.keyCode == SnakeGame.keyCodesMap.NUMBER_TWO) {
			//medium
			this.options = SnakeGame.difficulty.medium;
			this.showLevelTitleScreen();
		} else if (e.keyCode == SnakeGame.keyCodesMap.NUMBER_THREE){
			//hard
			this.options = SnakeGame.difficulty.hard;
			this.showLevelTitleScreen();
		} else if (e.keyCode == SnakeGame.keyCodesMap.NUMBER_FOUR){
			//impossible
			this.options = SnakeGame.difficulty.impossible;
			this.showLevelTitleScreen();
		}
	}  else if (this.gameState == SnakeGame.STATE_PAUSED) {
		if (e.keyCode == SnakeGame.keyCodesMap.SPACE_BAR) {
			this.startGame();
		}
	} else if (this.gameState == SnakeGame.STATE_PLAYING) {		
		var newDir = SnakeGame.keyMapping[e.keyCode];
		this.yourSnake.setNewDir(newDir);		
	}
	
	//handle escape key
	if (e.keyCode == SnakeGame.keyCodesMap.ESCAPE) {
		this.showSplashScreen();		
	}
};
SnakeGame.keyCodesMap = {
		ESCAPE: 27,
		NUMBER_ONE: 49,
		NUMBER_TWO: 50,
		NUMBER_THREE: 51,
		NUMBER_FOUR: 52,
		SPACE_BAR: 32
};

SnakeGame.prototype.setMyObjective = function(value) {
	var point = this.canvas.getEmptyRandomCell();
	
	this.objectives[0] = ({goal: point, x:point.bottom.x, y: point.bottom.y, value: value});
};

SnakeGame.prototype.update = function () {
	this.maximizeFood();
	var curTime = + new Date;
	var dt = curTime - this.lastUpdate + this.timeAccum;	
	var updates = 0;	
	if (this.server) {
		this.updateOtherSnakes();
	}
	
	while (dt > this.speed) {		
		if (this.gameState == SnakeGame.STATE_PLAYING) {
			this.updateSnake(this.yourSnake);
		}
		dt -= this.speed;
		updates++;
	}
	
	if (this.server && this.gameState == SnakeGame.STATE_PLAYING) {
		this.server.updateMySnake(this.yourSnake);
	}
	
	this.timeAccum = dt;
	this.lastUpdate = curTime;
	
};

SnakeGame.prototype.maximizeFood = function () {
	var now  = (+ new Date);
	if (this.server && this.server.food && (now - this.lastFoodUpdate) > this.nextFoodUpdate) {
		var max = SnakeGame.MAX_FOOD;
		var addFood = max - this.food.length;
		for (var i = 0; i < addFood; i++) {
			var point = this.canvas.getEmptyRandomCell().bottom;
			this.server.createFood(point.x, point.y);
		}
		this.lastFoodUpdate = now;
	}
};
SnakeGame.prototype.updateOtherSnakes = function () {
	for (var i = 1; i < this.snakes.length; i ++) {
		
		if (this.snakes[i].turns != undefined && this.snakes[i].turns.length > 0) {
			this.clearSnake(this.snakes[i], AsciiCanvas.OTHER_SNAKES);
		}
		if (this.snakes[i].newTurns != undefined && this.snakes[i].newTurns.length > 0) {
			this.snakes[i].turns = this.snakes[i].newTurns; 
			this.drawSnake(this.snakes[i], AsciiCanvas.OTHER_SNAKES);
		}
	}
};
SnakeGame.prototype.updateSnake = function (snake) {
	var removeAddPoints = snake.update();
	
	if (removeAddPoints != undefined) {
		var collision = this.isCollision(removeAddPoints.add.x, removeAddPoints.add.y);
		
		if (collision == "wall" || collision == "snake") {			
			snake.timeOfDeath = + new Date;
			this.showSnakeDiedScreen();
			return;
		} else if (collision == "goal") {
			snake.length += this.options.grow;
			this.canvas.drawCharacter(this.objectives[0].x, this.objectives[0].y, " ", AsciiCanvas.SNAKE);
			if (this.objectives[0].value == SnakeGame.MAX_OBJECTIVE) {
				this.levelCompleted();
				return;
			}
			this.setMyObjective( this.objectives[0].value + 1);
			this.drawAllObjectives();
			this.speed *= this.options.speedUp;
		}
		
		//clear pixels			
		if (removeAddPoints.remove != undefined) {
			this.canvas.clearPixel(removeAddPoints.remove.x, removeAddPoints.remove.y, AsciiCanvas.SNAKE);
		}
		this.canvas.drawPixel(removeAddPoints.add.x, removeAddPoints.add.y, AsciiCanvas.SNAKE);
	} else {
		//handle snake dead timer
	}
};

SnakeGame.prototype.drawWalls = function () {
	this.canvas.setDrawMethod("drawPixel");
	var walls = this.level.walls;
	for (var i = 0; i < walls.length; i++) {
		this.canvas.moveTo(walls[i][0].x, walls[i][0].y);
		this.canvas.lineTo(walls[i][1].x, walls[i][1].y, AsciiCanvas.WALLS);
	}
};

SnakeGame.prototype.drawAllSnakes = function () {
	for (var i = 0; i < this.snakes.length; i++) {		
		this.drawSnake(this.snakes[i], i==0?AsciiCanvas.SNAKE:AsciiCanvas.OTHER_SNAKES);
	}
};
SnakeGame.prototype.drawAllObjectives = function () {
	for (var i = 0; i < this.objectives.length; i++) {
		if (this.objectives[i] != undefined) {
			this.canvas.drawCharacter(this.objectives[i].x, this.objectives[i].y, this.objectives[i].value, AsciiCanvas.SNAKE);
		}
	}
	
	for (var i = 0; i < this.food.length; i++) {
		this.canvas.drawCharacter( this.food[i].x, this.food[i].y, "\u263C", AsciiCanvas.SNAKE);
	}
};
SnakeGame.prototype.drawSnake = function (snake, drawing) {
	this.canvas.setDrawMethod("drawPixel");
	var turns = snake.turns;
	this.canvas.moveTo(turns[0].x, turns[0].y);
	for (var i = 0; i < turns.length; i++) {
		this.canvas.lineTo(turns[i].x, turns[i].y, drawing);
	}
};
SnakeGame.prototype.clearSnake = function (snake, drawing) {
	this.canvas.setDrawMethod("clearPixel");
	var turns = snake.turns;
	this.canvas.moveTo(turns[0].x, turns[0].y);
	for (var i = 0; i < turns.length; i++) {
		this.canvas.lineTo(turns[i].x, turns[i].y, drawing);
	}
};
SnakeGame.prototype.isCollision = function (x, y) {
	//check for outside wall collisions
	if (x < 1 || x > this.canvas.width - 2 || y < 2 || y > this.canvas.height * 2 - 3) {
		return "wall";
	}
	
	for (var iSnake = 0; iSnake < this.snakes.length; iSnake++) {
		var turns = this.snakes[iSnake].turns;
		if (turns != undefined) {
			for (var i = 0; i < turns.length; i++) {
				//make sure not comparing to own head
				if ((iSnake != 0 || i < turns.length - 2)) {
					if (x == turns[i].x) {
						var start = turns[i].y;
						var end = turns[i+1] == undefined?start:turns[i+1].y;
						
						var max, min;
						if (end > start) {
							max = end;
							min = start;
						} else {
							max = start;
							min = end;
						}
						
						if (y >= min && y <= max) {
							return "snake";
						}
					} else if (y == turns[i].y) {					
						var start = turns[i].x;
						var end = turns[i+1] == undefined?start:turns[i+1].x;
						var max, min;
						if (end > start) {
							max = end;
							min = start;
						} else {
							max = start;
							min = end;
						}
						
						if (x >= min && x <= max) {					
							return "snake";
						}
					}
				}
			}			
		}
	}
	
	//check for wall collisions
	for (var i = 0; i  < this.level.walls.length; i++) {
		if (this.isPointOnLine(x, y, this.level.walls[i][0].x, this.level.walls[i][0].y, this.level.walls[i][1].x, this.level.walls[i][1].y)) {
			return "wall";
		}	
	}
	
	//check for goal collisions
	var goal = this.objectives[0].goal;
	if ((x == goal.top.x || x == goal.bottom.x)
			&& (y == goal.top.y || y == goal.bottom.y))  {
		return "goal";
	}
	
	//check for food collision
	var bottomY = Math.floor(y/2)*2;
	var topY = bottomY-1;
	for (var i = 0; i < this.food.length; i++) {
		if (x == this.food[i].x && (bottomY == this.food[i].y || topY == this.food[i].y))  {
			this.server.eatFood(this.food[i].x, this.food[i].y);
			this.yourSnake.length += this.options.grow;
			this.speed *= this.options.speedUp;			
		}
	}
	
	
	//if reached here then not a collision
	return false;
};

SnakeGame.prototype.isPointOnLine = function (x, y, x0, y0, x1, y1) {
	if (x == x0 || x == x1) { 
		var min = Math.min(y0, y1);
		var max = Math.max(y0, y1);
		
		return y >= min && y <= max;
	} else if (y == y0 || y == y1) {
		var min = Math.min(x0, x1);
		var max = Math.max(x0, x1);
		
		return x >= min && x <= max;
	}
};

SnakeGame.directionMap = {
		up : {
			x : 0,
			y : -1
		},
		down : {
			x : 0,
			y : 1
		},
		left : {
			x : -1,
			y : 0
		},
		right : {
			x : 1,
			y : 0
		}
};

SnakeGame.keyMapping = {
			"38" : SnakeGame.directionMap.up,
			"40" : SnakeGame.directionMap.down,
			"37" : SnakeGame.directionMap.left,
			"39" : SnakeGame.directionMap.right
		};
SnakeGame.MAX_OBJECTIVE = 5;
SnakeGame.MAX_FOOD = 5;

//lower speed is faster
SnakeGame.difficulty =  {
		easy: {
			startLen: 3,
			speed: 350,
			speedUp: .96,
			grow: 8
		}, 
		medium: {
			startLen: 10,
			speed: 200,
			speedUp: .93,
			grow: 15
		}, 
		hard:  {
			startLen: 15,
			speed: 90,
			speedUp: .87,
			grow: 20
		}, 
		impossible:  {
			startLen: 1000,
			speed: 85,
			speedUp: .82,
			grow: 20
		}
	};
	
	
SnakeGame.levels = [
		 {
			speed: 1,
			title: "Level 1: It's Too Easy",
			walls: []
		},
		 {
			speed: .99,
			title: "Level 2: Wall In the Middle",
			walls: [ [{x:20, y: 25}, {x:60, y: 25}]]
		},
		 {
			speed: .95,
			title: "Level 3: Oh No! Two Lines In the Middle!",
			walls: [ [{x:20, y: 10}, {x:20, y: 40}] , [{x:60, y: 10}, {x:60, y: 40}]]
		},
		 {
			speed: .93,
			title: "Level 4: More Lines",
			walls: [ [{x:0, y: 35}, {x:43, y: 35}] , [{x:20, y: 0}, {x:20, y: 25}],
			         [{x:79, y: 15}, {x:37, y: 15}] , [{x:60, y: 49}, {x:60, y: 25}]]
		},
		 {
			speed: .90,
			title: "Level 5: In a Box",
			walls: [ [{x:20, y: 15}, {x:20, y: 35}] , [{x:22, y: 12}, {x:58, y: 12}],
			         [{x:60, y: 15}, {x:60, y: 35}] , [{x:22, y: 38}, {x:58, y: 38}]]
		},
		 {
			speed: .88,
			title: "Level 6: Jail Time",
			walls: [ [{x:10, y: 1}, {x:10, y: 20}], [{x:20, y: 1}, {x:20, y: 20}],
			         [{x:30, y: 1}, {x:30, y: 20}], [{x:40, y: 1}, {x:40, y: 20}],
			         [{x:50, y: 1}, {x:50, y: 20}], [{x:60, y: 1}, {x:60, y: 20}],
			         [{x:70, y: 1}, {x:70, y: 20}],
			         [{x:10, y: 32}, {x:10, y: 49}], [{x:20, y: 32}, {x:20, y: 49}],
			         [{x:30, y: 32}, {x:30, y: 49}], [{x:40, y: 32}, {x:40, y: 49}],
			         [{x:50, y: 32}, {x:50, y: 49}], [{x:60, y: 32}, {x:60, y: 49}],
			         [{x:70, y: 32}, {x:70, y: 49}] ]
		},
		 {
			speed: .86,
			title: "Level 7: Cross the Dotted Line",
			walls: [ [{x:39, y: 3}, {x:39, y: 3}], [{x:39, y: 5}, {x:39, y: 5}],
			         [{x:39, y: 7}, {x:39, y: 7}], [{x:39, y: 9}, {x:39, y: 9}], [{x:39, y: 11}, {x:39, y: 11}],
			         [{x:39, y: 13}, {x:39, y: 13}], [{x:39, y: 15}, {x:39, y: 15}], [{x:39, y: 17}, {x:39, y: 17}],
			         [{x:39, y: 19}, {x:39, y: 19}],  [{x:39, y: 21}, {x:39, y: 21}],  [{x:39, y: 23}, {x:39, y: 23}],
					 [{x:39, y: 25}, {x:39, y: 25}],  [{x:39, y: 27}, {x:39, y: 27}],  [{x:39, y: 29}, {x:39, y: 29}],
					 [{x:39, y: 31}, {x:39, y: 31}],  [{x:39, y: 33}, {x:39, y: 33}],  [{x:39, y: 35}, {x:39, y: 35}],
					 [{x:39, y: 37}, {x:39, y: 37}],  [{x:39, y: 39}, {x:39, y: 39}],  [{x:39, y: 41}, {x:39, y: 41}],
					 [{x:39, y: 43}, {x:39, y: 43}],  [{x:39, y: 45}, {x:39, y: 45}],  [{x:39, y: 47}, {x:39, y: 47}]
					]
		},
		{
			speed: .84,
			title: "Level 8: Through the middle",
			walls: [  [{x:39, y: 1}, {x:39, y: 18}], [{x:39, y: 30}, {x:39, y: 48}],
			          [{x:30, y:10}, {x:30, y:10}],[{x:31, y:11}, {x:31, y:11}],[{x:32, y:12}, {x:32, y:12}],[{x:33, y:13}, {x:33, y:13}],[{x:34, y:14}, {x:34, y:14}],[{x:35, y:15}, {x:35, y:15}],[{x:36, y:16}, {x:36, y:16}],[{x:37, y:17}, {x:37, y:17}],[{x:38, y:18}, {x:38, y:18}],[{x:39, y:19}, {x:39, y:19}],[{x:40, y:20}, {x:40, y:20}],[{x:41, y:21}, {x:41, y:21}],[{x:42, y:22}, {x:42, y:22}],[{x:43, y:23}, {x:43, y:23}],[{x:44, y:24}, {x:44, y:24}],[{x:45, y:25}, {x:45, y:25}],[{x:46, y:26}, {x:46, y:26}],[{x:47, y:27}, {x:47, y:27}],[{x:48, y:28}, {x:48, y:28}],[{x:49, y:29}, {x:49, y:29}],[{x:50, y:30}, {x:50, y:30}],[{x:50, y:30}, {x:50, y:30}],
					  [{x:30, y:20}, {x:30, y:20}],[{x:31, y:21}, {x:31, y:21}],[{x:32, y:22}, {x:32, y:22}],[{x:33, y:23}, {x:33, y:23}],[{x:34, y:24}, {x:34, y:24}],[{x:35, y:25}, {x:35, y:25}],[{x:36, y:26}, {x:36, y:26}],[{x:37, y:27}, {x:37, y:27}],[{x:38, y:28}, {x:38, y:28}],[{x:39, y:29}, {x:39, y:29}],[{x:40, y:30}, {x:40, y:30}],[{x:41, y:31}, {x:41, y:31}],[{x:42, y:32}, {x:42, y:32}],[{x:43, y:33}, {x:43, y:33}],[{x:44, y:34}, {x:44, y:34}],[{x:45, y:35}, {x:45, y:35}],[{x:46, y:36}, {x:46, y:36}],[{x:47, y:37}, {x:47, y:37}],[{x:48, y:38}, {x:48, y:38}],[{x:49, y:39}, {x:49, y:39}],[{x:50, y:40}, {x:50, y:40}],[{x:50, y:40}, {x:50, y:40}]
					]
		}
	];	




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