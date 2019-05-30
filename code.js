var outString = "";

var canvas;
var canvasWidth, canvasHeight;
var ctx;
var canvasData;

var meshWidth, meshHeight;
var meshArray;

var inOut = [];
var outOut = [];

var img = [16];
for (var i = 0; i < 16; i++) {
	img[i] = new Image(); // Create new img element
	img[i].src = 'images/tri-' + (i < 10 ? '0' : '') + i + '.png'; // Set source path
	
}

function drawScratch(){
	//loadImages();
	canvas = document.getElementById("myCanvas");
	canvasWidth = canvas.width;
	canvasHeight = canvas.height;
	ctx = canvas.getContext("2d");

	//ctx.fillStyle = "#FFFFFF";
	//ctx.fillStyle = "#000000";
	ctx.fillStyle = "#000400";
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);
	
	defineMesh();

	
	//grab existing/blank pixels from Canvas, for per-pixel draws
	canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
	
	//var r, g, b; // =  Math.floor((Math.random() * 255) + 1);

	scan();
		
	updateCanvas();

	document.getElementById("output").innerHTML += "meshNow:" + outString;
	//binForms();
}

// draw a single pixel
function drawPixel (x, y, r, g, b, a) {
    var index = (x + y * canvasWidth) * 4;

    canvasData.data[index + 0] = r;
    canvasData.data[index + 1] = g;
    canvasData.data[index + 2] = b;
    canvasData.data[index + 3] = a;
}

function setPixelCC (x, y, i, c) { // set one of r, g, b, or a
    var index = (x + y * canvasWidth) * 4;
    canvasData.data[index + i] = c;
}

//get either r, g, or b value of pixel
function getPixelCol(x, y, c) {
	var index = (x + y * canvasWidth) * 4;
	return canvasData.data[index + c];
}

// place the data onto the canvas
function updateCanvas() {
    ctx.putImageData(canvasData, 0, 0);
}

// storing x, y coordinates
function coords(x, y) { 
	this.x = x;
	this.y = y;
}

//scan every pixel and "do something"
function defineMesh (){
	meshWidth = Math.round(canvasWidth / 16); // 16 pixel width for image
	meshHeight = Math.round(canvasHeight / 16); // 16 pixel width for image
	var jj = 0;
	meshArray = new Array(meshHeight); // first part of 2D array to store compass values
	for (var y = 0; y < meshHeight; y++) {
		meshArray[y] = new Array(meshWidth); //second dimension of array to store compass values
		for (var x = 0; x < meshWidth; x++) {
			jj = 0;
			
			//check north
			if (y < meshHeight - 1) { // if not last row
				if (randomInt(10) > 4) { jj += compass.s; }
			}
			//check east
			if (x < meshWidth - 1) { // if not last column
				if (randomInt(10) > 5) { jj += compass.e; }
			}
			//check south
			if (y > 0) { // if not first row
				if (CheckBitState(meshArray[y-1][x], compass.s)) { jj += compass.n; }
			}
			//check west
			if (x > 0) { // if not first column
				if (CheckBitState(meshArray[y][x-1], compass.e)) { jj += compass.w; }
			}
			meshArray[y][x] = jj;
			ctx.drawImage(img[jj], x * 16, y * 16);
		}
	}
}

