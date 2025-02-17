var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");

var combo = document.getElementById("combo");
var rating = document.getElementById("rating");

var levelActionTypes = {"location":0};
var levelShapeTypes = {"point":0,"square":1,"circle":2};

var levelStreak = 0;

var minSize = 0.1;
var minY = 0;

var guess = {done:false,x:0,y:0,timer:0}
var maxGuessTimer = 100;
var distanceForWin = 0.005;
//# of levels
var number = 0;
var score = 0;
var wins = 0;

var overallNumber = 0;
var overallScore = 0;
var overallWins = 0;

var size = createShapeSize(levelShapeTypes.point);
var size2 = createShapeSize(levelShapeTypes.square);
var level = {otherShape:{type:levelShapeTypes.square,size:size2,location:createShapeLocation(levelShapeTypes.square,size2)},shape:{type:levelShapeTypes.point,size,location:createShapeLocation(levelShapeTypes.point,size)}}

window.addEventListener("resize", resize);
window.addEventListener("pointerdown", function(e) {
	if(e.button === 1 || e.button === 2) {
		//no scroll click or right click
		return;
	}
	if(guess.done) {
		guess.timer = 1000;
		return;
	}
	guess.done = true;
	guess.x = e.clientX / window.innerWidth;
	guess.y = e.clientY / window.innerHeight;
});

var heightOverWidth = 0;
function resize(e) {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	heightOverWidth = canvas.height / canvas.width;
	minY = document.getElementById("navbar").clientHeight / window.innerHeight;
}
function load() {
	var saved = window.localStorage.getItem("savedAccuracy");
	if(saved === null || saved === undefined) {
		return;
	}
	saved = JSON.parse(saved);
	levelStreak = saved.levelStreak;
	overallWins = saved.overallWins;
	overallScore = saved.overallScore;
	overallNumber = saved.overallNumber;
	var percent = wins/number*100;
	if(isNaN(percent)) {
		percent = 0;
	}
	combo.innerHTML = "Combo: " + levelStreak + " (" + percent + "% Wins)";
}
function save() {
	window.localStorage.setItem("savedAccuracy",JSON.stringify({overallWins,overallScore,overallNumber,levelStreak}));
}
function init() {
	load();
	resize();
	startLevel();
	loop();
}

function createShapeSize(levelShapeType) {
	switch(levelShapeType) {
		case levelShapeTypes.point:
		return {w:0,h:0};
		case levelShapeTypes.square:
		return {w:Math.random()*(0.5-minSize)+minSize,h:Math.random()*(1-minSize)+minSize};
		case levelShapeTypes.circle:
		return {radius:Math.random()*(0.25-minSize)+minSize};
	}
}
function createShapeLocation(levelShapeType,shapeSize) {
	switch(levelShapeType) {
		case levelShapeTypes.point:
		console.log(minY);
		case levelShapeTypes.square:
		return {x:Math.random()*((0.5)-shapeSize.w - 0.01) + 0.01,y:Math.random()*(1 - shapeSize.h - minY - 0.01) + minY + 0.01};
		case levelShapeTypes.circle:
		return {x:Math.random()*(0.5-(shapeSize.radius*2))+shapeSize.radius,y:Math.random()*(1 - (shapeSize.radius*2) - minY) + (shapeSize.radius) + minY};
	}
}

function startLevel() {
	level.otherShape = {};
	level.otherShape.type = Math.floor(Math.random()*2)+1;
	level.otherShape.size = createShapeSize(level.otherShape.type);
	level.otherShape.location = createShapeLocation(level.otherShape.type,level.otherShape.size);
	level.shape = {};
	level.shape.type = levelShapeTypes.point;
	level.shape.size = createShapeSize(level.shape.type);
	level.shape.location = createShapeLocation(level.shape.type,level.shape.size);

	level.mirrorOtherShape = getMirrorShape(level.otherShape);
}
function restart() {
	levelStreak = 0;
	score = 0;
	number = 0;
	wins = 0;
	guess.timer = 0;
	guess.win = false;
	guess.done = false;
	startLevel();
}
function nextLevel() {
	if(guess.win) {
		levelStreak++;
	} else {
		levelStreak = 0;
	}
	rating.innerHTML = score + " points (" + Math.round(score/number) + " avg)";
	combo.innerHTML = "Combo: " + levelStreak + " (" + Math.round(wins/number*100) + "% Wins)";
	save();
	guess.win = false;
	guess.done = false;
	guess.timer = 0;
	guess.score = undefined;
	startLevel();

}

