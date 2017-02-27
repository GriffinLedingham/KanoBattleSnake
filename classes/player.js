class Player {
  constructor(snake) {
    this.id             = snake.id
    this.hp             = snake.health_points
    this.name           = snake.name
    this.coords         = snake.coords
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
    this.coords     = snake.coords
  }

  getArrPos() {
    return this.array_pos
  }

  getHead() {
    return this.coords[0]
  }

  getAss() {
    return this.coords[this.coords.length - 1]
  }

  getLength() {
    return this.coords.length
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
    if(head[0] == 0)  { return this.atLeftWall(head)    }
    if(head[0] == 19) { return this.atRightWall(head)   }
    if(head[1] == 0)  { return this.atTopWall(head)     }
    if(head[1] == 19) { return this.atBottomWall(head)  }
    return false
  }

  atTopWall(head) {
    if(head[0] != 19) {
      this.nextDir = 'right'
      return true
    } else {
      this.nextDir = 'down'
      return true
    }
    return false
  }

  atBottomWall(head) {
    if(head[0] != 0) {
      this.nextDir = 'left'
      return true
    } else {
      this.nextDir = 'down'
      return true
    }
    return false
  }

  atRightWall(head) {
    if(head[1] != 19) {
      this.nextDir = 'down'
      return true
    } else {
      this.nextDir = 'left'
      return true
    }
    return false
  }

  atLeftWall(head) {
    if(head[1] != 0) {
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