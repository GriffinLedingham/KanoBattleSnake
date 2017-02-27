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
    for(var i = 0;i<data.snakes.length;i++) {
      var snake = data.snakes[i]
      for(var j = 0;j<snake.coords.length;j++) {
        var coord = snake.coords[j]

        //This is a snake
        this.grid[coord[0]][coord[1]] = 2
      }
    }

    //Transpose and display matrix
    console.log(_.zip.apply(_, _.cloneDeep(this.grid)))
    console.log('Update map.')
  }
}

module.exports = Map