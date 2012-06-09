
/**
 * The AsciiCanvas object has methods for drawing points and lines. The canvas draws the border initially.
 * When the window is resized the canvas is scaled to fit the window. The canvas is 25 text rows high, but
 * each ascii "pixel" is half a row, so the actual height is 50 "pixels".
 */
function AsciiCanvas() {
	this.drawPosition = {x:0, y:0};
	this.width = 80; //number of real text columns
	this.height = 25; //number of real text rows
	this.actualHeight = this.height * 2; //each vertical character will represent two y values
	this.snakeDrawing = [];
	this.otherSnakesDrawing = [];
	this.wallsDrawing = [];
	this.overlayDrawing = [];
	this.drawMethod = this.drawPixel;
	this.init();
}
AsciiCanvas.SNAKE = "snake";
AsciiCanvas.OTHER_SNAKES = "otherSnakes";
AsciiCanvas.WALLS = "walls";
AsciiCanvas.OVERLAY = "overlay";

AsciiCanvas.BLOCK = "\u2588";
AsciiCanvas.LOWER_BLOCK = "\u2584";
AsciiCanvas.UPPER_BLOCK_ALTERNATE = "\u2500";
AsciiCanvas.UPPER_BLOCK = "\u2580";
AsciiCanvas.FOOD = "\u263C";

AsciiCanvas.prototype.init = function () {
	this.initDrawing(AsciiCanvas.SNAKE);
	this.initDrawing(AsciiCanvas.OTHER_SNAKES);
	this.initDrawing(AsciiCanvas.WALLS);
	this.initDrawing(AsciiCanvas.OVERLAY);	
	this.resizeCanvas();
	$(window).resize(this.resizeCanvas);
};
AsciiCanvas.prototype.initDrawing = function (id) {
	var drawing = "";
	for ( var y = 0; y < this.height; y++) {
		drawing += "<pre>";
		for ( var x = 0; x < this.width; x++) {
			drawing += " ";
		}
		drawing += "</pre><br />";
	}
	$("#" + id).html(drawing);
	
	var self = this;
	this[id + "Drawing"] = [];
	$("#" + id + " pre").each(function () {
		self[id + "Drawing"].push({
			pre : $(this),
			text : $(this).text()
		});
	});
};

AsciiCanvas.prototype.drawBorder = function () {
	this.setDrawMethod("drawPixel");
	this.moveTo(0, 1);
	
	this.lineTo(this.width-1, 1, AsciiCanvas.WALLS);	
	this.lineTo(this.width-1, this.actualHeight-2, AsciiCanvas.WALLS);
	this.lineTo(0, this.actualHeight-2, AsciiCanvas.WALLS);	
	this.lineTo(0, 1, AsciiCanvas.WALLS);	
};

AsciiCanvas.prototype.clearSnakes = function () {
	this.initDrawing(AsciiCanvas.SNAKE);
	this.initDrawing(AsciiCanvas.OTHER_SNAKES);
};

AsciiCanvas.prototype.clearWalls = function () {
	this.initDrawing(AsciiCanvas.WALLS);
	this.drawBorder();
};

/**
 * Gets a random point within the borders
 * @return {x:Number, y:Number}
 */
AsciiCanvas.prototype.getRandomPoint = function () {
	return  {
			x : Math.floor(Math.random() * (this.width - 2)) + 1,
			y : Math.floor(Math.random() * (this.height * 2 - 4)) + 2
		};
};
AsciiCanvas.prototype.getEmptyRandomCell = function () {
	var point = this.getRandomPoint();

	//check if point is empty	
	if (this.isCellEmpty(point.x, point.y)) {
		return this.getCellPoints(point);		
	} else {
		return this.getEmptyRandomCell();
	}
};
AsciiCanvas.prototype.isCellEmpty = function(x, y) {
	//check snake
	var text = this.snakeDrawing[Math.floor(y / 2)].pre.text();	
	var current = text.charAt(x);
	if (current != " ") {
		return false;
	} else {
		//check other snakes
		var text = this.otherSnakesDrawing[Math.floor(y / 2)].pre.text();	
		var current = text.charAt(x);
		if (current != " ") {
			return false;
		} else {
			//check walls
			var text = this.wallsDrawing[Math.floor(y / 2)].pre.text();	
			var current = text.charAt(x);
			if (current != " ") {
				return false;
			} 
		}
	}
	return true;
};

AsciiCanvas.prototype.getCellPoints = function (point) {
	var actualY = Math.floor(point.y/2);
	return {actualY: actualY, 
			top: {x: point.x, y: actualY * 2 + 1}, 
			bottom: {x: point.x, y: actualY * 2}};
};

