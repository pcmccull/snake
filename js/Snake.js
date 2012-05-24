/**
* A snake object will track the snakes body locations, and the exact length and position.
* The main method is update(), which returns the snake's new head location as "add" 
*/
function Snake(x, y, length, dir) {
	this.turns = [{x:x, y:y, dir:dir}];
	this.head = 0;
	this.length = length;			
	this.newDir = [];
	this.timeOfDeath = 0;	
}

/**
* Calculate the new snake position and return a point to remove and a point to add
* @return an object containing a point to add and possibly a point to remove {add: vectorObj, remove: vectorObj}
*/
Snake.prototype.update = function () {
	if (this.timeOfDeath != 0) { return;}
	var updatePoints = {};
	//move head
	var headVector = this.turns[this.head];
	var newDir = this.newDir.shift() || headVector.dir;
	
	if (Snake.compareVector(this.newDir, headVector.dir)) {
		//keep going same direction
		this.turns[this.head] = Snake.addDirection(headVector, headVector.dir);
	} else {
		this.turns.push(Snake.addDirection(headVector, newDir));
		this.turns[this.head].dir = newDir;
		this.head++;
	}
	updatePoints.add = this.turns[this.head];
	
	if (this.length == 1) {
		updatePoints.remove = headVector;
	} else {
	
		//move tail
		// first compute the currrent snake length
		var curLength = this.calculateLength();
		if (curLength > this.length) {
			//need to remove the tail
			var tailVector = this.turns[0];
			this.turns[0] = Snake.addDirection(tailVector, tailVector.dir);
			
			//check if the tail is equal to the next turn
			if (Snake.compareVector(this.turns[0], this.turns[1])) {
				this.turns.shift();
				this.head--;	
			}
			updatePoints.remove = tailVector;			
		} else if (curLength < this.length && this.turns.length == 1) {		
			
			//grow the snake
			this.turns.unshift(this.turns[0]);
			this.head++;
		}
	}
		
	return updatePoints;
};

/**
* Sets the new direction as long as it is not directly back into the snake
*/
Snake.prototype.setNewDir = function (newDir) {
	var headDir = this.turns[this.head].dir;
	if (this.newDir.length > 0) {
		headDir = this.newDir[0];
	}
	
	//check that the head vector plus the new vector 
	if (newDir != undefined
			&& ((headDir.x + newDir.x) != 0 || (headDir.y + newDir.y) != 0)) {
		this.newDir.push(newDir);
		
		//only allow buffering two moves ahead
		if (this.newDir.length > 2) {
			this.newDir.shift();
		}
	}
};

/**
* Calculate the current snake length using the turns array
*/
Snake.prototype.calculateLength = function () {
	if (this.turns.length == 1) {
		return 1;
	} else {
		var length = 1;
		for (var i = 1; i < this.turns.length; i++) {
			length += Snake.vectorLength(this.turns[i-1], this.turns[i]);
		}
		return length;
	}
};

/**
* Compares two vectors and returns true if their x and y values are both equal
* @param a - vector object
* @param b - vector object
*/
Snake.compareVector = function (a, b) {
	return a.x == b.x && a.y == b.y;
};

/**
* Adds the direction to vector a and sets the new direction
* @param a - vector to add to
* @param dir - direction vector to add and to set as new direction
*/
Snake.addDirection = function (a, dir) {
	return {x: (a.x + dir.x), y: (a.y + dir.y), dir: dir};
};

/**
* Computes the distance between vector a and b
* @param a - vector object
* @param b - vector object
*/
Snake.vectorLength = function (a, b) {
	//since all vectors are straight lines, just need to substract the x and y values
	return Math.abs(a.x-b.x + a.y - b.y);
};