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

    // Add all snakes to our map's grid
    for(var i = 0;i<data.snakes.data.length;i++) {
      var snake = data.snakes.data[i]
      for(var j = 0;j<snake.body.data.length;j++) {
        var coord = snake.body.data[j]

        // This is a snake.
        //
        // TODO: put this value into the grid one of following:
        //          0 - Walkable
        //          1 - Food
        //          2 - Snake
        //          3 - Own Head
        //          4 - Own Tail
        //          5 - Opp. Head
        //          6 - Opp. Tail
        //
        //          Body data is what's being iterated on
        //          First index of each body is a head
        //          Last index of each body is a tail

        this.grid[coord['x']][coord['y']] = 2
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
  getPathfinderGrid(canEatFood) {

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
        if(gridTile == 2) {
          grid.setWalkableAt(i,j,false)
        }
        // This is food, maybe walkable
        else if(gridTile == 1) {
          if(canEatFood) {
            grid.setWalkableAt(i,j,true)
          } else {
            grid.setWalkableAt(i,j,false)
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
