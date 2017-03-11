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
var blinkLedAr = [];

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
var customCandles = [];
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
    let customColor = [0,0,0];
    for (let i = 0; i < tree.length; i++){
      customColor = [0,0,0];
      customTree[i] = [0,0,0];
      if (redLedAr.indexOf(i) >= 0) { customColor[0] = 255; }
      if (grnLedAr.indexOf(i) >= 0) { customColor[1] = 255; }
      if (bluLedAr.indexOf(i) >= 0) { customColor[2] = 255; }
      customTree[i] = customColor;
    };
    sense.setPixels(customTree);
  } // end of custom

  if (CUSTOMSHAPE) {
    if (CANDLESSHOWN) {
      for (let c of customCandles) {
        c.burn('yellow');
      }
    } else {
      if (REDRAW) {
        for (let c of customCandles) {
          c.off();
        }
      }
    }
  }

  if (!TREESHOWN && !CUSTOMSHAPE) {
    CANDLESSHOWN = false;
    if (REDRAW) {
      sense.clear(0, 0, 0);
    }
  }

  if (CANDLESSHOWN && !CUSTOMSHAPE) {
    for (let c of candles) {
      c.burn(CANDLESCOLOUR);
    }
  } else {
    if (REDRAW && !CUSTOMSHAPE) {
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
  res.send(respMessage('tree'));
});

app.get('/christmas', function (req, res) {
  TREESHOWN = true;
  CANDLESSHOWN = true;
  CANDLESCOLOUR = 'yellow';
  CUSTOMSHAPE = false;
  REDRAW = true;
  res.send(respMessage('christmas'));
});

app.get('/santa', function (req, res) {
  TREESHOWN = true;
  CANDLESSHOWN = true;
  CANDLESCOLOUR = 'red';
  CUSTOMSHAPE = false;
  REDRAW = true;
  res.send(respMessage('santa'));
});

app.get('/awesome', function (req, res) {
  TREESHOWN = true;
  CANDLESSHOWN = true;
  CANDLESCOLOUR = 'blue';
  CUSTOMSHAPE = false;
  REDRAW = true;
  res.send(respMessage('awesome'));
});

app.get('/input', function (req, res) {
  // get the params from req.query
  let redLedStr = (req.query && req.query.red) ? req.query.red : '[]';
  let grnLedStr = (req.query && req.query.green) ? req.query.green : '[]';
  let bluLedStr = (req.query && req.query.blue) ? req.query.blue : '[]';
  let blinkLedStr = (req.query && req.query.blink) ? req.query.blink : '[]';

  redLedAr = [];
  grnLedAr = [];
  bluLedAr = [];
  blinkLedAr = [];

  try { redLedAr = JSON.parse(redLedStr) || []; } catch(e) { console.log(e); }
  try { grnLedAr = JSON.parse(grnLedStr) || []; } catch(e) { console.log(e); }
  try { bluLedAr = JSON.parse(bluLedStr) || []; } catch(e) { console.log(e); }
  try { blinkLedAr = JSON.parse(blinkLedStr) || []; } catch(e) { console.log(e); }

  if (blinkLedAr.length) {
    customCandles = [];
    for (let blinkLedPos of blinkLedAr) {
      let col = parseInt(blinkLedPos / 8);
      let row = blinkLedPos % 8;

      let brightness = 100+Math.round(Math.random()*150);
      let maxbrightness = 255-Math.round(Math.random()*30);
      let minbrightness = 50+Math.round(Math.random()*30);

      console.log('new candle: ', row, col, brightness, maxbrightness, minbrightness);

      customCandles.push(new candle(row, col, brightness, maxbrightness, minbrightness));
    }
  }

  TREESHOWN = false;
  CANDLESSHOWN = !!blinkLedAr.length;
  CANDLESCOLOUR = 'yellow';
  CUSTOMSHAPE = true;
  REDRAW = true;
  let msg = respMessage('input');
  msg += '<br>';
  msg += 'You gave: ' + 'input:' + ' red: ' + redLedStr + ' green: ' + grnLedStr + ' blue: ' + bluLedStr;
  res.send();
});

app.get('/off', function (req, res) {
  TREESHOWN = false;
  CANDLESSHOWN = false;
  CUSTOMSHAPE = false;
  REDRAW = true;
  res.send(respMessage('off'));
});

app.get('/', function (req, res) {
  res.send(respMessage());
});

app.listen(PORT, function () {
  console.log('Christmas tree app listening on port ' + PORT);
});

function respMessage (selected) {
  var endpoints = ['tree', 'christmas', 'santa', 'awesome', 'input', 'off'];
  var message = 'Endpoints: ';
  endpoints.forEach(function (endpoint) {
    let path = '/' + endpoint;
    if (endpoint === 'input') {
      path = '/input?green=[2,3,9,10,11,12,17,19,20,25,26,27,33,34,35,42,43,44,45,46,50,51,52]&red=[16,23,28,29,30,31,36,37,38,39,58,60]&blue=[18,23,28,29,30,31,36,37,38,39]&blink=[62,63]'
    }
    if (!selected || endpoint !== selected) {
      message += '<a href="' + path + '">/' + endpoint + '</a>';
    } else {
      message += '<b>' + path + '</b>';
    }
    message += ', ';
  });
  message = message.replace(/\,\s*$/, '');
  return message;
}
