class Player {
  constructor(snake) {
    this.id             = snake.id
    this.hp             = snake.health_points
    this.name           = snake.name
    this.body           = snake.body.data
    this.array_pos      = snake.array_pos
    this.nextDir        = false
    this.lastDir        = false
    this.banDir         = false
  }

  updateSnake(snake) {
    this.nextDir    = false
    this.id         = snake.id
    this.hp         = snake.health_points
    this.name       = snake.name
    this.body       = snake.body.data
  }

  getArrPos() {
    return this.array_pos
  }

  getHead() {
    return this.body[0]
  }

  getAss() {
    return this.body[this.body.length - 1]
  }

  getLength() {
    return this.body.length
  }

  calcMove(map) {
    this.nextDir  = 'up'
    var result    = this.nextDir
    var foundCase = false

    if(!foundCase && this.checkWalls(map)) {
      result    = this.nextDir
      foundCase = true
    }

    this.lastDir = result
    this.setBanDir()

    return result
  }

  checkWalls(map) {
    var head = this.getHead()
    if(head['x'] == 0)  { return this.atLeftWall(head,map)    }
    if(head['x'] == (map.getWidth() - 1) ) { return this.atRightWall(head,map)   }
    if(head['y'] == 0)  { return this.atTopWall(head,map)     }
    if(head['y'] == (map.getHeight() - 1) ) { return this.atBottomWall(head,map)  }
    return false
  }

  atTopWall(head,map) {
    var head = this.getHead()
    if(head['x'] != (map.getWidth() - 1)) {
      this.nextDir = 'right'
      return true
    } else {
      this.nextDir = 'down'
      return true
    }
    return false
  }

  atBottomWall(head,map) {
    var head = this.getHead()
    if(head['x'] != 0) {
      this.nextDir = 'left'
      return true
    } else {
      this.nextDir = 'down'
      return true
    }
    return false
  }

  atRightWall(head,map) {
    var head = this.getHead()
    if(head['y'] != (map.getHeight() - 1)) {
      this.nextDir = 'down'
      return true
    } else {
      this.nextDir = 'left'
      return true
    }
    return false
  }

  atLeftWall(head,map) {
    var head = this.getHead()
    if(head['y'] != 0) {
      this.nextDir = 'up'
      return true
    } else {
      this.nextDir = 'right'
      return true
    }
    return false
  }

  setBanDir() {
    var lastDir = this.lastDir
    if(lastDir == 'up') {
      this.banDir = 'down'
    } else if(lastDir == 'left') {
      this.banDir = 'right'
    } else if(lastDir == 'down') {
      this.banDir = 'up'
    } else if(lastDir == 'right') {
      this.banDir = 'left'
    }
  }
}

module.exports = Player