AsciiCanvas.prototype.drawCharacter = function (x, y, output, drawing) {	
	var text = this[drawing + "Drawing"][Math.floor(y / 2)].pre.text();
	var newText = text.substring(0, x) + output + text.substring(x + 1);	
	this[drawing + "Drawing"][Math.floor(y / 2)].pre.text(newText);
};

AsciiCanvas.prototype.setDrawMethod = function (methodStr) {
	this.drawMethod = this[methodStr];					
};
AsciiCanvas.prototype.moveTo = function (x, y) {
	this.drawPosition = {x:x, y:y};
};
AsciiCanvas.prototype.lineTo = function (x, y, drawing) {
	this.drawLine(this.drawPosition.x, this.drawPosition.y, x, y, drawing);
	this.moveTo(x, y);
};
/**
 * 
 * Credit: Bresenham line drawing algorithm from wikipedia: http://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm#Algorithm
 */
AsciiCanvas.prototype.drawLine = function (x0, y0, x1, y1, drawing) {
	 
	 var steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
     if (steep) {
    	 //swap x and y
    	 var temp = x0;
    	 x0 = y0;
    	 y0 = temp;
    	 
    	 temp = x1;
    	 x1 = y1;
    	 y1 = temp;
     }
     if (x0 > x1) {
    	//swap x0 and x1
    	 var temp = x0;
    	 x0 = x1;
    	 x1 = temp;
    	 
    	 temp = y0;
    	 y0 = y1;
    	 y1 = temp;         
     }
	 
	var dx = x1 - x0;
	var dy = y1 - y0;

	var diff = 2 * dy - dx;
	if (steep) {
		this.drawMethod(y0, x0, drawing);
	} else {
		this.drawMethod(x0, y0, drawing);
	}
	
	var y = y0;

	for ( var x = x0 + 1; x <= x1; x++) {
		if (diff > 0) {
			y = y + 1;
			if (steep) {
				this.drawMethod(y, x, drawing);
			} else {
				this.drawMethod(x, y, drawing);
			}
			
			diff = diff + (2 * dy - 2 * dx);
		} else {
			if (steep) {
				this.drawMethod(y, x, drawing);
			} else {
				this.drawMethod(x, y, drawing);
			}
			diff = diff + (2 * dy);
		}
	}
	
	if (steep) {
		this.drawMethod(y1, x1, drawing);
	} else {
		this.drawMethod(x1, y1, drawing);
	}
};

AsciiCanvas.prototype.drawPixel = function(x, y, drawing) {
	var output = y % 2 == 0 ? AsciiCanvas.UPPER_BLOCK : AsciiCanvas.LOWER_BLOCK;
	var text = this[drawing + "Drawing"][Math.floor(y / 2)].pre.text();

	var newText = "";
	var current = text.charAt(x);
	if (current == " ") {
		newText = text.substring(0, x) + output
				+ text.substring(x + 1);
	} else if (current != output) {
		newText = text.substring(0, x) + AsciiCanvas.BLOCK
				+ text.substring(x + 1);
	} else {
		newText = text; 
	}
	this[drawing + "Drawing"][Math.floor(y / 2)].pre.text(newText);
};

AsciiCanvas.prototype.clearPixel = function(x, y, drawing) {	
	var output = y % 2 == 0 ? AsciiCanvas.UPPER_BLOCK : AsciiCanvas.LOWER_BLOCK;
	var oppositeOutput = y % 2 != 0 ? AsciiCanvas.UPPER_BLOCK : AsciiCanvas.LOWER_BLOCK;
	var text = this[drawing + "Drawing"][Math.floor(y / 2)].pre.text();

	var newText;
	var current = text.charAt(x);
	if (current == " ") {
		//already blank
		return;
	} else if (current == output) {
		newText = text.substring(0, x) + " "
				+ text.substring(x + 1);
	} else {
		newText = text.substring(0, x) + oppositeOutput
				+ text.substring(x + 1);
	}
	this[drawing + "Drawing"][Math.floor(y / 2)].pre.text(newText);
};

AsciiCanvas.prototype.resizeCanvas = function() {
	$("#game").css({
		"font-size" : "1em"
	});
	
	var windowHeight = $(window).height();
	var windowWidth = $(window).width();
	var playAreaHeight = $("#game pre").height() * 27;
	var playAreaWidth = $("#game pre").width();
	var resizeRatio = Math.min(windowHeight / playAreaHeight,
			windowWidth / playAreaWidth);
	
	$("#game").css({
		"font-size" : (resizeRatio) + "em"
	});
};