//scan every pixel and "do something"
function scan (){
	/* scan left to right: x-axis
	 * on black cells (r:value, g:seen/visit, b:0):
	 * - bake as first entry
	 * -- mark with start value, mark as visited
	 * -- NESW adjacent cells set value as value+1, mark as seen, add to array.
	 * - move to item at start of array
	 * - stop when array is empty again
	 */ 
	
	/* 
	 * either track value in stack
	 * bounce off max/min values with sin/cos?
	 * don't shift off stack, but store/iterate up to maintain size for 255/division
	 */

	for (var y = 0; y < canvasHeight; y++) {
		for (var x = 0; x < canvasWidth; x++) {
			r = getPixelCol(x, y, 0); //use pixel colour to see state
			if (r == 255) { continue; } //jump this iteration if pixel is white
			
			if (r == 0) { //starting point //on a black pixel
				drawPixel (x, y, 1, 1, 255, 255); //immediately pixel: value 1, +visited: temp
				inOut = [new coords(x,y)]; //start the stack with the first pixel
				
				outOut = [];
				dr = 1;
				while (inOut.length > 0 ) { //need to test vs "coords.x/.y" not pixel x/y
					cx = inOut[0].x; //retrieve X and Y co-ords for adjcency tests, from the start of the stack
					cy = inOut[0].y;
					r = getPixelCol(cx, cy, 0); // get cell value
					if (r + dr > 255) { dr = -1; }
					if (r + dr < 0) { dr = 1; }
					drawPixel(cx, cy, r, 2, 128, 255); //set cell as "visited"  //using pixel value
					
					if (testCell (cx - 1, cy)){ //test west
						inOut.push(new coords(cx - 1, cy)); //push cell
						drawPixel (cx - 1, cy, r + dr, 1, 255, 255); //set value + 1, set "seen": temp
					}
					if (testCell (cx + 1, cy)){ //tes east
						inOut.push(new coords(cx + 1, cy)); //push cell
						drawPixel (cx + 1, cy, r + dr, 1, 255, 255); //set value + 1, set "seen": temp
					}
					if (testCell (cx, cy - 1)){ //test north
						inOut.push(new coords(cx, cy - 1)); //push cell
						drawPixel (cx, cy - 1, r + dr, 1, 255, 255);  //set value + 1, set "seen": temp
					}
					if (testCell (cx, cy + 1)){ //test south
						inOut.push(new coords(cx, cy + 1)); //push cell
						drawPixel (cx, cy + 1, r + dr, 1, 255, 255);  //set value + 1, set "seen": temp
					}

					outOut.push(inOut.shift()); //remove front of the stack
				}
				
			}
		}
	}
}

//test x,y co-ords for borders, etc, and seen/unseen
function testCell (x, y){
	if (!(x < 0 || y < 0 || x > canvasWidth || y > canvasHeight)) { //test co-ordinates vs edge of world
		if (getPixelCol(x, y, 1) == 0) { //if "not touched"/ is black ... neither seen nor visited
			return true;
		}
	}
	return false;
}

/* 2D grid layout based on binary joins to adjacent cells
 * |06|14|12|
 * |07|15|13|
 * |03|11|09|
 */
var compass = {
	"none": 0,	//0000 00 - none

				// two directions
	"n": 1,		//0001 - 01 - N
	"e": 2,		//0010 - 02 - E
	"s": 4,		//0100 - 04 - S
	"w": 8,		//1000 - 08 - W

	"ne": 3,	//0011 - 03 - N+E
	"ns": 5,	//0101 - 05 - N+S
	"nw": 9,	//1001 - 09 - N+W
	"es": 6,	//0110 - 06 - E+S
	"ew":10,	//1010 - 10 - E+W
	"sw":12,	//1100 - 12 - S+W

				// Three directions
	"nes": 7,	//0111 - 07 - N+E+S
	"nwe":11,	//1011 - 11 - N+E+W  - variable as "nwe" to avoid "new" keyword
	"nsw":13,	//1101 - 13 - N+S+W
	"esw":14,   //1110 - 14 - E+S+W

	"all":15	//1111 - 15 - N+E+S+W
}

function FlipBitState(vValue, bSet) {
	return vValue ^ bSet;
}

function CheckBitState(vValue, bSet) {
	return (vValue & bSet) != 0;
}

function randomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function binForms() {
	//use bitwise stuff to make numbers to feed and get appropriate parts to fit need
	var vValue = 0;
	console.log("vValue: " + vValue); // = 0
	vValue &= compass.n; // 1 : A and B only
	console.log("vValue: " + vValue); // = 0
	vValue |= compass.nes; // 7 : A or B
	console.log("vValue: " + vValue); // = 7
	console.log(CheckBitState(vValue, compass.n)); // = true // vs 1
	console.log(CheckBitState(vValue, compass.w)); // = false // vs 8
	vValue = FlipBitState(vValue, compass.s); // 4
	console.log("vValue: " + (vValue == compass.ne)); // = true // vs 3
}