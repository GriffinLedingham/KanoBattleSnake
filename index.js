const http    = require('http')
const Player  = require('./classes/player')
const Map     = require('./classes/map')

var self = false
var map  = false

function start(game) {
  map = new Map(game)
  return {
    name: 'Kano',
    color: '#DFAB2B',
  }
}

function move(data) {
  // This is our init state, set up all snakes here
  if( self == false ) {
    for(var i = 0;i<data.snakes.data.length;i++) {
      // Check if your snake is this one in the list
      if(data.snakes.data[i].id == data.you.id) {
        data.snakes.data[i].array_pos = i
        self = new Player(data.you)
        break
      }
    }
  } else {
    // Snake is already initialized, let's update
    // its instance data to prep for next move calc
    for(var i = 0;i<data.snakes.data.length;i++) {
      if(data.snakes.data[i].id == data.you.id) {
        self.updateSnake(data.you)
        break
      }
    }
  }

  // Update all snake and food positions in the map
  // instance
  map.updateData(data)

  // Calculate the snake's next move. Hopefully this works.
  return {
    move: self.calcMove(map),
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
  let message = {};
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
}).listen(process.env.PORT || 5000, console.error)
