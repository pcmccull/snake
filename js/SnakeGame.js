function SnakeGame() {
	this.snakes = [];
	this.walls = [];
	this.objectives = [];
	
	this.yourSnake = 0;
	this.canvas = new AsciiCanvas();
	this.options = SnakeGame.difficulty.medium;
	this.levelIndex = 0;
	this.level = SnakeGame.levels[this.levelIndex];
		
	this.initializeControls();
	
	this.startGame();
	
	this.showChooseDifficulty();
}

SnakeGame.prototype.initializeControls = function () {
	var self = this;
	if ("ontouchstart" in window) {
		$("body").swipe({swipe: function (e, direction, distance) {
				self.snakes[self.yourSnake].setNewDir(SnakeGame.directionMap[direction]);
			}
		});
	} else {
		$(document).on("keydown", function (e) { self.keyDown(e); });
	}
	$(document).focus();
};

SnakeGame.prototype.startGame = function () {
	this.snakes = [];
	this.walls = [];
	this.objectives = [];
	this.canvas.clearSnakes();
	this.canvas.clearWalls();
	var self = this;
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
	this.snakes.push(new Snake(startingPoint.x, startingPoint.y, this.options.startLen, startingDir));
	this.objectives.push(undefined);
	
	//TODO get other snakes, walls,  and objectives from server 
	
	this.drawWalls();
	this.drawAllObjectives();
	//this.drawAllSnakes();
	
	this.setMyObjective(1);
	this.drawAllObjectives();
	
	
	if (this.updateInterval != undefined) {
		clearInterval(this.updateInterval);
		this.updateInterval = undefined;
	}
	this.updateInterval = setInterval(function () {
		self.update();
	}, 20);
	this.lastUpdate = + new Date;
	this.timeAccum = 0;
	this.speed = this.options.speed;
	
};
SnakeGame.prototype.levelCompleted = function () {
	clearInterval(this.updateInterval);
	this.updateInterval = undefined;
	
	if (this.levelIndex == SnakeGame.levels.length) {
		//game over
	} else {
		this.levelIndex++;
		this.level = SnakeGame.levels[this.levelIndex];
		this.startGame();
	}
};
SnakeGame.prototype.keyDown = function (e) {
	e = e || window.event;
	if (e.keyCode == 32 && this.snakes[this.yourSnake].timeOfDeath != 0) {
		this.startGame();
	} else {
		var newDir = SnakeGame.keyMapping[e.keyCode];
		this.snakes[this.yourSnake].setNewDir(newDir);
	}
};

SnakeGame.prototype.setMyObjective = function(value) {
	var point = this.canvas.getEmptyRandomCell();
	this.objectives[0] = ({goal: point, x:point.bottom.x, y: point.bottom.y, value: value});
};

SnakeGame.prototype.update = function () {
	var curTime = + new Date;
	var dt = curTime - this.lastUpdate + this.timeAccum;	
	var updates = 0;
	while (dt > this.speed) {		
		this.updateSnake(this.snakes[this.yourSnake]);
		dt -= this.speed;
		updates++;
	}
	if (updates > 1)
		console.log(updates, this.speed);
	
	this.timeAccum = dt;
	this.lastUpdate = curTime;
};

SnakeGame.prototype.updateSnake = function (snake) {
	var removeAddPoints = snake.update();
	
	if (removeAddPoints != undefined) {
		var collision = this.isCollision(removeAddPoints.add.x, removeAddPoints.add.y);
		
		if (collision == "wall" || collision == "snake") {			
			snake.timeOfDeath = + new Date;
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
		this.drawSnake(this.snakes[i]);
	}
};
SnakeGame.prototype.drawAllObjectives = function () {
	for (var i = 0; i < this.objectives.length; i++) {
		if (this.objectives[i] != undefined) {
			this.canvas.drawCharacter(this.objectives[i].x, this.objectives[i].y, this.objectives[i].value, AsciiCanvas.SNAKE);
		}
	}
};
SnakeGame.prototype.drawSnake = function (snake) {
	this.canvas.setDrawMethod("drawPixel");
	var turns = snake.turns;
	this.canvas.moveTo(turns[0].x, turns[0].y);
	for (var i = 0; i < turns.length; i++) {
		this.canvas.lineTo(turns[i].x, turns[i].y, AsciiCanvas.SNAKE);
	}
};
SnakeGame.prototype.clearSnake = function (snake) {
	this.canvas.setDrawMethod("clearPixel");
	var turns = snake.turns;
	this.canvas.moveTo(turns[0].x, turns[0].y);
	for (var i = 0; i < turns.length; i++) {
		this.canvas.lineTo(turns[i].x, turns[i].y, AsciiCanvas.SNAKE);
	}
};
SnakeGame.prototype.isCollision = function (x, y) {
	//check for outside wall collisions
	if (x < 1 || x > this.canvas.width - 2 || y < 2 || y > this.canvas.height * 2 - 3) {
		return "wall";
	}
	
	for (var iSnake = 0; iSnake < this.snakes.length; iSnake++) {
		var turns = this.snakes[iSnake].turns;
		
		for (var i = 0; i < turns.length; i++) {
			//make sure not comparing to own head
			if ((iSnake != 0 || i < turns.length - 2)) {
				if (x == turns[i].x) {
					var start = turns[i].y;
					var end = turns[i+1] == undefined?turns[i].y:start;
					
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
					var end = turns[i+1] == undefined?turns[i].x:start;
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


SnakeGame.prototype.showChooseDifficulty = function () {
	
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
SnakeGame.MAX_OBJECTIVE = 9;
SnakeGame.difficulty =  {
		easy: {
			startLen: 3,
			speed: 350,
			speedUp: .96,
			grow: 8
		}, 
		medium: {
			startLen: 6,
			speed: 200,
			speedUp: .93,
			grow: 15
		}, 
		hard:  {
			startLen: 10,
			speed: 90,
			speedUp: .87,
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
			speed: .99,
			title: "Level 3: Oh No! Two Lines In the Middle!",
			walls: [ [{x:20, y: 10}, {x:20, y: 40}] , [{x:60, y: 10}, {x:60, y: 40}]]
		},
		 {
			speed: .99,
			title: "Level 4: Random Lines",
			walls: [ [{x:0, y: 35}, {x:43, y: 35}] , [{x:20, y: 0}, {x:20, y: 25}],
			         [{x:79, y: 15}, {x:37, y: 15}] , [{x:60, y: 49}, {x:60, y: 25}]]
		},
		 {
			speed: .99,
			title: "Level 5: In a Box",
			walls: [ [{x:20, y: 15}, {x:20, y: 35}] , [{x:22, y: 12}, {x:58, y: 12}],
			         [{x:60, y: 15}, {x:60, y: 35}] , [{x:22, y: 38}, {x:58, y: 38}]]
		},
		 {
			speed: .99,
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
			speed: .99,
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
		}
	];	