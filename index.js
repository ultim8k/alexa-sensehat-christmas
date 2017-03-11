'use strict';
const sense = require('sense-hat-led').sync;
const express = require('express')

var PORT = parseInt(process.env.PORT) || 80;
var ROTATE = parseInt(process.env.ROTATE) || 0;

var BRIGHTNESSSTEP = 10;
var g = [0, 180, 0]; // Green
var k = [0, 0, 0]; // Black
var y = [255, 255, 0]; // Yellow
var r = [255, 0, 0]; // Red
var b = [0, 0, 255]; // Blue

sense.setRotation(ROTATE);
sense.clear(0, 0, 0);
sense.lowLight = true;

// Christmas tree graphics
var tree = [
k, k, k, k, k, k, k, k,
k, k, k, g, k, k, k, k,
k, k, g, g, g, k, k, k,
k, k, k, g, k, k, k, k,
k, g, g, g, g, g, k, k,
k, k, k, g, k, k, k, k,
g, g, g, g, g, g, g, k,
k, k, k, g, k, k, k, k
];

var customTree = [];

// Candle positions
var candlepos = [
  [3, 0],
  [4, 1],
  [1, 3],
  [0, 5],
  [6, 5],
  [5, 3]
];

// Custom led shapes
var redLedAr = [];
var grnLedAr = [];
var bluLedAr = [];

// Candles setup
function candle(xpos, ypos, brightness, maxbrightness, minbrightness) {
    this.xpos = xpos;
    this.ypos = ypos;
    this.brightness = brightness;
    this.maxbrightness = maxbrightness;
    this.minbrightness = minbrightness;
    this.brightnessincrease = false;
    this.light = function () {
      sense.setPixel(this.xpos, this.ypos, y);
    };
    this.burn = function(color) {
      color = color || 'yellow';
      if (this.brightnessincrease) {
        this.brightness = this.brightness + BRIGHTNESSSTEP;
        if (this.brightness >= this.maxbrightness) {
          this.brightness = this.maxbrightness;
          this.brightnessincrease = false;
        }
      } else {
        this.brightness = this.brightness - BRIGHTNESSSTEP;
        if (this.brightness <= this.minbrightness) {
          this.brightness = this.minbrightness;
          this.brightnessincrease = true;
        }
      }
      var colorCombination = [0, 0, 0];
      if (color === 'red') {
        colorCombination = [this.brightness, 0, 0];
      } else if (color === 'blue') {
        colorCombination = [0, 0, this.brightness];
      } else {
        colorCombination = [this.brightness, this.brightness, 0];
      }
      sense.setPixel(this.xpos, this.ypos, colorCombination);
    };
    this.off = function () {
      sense.setPixel(this.xpos, this.ypos, k);
    };
}

var candles = [];
for (var i = 0; i < candlepos.length; i++) {
  candles.push(new candle(candlepos[i][0], candlepos[i][1], 100+Math.round(Math.random()*150), 255-Math.round(Math.random()*30), 50+Math.round(Math.random()*30)) );
}

// Display logic
var TREESHOWN = false;
var CANDLESSHOWN = false;
var CANDLESCOLOUR = 'yellow';
var REDRAW = true;
var CUSTOMSHAPE = false;

var draw = function() {
  if (TREESHOWN && REDRAW) {
    sense.setPixels(tree);
  }

  if (CUSTOMSHAPE && REDRAW) {
    console.log('yeah');
    for (var i = 0; i < tree.length; i++){
      customTree[i] = k;
      console.log('==');
      console.log(customTree[i]);
      if (redLedAr.indexOf(i) >= 0) { customTree[i][0] = 255; }
      if (grnLedAr.indexOf(i) >= 0) { customTree[i][1] = 255; }
      if (bluLedAr.indexOf(i) >= 0) { customTree[i][2] = 255; }
      console.log(customTree[i]);
      console.log('--');
    };
    sense.setPixels(customTree);
  }

  if (!TREESHOWN && !CUSTOMSHAPE) {
    CANDLESSHOWN = false;
    if (REDRAW) {
      sense.clear(0, 0, 0);
    }
  }

  if (CANDLESSHOWN) {
    for (let c of candles) {
      c.burn(CANDLESCOLOUR);
    }
  } else {
    if (REDRAW) {
      for (let c of candles) {
        c.off();
      }
    }
  }
  REDRAW = false;
}

