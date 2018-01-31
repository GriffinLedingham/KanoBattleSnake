const _ = require('lodash')

class Map {
  constructor(game) {
    this.id     = game.game_id
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

  buildGrid() {
    this.resetGrid = []
    for(var i = 0;i<this.width;i++) {
      this.resetGrid[i] = []
      for(var j = 0;j<this.height;j++) {
        if(i == 0 || j ==0 || (i == this.width-1) || (j == this.height-1))
          this.resetGrid[i].push(0)
        else
          this.resetGrid[i].push(0)
      }
    }
    console.log(this.resetGrid)
    this.grid = _.cloneDeep(this.resetGrid)
  }

  updateData(data) {
    this.grid = _.cloneDeep(this.resetGrid)

    // Add all snakes to our map's grid
    for(var i = 0;i<data.snakes.data.length;i++) {
      var snake = data.snakes.data[i]
      for(var j = 0;j<snake.body.data.length;j++) {
        var coord = snake.body.data[j]

        //This is a snake
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

    //Clear the display
    process.stdout.write('\x1Bc')

    //Transpose and display matrix
    console.log(_.zip.apply(_, _.cloneDeep(this.grid)))
    console.log('Update map.')
  }
}

module.exports = Map
