const http    = require('http')
const Player  = require('./classes/player')
const Map     = require('./classes/map')


var self = false
var map  = false

function start(game) {
  map = new Map(game)
  return {
    name: 'Sneks',
    color: '#bb2232',
  }
}

function move(data) {
  if( self == false ) {
    for(var i = 0;i<data.snakes.length;i++) {
      if(data.snakes[i].id == data.you) {
        data.snakes[i].array_pos = i
        self = new Player(data.snakes[i])
        console.log('Init Snake')
        break
      }
    }
  } else {
    for(var i = 0;i<data.snakes.length;i++) {
      if(data.snakes[i].id == data.you) {
        self.updateSnake(data.snakes[i])
        console.log('Update Snake')
        break
      }
    }
  }
  return {
    move: self.calcMove(this.map),
    taunt: "Boop the snoot!",
  }
}

/**
 * HTTP Server
 * Boilerplate server to receive and respond to POST requests
 * other requests will be returned immediately with no data
 */
http.createServer((req, res) => {
  if (req.method !== 'POST') return respond(); // non-game requests

  let body = [];
  req.on('data', chunk => body.push(chunk));
  req.on('end', () => {
    body = JSON.parse(Buffer.concat(body).toString());
    if (req.url === '/start') message = start(body);
    if (req.url === '/move') message = move(body);
    return respond(message);
  });

  function respond(message) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(message));
  }
}).listen(process.env.PORT || 80, console.error)
