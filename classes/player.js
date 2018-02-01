const foodHelper  = require('./player/food')
const config      = require('./config')

class Player {
  constructor(snake) {
    this.id             = snake.id
    this.hp             = snake.health
    this.name           = snake.name
    this.body           = snake.body.data
    this.array_pos      = snake.array_pos
    this.lastDir        = false
    this.banDirs         = []
  }

  updateSnake(snake) {
    this.id         = snake.id
    this.hp         = snake.health
    this.name       = snake.name
    this.body       = snake.body.data
    this.banDirs     = []
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

  /**
   * Master function to run all snake calculations and
   * find the next direction to move.
   * @param  {object} map The map class instance of the current game
   * @return {string}     The direction our snake will move next
   */
  calcMove(map) {
    var result
    var retry = true
    var allowEarlyFood = false
    var retryCount = 0

    // If a direction was not found, try again.
    // We can use retryCount to be more lenient on retries.
    // ie.
    //      if retryCount == 1: allowEarlyFood = true
    //      if retryCount == 2: safeRadius = less than before
    //      etc...
    while(retry) {
      // This is our first iteration, we do not yet want to retry
      if(retryCount == 0) retry = false

      // If a move was not found, allow early food eating
      if(retry) {
        allowEarlyFood = true
        this.banDirs = []
      }

      // Check if snake is on any walls, ban any wall directions
      // this.checkWalls(map)

      // Check for collision points in all 3 valid directions
      this.checkImmediateCollision(map, allowEarlyFood)

      // Find which food on the board is closest.
      // TODO: This algorithm should later find the closest w/
      // a valid path to it, using A*.
      var closestFood = foodHelper.findClosestFood(map.food,this.getHead())

      // Get the opposite of banDirs to find all possible
      // move directions
      var legalDirs = this.getLegalDirs()

      var canEatFood = false
      if(this.shouldEatFood(map)) canEatFood = true
      if(allowEarlyFood) canEatFood = true
      if(!canEatFood && this.getPointDistance(this.getHead(),closestFood) < config.distanceToWaitFromFood) closestFood = this.getAss()
      var possibleDirs = foodHelper.getDirectionToFoodAStar(closestFood,legalDirs,map.grid,canEatFood,this.getHead(),this.getAss())

      // If no boolean valid directions are available, retry for
      // looser constraints, otherwise break the while loop
      if(possibleDirs.length == 0) retry = true
      else retry = false

      // Randomize the direction to take of all possible ones.
      // TODO: This will call our main logic/danger/weighting function,
      // with A* or whatever, to choose a best direction out of our possible
      // ones.
      result = possibleDirs[Math.floor(Math.random()*possibleDirs.length)]

      // Store this move to the class' last move instance var
      this.lastDir = result

      // We've made a retry iteration, increment it up
      retryCount++

      // If we've hit our retry limit, break. Maybe no direction will save
      // us. LUL
      if(retryCount > 20) break
    }

    // Return final result direction.
    return result
  }

  /**
   * Check if snake is at a wall, and ban that direciton if so.
   * @param  {object} map The map class instance of the current game
   */
  checkWalls(map) {
    var head = this.getHead()

    // If snake is at any walls, ban their direction
    if(head['x'] == 0)  { this.addBanDir('left') }
    if(head['x'] == (map.getWidth() - 1) ) { this.addBanDir('right') }
    if(head['y'] == 0)  { this.addBanDir('up') }
    if(head['y'] == (map.getHeight() - 1) ) { this.addBanDir('down') }
  }

  /**
   * Check if the snake has any immediate collision
   * targets in it's adjacent spaces, and bans those if
   * so.
   *
   * TODO: This should check further ahead in future
   * iterations, possibly by radius from head
   *
   * @param  {object} map               The map class instance for the current game
   * @param  {boolean} allowEarlyFood   If we should be lenient, and move somewhere
   *                                    that forces an early eat.
   */
  checkImmediateCollision(map,allowEarlyFood) {
    // Instantly ban the direction that we last came from, we
    // cannot ever go this way.
    if(this.lastDir == 'up') this.addBanDir('down', 'last move')
    if(this.lastDir == 'down') this.addBanDir('up','last move')
    if(this.lastDir == 'left') this.addBanDir('right','last move')
    if(this.lastDir == 'right') this.addBanDir('left','last move')

    var head = this.getHead()

    // Set valid spaces to be those that are 0's
    var safeSpace = [0]

    // If our health is getting low, or we want to force early eats,
    // allow the snake to step on 1 spaces.
    //
    // TODO:  This currently checks if health is low enough to eat.
    //        We should switch this in future so that it time its
    //        A* path to arrive at food as low as possible, not start
    //        allowing eats at X health. This strategy is less optimal.
    if(this.shouldEatFood(map) || allowEarlyFood) safeSpace.push(1)

    // Calculate all adjacent spaces to the snake
    var leftGridCoords = {x:Math.max(head['x']-1,0),y:head['y']}
    var leftGrid = map.grid[Math.max(head['x']-1,0)][head['y']]

    var rightGridCoords = {x:Math.min(head['x']+1,map.grid.length-1),y:head['y']}
    var rightGrid = map.grid[Math.min(head['x']+1,map.grid.length-1)][head['y']]

    var upGridCoords = {x:head['x'],y:Math.max(head['y']-1,0)}
    var upGrid = map.grid[head['x']][Math.max(head['y']-1,0)]

    var downGridCoords = {x:head['x'],y:Math.min(head['y']+1,map.grid[0].length-1)}
    var downGrid = map.grid[head['x']][Math.min(head['y']+1,map.grid[0].length-1)]

    // If any of the adjacent spaces aren't in the array of safe tiles,
    // ban them.
    //
    // TODO:  If the conflicting space is a snake, we should check if
    //        it's the snake's end piece. If so, we know that it won't
    //        be here next tick, so the space is actually safe (as along
    //        as they don't have a food within 1-tile's reach of their head)
    if(safeSpace.indexOf(leftGrid) == -1 && (this.getLength() < 4 || !this.spaceIsAss(leftGridCoords))) this.addBanDir('left','space is filled')
    if(safeSpace.indexOf(rightGrid) == -1 && (this.getLength() < 4 || !this.spaceIsAss(rightGridCoords))) this.addBanDir('right','space is filled')
    if(safeSpace.indexOf(upGrid) == -1 && (this.getLength() < 4 || !this.spaceIsAss(upGridCoords))) this.addBanDir('up','space is filled')
    if(safeSpace.indexOf(downGrid) == -1 && (this.getLength() < 4 || !this.spaceIsAss(downGridCoords))) this.addBanDir('down','space is filled')
  }

  /**
   * Get the opposite of ban directions.
   * @return {array} Array of legal directions
   */
  getLegalDirs() {
    var legalDirs = []

    // If direction doesn't appear in banned directions, is legal.
    if(this.banDirs.indexOf('left') == -1) legalDirs.push('left')
    if(this.banDirs.indexOf('right') == -1) legalDirs.push('right')
    if(this.banDirs.indexOf('up') == -1) legalDirs.push('up')
    if(this.banDirs.indexOf('down') == -1) legalDirs.push('down')

    return legalDirs
  }

  /**
   * Add a direction to the list of banned dirs
   * @param {string} dir    The direction to ban
   * @param {string} reason The reason for banning the direction, for debug
   */
  addBanDir(dir,reason) {
    // if(reason != undefined) console.log(`Banning ${dir} because ${reason}`)
    if(this.banDirs.indexOf(dir) == -1) this.banDirs.push(dir)
  }

  spaceIsAss(coords) {
    var ass = this.getAss()
    return (coords.x == ass.x && coords.y == ass.y)
  }

  getPointDistance(pA,pB) {
    return (Math.abs(pA.x-pB.x) + Math.abs(pA.y - pB.y))
  }

  shouldEatFood(map) {
    return ((this.hp < config.minHealthToFindFood) || (this.getLength() < map.getLongestSnake()))
  }
}

module.exports = Player