// Display cycle
console.log('Starting Christmas Tree!');
var display = setInterval(draw, 50);

// Web interface
var app = express();

app.get('/tree', function (req, res) {
  TREESHOWN = true;
  CANDLESSHOWN = false;
  CUSTOMSHAPE = false;
  REDRAW = true;
  res.send('Endpoints: <b>/tree</b>, <span>/christmas</span>, <span>/santa</span>, <span>/awesome</span>, <span>/off</span>')
});

app.get('/christmas', function (req, res) {
  TREESHOWN = true;
  CANDLESSHOWN = true;
  CANDLESCOLOUR = 'yellow';
  CUSTOMSHAPE = false;
  REDRAW = true;
  res.send('Endpoints: <span>/tree</span>, <b>/christmas</b>, <span>/santa</span>, <span>/awesome</span>, <span>/off</span>')
});

app.get('/santa', function (req, res) {
  TREESHOWN = true;
  CANDLESSHOWN = true;
  CANDLESCOLOUR = 'red';
  CUSTOMSHAPE = false;
  REDRAW = true;
  res.send('Endpoints: <span>/tree</span>, <span>/christmas</span>, <b>/santa</b>, <span>/awesome</span>, <span>/off</span>')
});

app.get('/awesome', function (req, res) {
  TREESHOWN = true;
  CANDLESSHOWN = true;
  CANDLESCOLOUR = 'blue';
  CUSTOMSHAPE = false;
  REDRAW = true;
  res.send('Endpoints: <span>/tree</span>, <span>/christmas</span>, <span>/santa</span>, <b>/awesome</b>, <span>/off</span>')
});

app.get('/input', function (req, res) {
  // get the params from req.query
  var redLedStr = (req.query && req.query.red) ? req.query.red : '[]';
  var grnLedStr = (req.query && req.query.green) ? req.query.green : '[]';
  var bluLedStr = (req.query && req.query.blue) ? req.query.blue : '[]';

  redLedAr = [];
  grnLedAr = [];
  bluLedAr = [];

  try { redLedAr = JSON.parse(redLedStr) || []; } catch(e) { console.log(e); }
  try { grnLedAr = JSON.parse(grnLedStr) || []; } catch(e) { console.log(e); }
  try { bluLedAr = JSON.parse(bluLedStr) || []; } catch(e) { console.log(e); }

  TREESHOWN = false;
  CANDLESSHOWN = false;
  CANDLESCOLOUR = 'yellow';
  CUSTOMSHAPE = true;
  REDRAW = true;
  // res.send('OK');
  res.send('input:' + ' red: ' + redLedStr + ' green: ' + grnLedStr + ' blue: ' + bluLedStr);
});

// app.post('/input', function (req, res) {
//   // get the params from req.body
//   TREESHOWN = false;
//   CANDLESSHOWN = false;
//   CANDLESCOLOUR = 'yellow';
//   CUSTOMSHAPE = true;
//   REDRAW = true;
//   res.send('OK');
// });

app.get('/off', function (req, res) {
  TREESHOWN = false;
  CANDLESSHOWN = false;
  CUSTOMSHAPE = false;
  REDRAW = true;
  res.send('Endpoints: <span>/tree</span>, <span>/christmas</span>, <span>/santa</span>, <span>/awesome</span>, <b>/off</b>')
});

app.get('/', function (req, res) {
  res.send('Endpoints: <b>/tree</b>, <b>/christmas</b>, <b>/santa</b>, <b>/awesome</b>, <b>/off</b>')
});

app.listen(PORT, function () {
  console.log('Christmas tree app listening on port '+PORT)
});
