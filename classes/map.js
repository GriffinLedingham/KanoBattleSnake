/**
 * map.js
 *
 * This is the map instance, that will house any
 * functionality required from the map. This includes
 * various grid operations, pathfinder library assistance,
 * etc.
 *
 * When we get into map chunking, and further map analysis,
 * that should likely be broken out into a new classes/map
 * folder with specific logic fragmented in there.
 *
 */

const _ = require('lodash')
const PF = require('pathfinding')
const config = require('./config')
const chunkHelper = require('./player/chunk')
const mathCeil   = Math.ceil;


class Map {
  constructor(game) {
    if(game.hasOwnProperty('game_id'))
      this.id     = game.game_id
    else
      this.id     = game.id

    this.height = game.height
    this.width  = game.width
    this.grid   = []
    this.resetGrid = []
    this.chunkCenters = []

    // determine size of chunking based on size of map
    if (game.width < config.regGameDiameter) {
      this.numTilesPerChunksX = mathCeil(game.width / config.numMinChunksPerAxis)
      this.numChunksX = config.numMinChunksPerAxis
    }
    else {
      this.numTilesPerChunksX = mathCeil(game.width / config.numRegChunksPerAxis)
      this.numChunksX = config.numRegChunksPerAxis
    }
    
    if (game.height < config.regGameDiameter) {
      this.numTilesPerChunksY = mathCeil(game.height / config.numMinChunksPerAxis)
      this.numChunksY = config.numMinChunksPerAxis
    }
    else {
      this.numTilesPerChunksY = mathCeil(game.height / config.numRegChunksPerAxis)
      this.numChunksY = config.numRegChunksPerAxis
    }

    //build the grid
    this.buildGrid()
  }

  getWidth() {
    return this.width
  }

  getHeight() {
    return this.height
  }

  /**
   * Build an empty grid of 0's based on the game
   * size.
   */
  buildGrid() {
    this.resetGrid = []
    for(var i = 0;i<this.width;i++) {
      this.resetGrid[i] = []
      for(var j = 0;j<this.height;j++) {
        this.resetGrid[i].push(0)
      }
    }
    this.grid = _.cloneDeep(this.resetGrid)
  }

  /**
   * Update the map's data based on passed in request
   * data. This should only be called once per game tick.
   *
   * @param  {object} data The game state data coming in from tick request
   */
  updateData(data) {
    this.grid = _.cloneDeep(this.resetGrid)
    var ourSnakeId = data.you.id;

    // // Add all snakes to our map's grid
    for(var i = 0;i<data.snakes.data.length;i++) {
      var snake = data.snakes.data[i]
      var length = snake.body.data.length
      for(var j = 0;j<length;j++) {
        var coord = snake.body.data[j]
        var id = snake.id;

        // This is a snake.
        if (j == 0) {
          if (id == ourSnakeId) {
            this.grid[coord['x']][coord['y']] = config.ownHead
          }
          else {
            this.grid[coord['x']][coord['y']] = config.oppHead
          }
        }
        else if (j == length - 1) {
          if (id == ourSnakeId) {
            this.grid[coord['x']][coord['y']] = config.ownTail
          }        
          else {
            this.grid[coord['x']][coord['y']] = config.oppTail
          }
        }
        else
        {
          if (id == ourSnakeId) {
            this.grid[coord['x']][coord['y']] = config.ownSnakeBody
          }
          else {
            this.grid[coord['x']][coord['y']] = config.oppSnakeBody
          }
          
        }
      }
    }

    // Add all food to our map's grid
    for(var i = 0;i<data.food.data.length;i++) {
      var food = data.food.data[i]
      this.grid[food['x']][food['y']] = 1
    }

    // Copy the food array to the map instance
    this.food = data.food.data

    // Copy the snake array to the map
    this.snakes = data.snakes.data

    // Save a transposed copy of the grid
    this.transposedGrid = _.zip.apply(_, _.cloneDeep(this.grid))

    this.chunkData = chunkHelper.generateChunkData(this.transposedGrid, this.width, this.height, this.numTilesPerChunksX, this.numTilesPerChunksY)
    // console.log(this.chunkData)
    // console.log('********************************')
    // console.log('********************************')

    //Clear the display
    if(config.enableLogging) {
      process.stdout.write('\x1Bc')
    }

    //Transpose and display matrix
    // console.log(this.transposedGrid)
    // console.log('Update map.')
  }

  /**
   * Return the longest snake's length in the map
   * @return {int} Lenght of longest snake
   */
  getLongestSnake() {
    var longestLength = 0
    for(var i in this.snakes) {
      if(this.snakes[i].body.data.length > longestLength) {
        longestLength = this.snakes[i].body.data.length
      }
    }
    return longestLength
  }

  /**
   * Produces a PF.Grid to be used with pathfinding.js
   *
   * The grid will be based off the transpose matrix of
   * our grid. This is stored on the map instance, so we
   * do not need unecessary transpose operations at play
   * time.
   *
   * @param  {bool} canEatFood Is snake allowed to pass through food pieces
   * @return {PF.Grid}         The PF.Grid instance to be use in path finder
   */
  getPathfinderGrid(canEatFood, safestChunk) {
    // Init new PF grid from transposed matrix
    var grid = new PF.Grid(this.transposedGrid)
    // i is the grid's horizontal x-plane
    for(var i = 0;i<grid.nodes.length;i++) {
      // j is the grid's vertical y plane
      for(var j = 0;j<grid.nodes[0].length;j++) {

        // I have no fucking clue why this works.
        // This is such a hack...
        var gridTile
        if(this.height > this.width) {
          gridTile = this.transposedGrid[j][i]
        } else {
          gridTile = this.grid[i][j]
        }

        // This is a snek, set unwalkable
        if(gridTile >= config.ownSnakeBody) {
          grid.setWalkableAt(j,i,false)
        }
        // This is food, maybe walkable
        else if(gridTile == config.food) {
          if(canEatFood) {
            grid.setWalkableAt(i,j,true)
          } else {
            grid.setWalkableAt(i,j,false)
          }
        }
        else if (gridTile < config.ownSnakeBody) {
          if (safestChunk != -1) {
            grid.setWalkableAt(j,i,true)
          } else {
            grid.setWalkableAt(j,i,false)
          }
        }
      }
    }

    return grid
  }

  printPathfinderGrid(grid) {
    var printArr = []
    // Loop over x direction
    for(var i = 0;i<grid.nodes.length;i++) {
      // Push a new horizontal row
      printArr.push([])
      for(var j = 0;j<grid.nodes[i].length;j++) {
        if(grid.nodes[i][j].walkable) {
          printArr[i].push(0)
        } else {
          printArr[i].push(1)
        }
      }
    }
    console.log(printArr)
  }
}

module.exports = Map