function loop() {
	window.requestAnimationFrame(function() {
		loop();
	});
	update();
	render();
}

function update() {
	if(guess.done) {
		var mirrored = getPointShape(level.shape,level.otherShape,level.mirrorOtherShape);
		if(guess.score === undefined) {
			number++;
			overallNumber++;
			if(!guess.win && distance(guess.x,guess.y*heightOverWidth,mirrored.location.x,mirrored.location.y*heightOverWidth) < distanceForWin) {
				guess.win = true;
				wins++;
				overallWins++;
			}
			guess.score = Math.round((1-distance(guess.x,guess.y*heightOverWidth,mirrored.location.x,mirrored.location.y*heightOverWidth))*1000);
			score += guess.score;
			overallScore += guess.score;
		}
		//guess.timer++;
		if(guess.timer > maxGuessTimer) {
			nextLevel();
		}
	}
}
function render() {
	ctx.clearRect(0,0,canvas.width,canvas.height);

	ctx.fillStyle = "white";
	ctx.fillRect(canvas.width/2,0,1,canvas.height);

	renderShape(level.shape);
	renderShape(level.otherShape);

	renderShape(level.mirrorOtherShape);
	if(guess.done) {
		renderShape({type:levelShapeTypes.point,location:{x:guess.x,y:guess.y}},guess.win ? "rgb(20,200,70)" : "rgb(200,70,20)");
		var gotPointShape = getPointShape(level.shape,level.otherShape,level.mirrorOtherShape);
		renderShape(gotPointShape);
		renderShape({type:levelShapeTypes.circle,location:{x:gotPointShape.location.x,y:gotPointShape.location.y},size:{radius:distanceForWin}})
	}
	//
}
function distance(x,y,x2,y2) {
	var x1 = x2-x;
	var y1 = y2-y;
	return Math.sqrt(x1*x1 + y1*y1);
}
function getMirrorShape(shape) {
	if(shape.type === levelShapeTypes.square) {
		var times = (Math.random()*(1-minSize)) + minSize;
		return {type:shape.type,location:{x:shape.location.x+0.5,y:shape.location.y},size:{w:shape.size.w * times,h:shape.size.h * times}};
	} else if(shape.type === levelShapeTypes.circle) {
		return {type:shape.type,location:{x:shape.location.x+0.5,y:shape.location.y},size:{radius:shape.size.radius*(Math.random()/4)+minSize}};
	}
}
//originalPoint revovles around otherShape
function getPointShape(originalPoint, otherShape, mirrorOtherShape) {
	var ratio;
	if(otherShape.type === levelShapeTypes.square) {
		//square
		ratio = mirrorOtherShape.size.w / otherShape.size.w;
	} else {
		//circle
		ratio = mirrorOtherShape.size.radius / otherShape.size.radius;
	}
	//ratio is the target ratio
	otherShape.location.x - originalPoint.location.x;
	return {type:levelShapeTypes.point,location:{x:(originalPoint.location.x - otherShape.location.x)*ratio + mirrorOtherShape.location.x,y:(originalPoint.location.y - otherShape.location.y)*ratio + mirrorOtherShape.location.y},size:{w:0,h:0}};
}
function renderMirrorShape(shape) {
	renderShape(getMirrorShape(shape));
}
function renderShape(shape,colorOverride) {
	if(shape.type === levelShapeTypes.circle || shape.type === levelShapeTypes.point) {
		var radius;
		if(shape.type === levelShapeTypes.point) {
			radius = 5;
		} else {
			radius = shape.size.radius * canvas.width;
		}
		ctx.strokeStyle = colorOverride !== undefined ? colorOverride : "black";
		ctx.fillStyle = "white";
		ctx.beginPath();
		ctx.lineWidth = 4;
		ctx.ellipse(shape.location.x*canvas.width, shape.location.y*canvas.height, radius, radius, 0, 0, 2 * Math.PI);
		ctx.stroke();
		
		/*ctx.ellipse(shape.location.x*canvas.width, shape.location.y*canvas.height, radius, radius, 0, 0, 2 * Math.PI);
		ctx.fill();*/
	} else if(shape.type === levelShapeTypes.square) {
		ctx.fillStyle = "white";
		ctx.fillRect(shape.location.x*canvas.width,shape.location.y*canvas.height,shape.size.w,shape.size.h);
		ctx.strokeStyle = "black";
		ctx.lineWidth = 4;
		ctx.strokeRect(shape.location.x*canvas.width,shape.location.y*canvas.height,shape.size.w*canvas.width,shape.size.h*canvas.height);
	}
}

init();