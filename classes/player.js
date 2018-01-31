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
      this.checkWalls(map)

      // Check for collision points in all 3 valid directions
      this.checkImmediateCollision(map, allowEarlyFood)

      // Find which food on the board is closest.
      // TODO: This algorithm should later find the closest w/
      // a valid path to it, using A*.
      var closestFood = this.findClosestFood(map)

      // Get the opposite of banDirs to find all possible
      // move directions
      var legalDirs = this.getLegalDirs()

      // Get all next directions we could take, simply via boolean
      // logic
      var possibleDirs = this.getDirectionToFood(closestFood,legalDirs)

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
   * Naive find-closest-food. This does not care about
   * having a valid path to the food, or snakes in the
   * area. Simply mathematically closest fruit.
   * @param  {object} map The map class instance of the current game
   * @return {object}     Coords for the nearest food
   */
  findClosestFood(map) {
    var foods = map.food
    var head = this.getHead()

    // Initial arbitrary value of the closest food, there
    // will always be one closer than 1000..
    var minDist = 1000
    var closestCoords = {x:-1,y:-1}

    for(var i = 0;i<foods.length;i++) {
      // Sum the vertical and horizontal distance of the food to
      // get our total "close-ness"
      var thisDist = Math.abs(head['x'] - foods[i]['x']) + Math.abs(head['y'] - foods[i]['y'])

      // If this food is closer, store it as new closest
      if(thisDist < minDist) {
        closestCoords = {x:foods[i]['x'], y: foods[i]['y']}
        minDist = thisDist
      }
    }

    // Return closest food
    return closestCoords
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
    if(this.hp < 20 || allowEarlyFood) safeSpace.push(1)

    // Calculate all adjacent spaces to the snake
    var leftGrid = map.grid[Math.max(head['x']-1,0)][head['y']]
    var rightGrid = map.grid[Math.min(head['x']+1,map.grid.length-1)][head['y']]
    var upGrid = map.grid[head['x']][Math.max(head['y']-1,0)]
    var downGrid = map.grid[head['x']][Math.min(head['y']+1,map.grid[0].length-1)]

    // If any of the adjacent spaces aren't in the array of safe tiles,
    // ban them.
    //
    // TODO:  If the conflicting space is a snake, we should check if
    //        it's the snake's end piece. If so, we know that it won't
    //        be here next tick, so the space is actually safe (as along
    //        as they don't have a food within 1-tile's reach of their head)
    if(safeSpace.indexOf(leftGrid) == -1) this.addBanDir('left','space is filled')
    if(safeSpace.indexOf(rightGrid) == -1) this.addBanDir('right','space is filled')
    if(safeSpace.indexOf(upGrid) == -1) this.addBanDir('up','space is filled')
    if(safeSpace.indexOf(downGrid) == -1) this.addBanDir('down','space is filled')
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
   * Very naive algorithm to get the next move towards food. This
   * should in future implement A* to get the next step along a
   * found path to the relevant food.
   *
   * TODO: Convert this to A*
   *
   * @param  {object} closestFood The closest food item coordinates
   * @param  {array} legalDirs    Array of all legal directions at this point
   * @return {array}              Array of all legal direcitons towards food
   *                              or a random move if no food possible.
   */
  getDirectionToFood(closestFood,legalDirs) {
    var foodDirs = []
    var head = this.getHead()

    // Check food's position relative to snake head, and add valid directions to
    // array of possible outcomes
    if(closestFood['x'] < head['x'] && legalDirs.indexOf('left') != -1) foodDirs.push('left')
    if(closestFood['x'] > head['x'] && legalDirs.indexOf('right') != -1) foodDirs.push('right')
    if(closestFood['y'] > head['y'] && legalDirs.indexOf('down') != -1) foodDirs.push('down')
    if(closestFood['y'] < head['y'] && legalDirs.indexOf('up') != -1) foodDirs.push('up')

    // If the snake is in the same row or column as a food, calculate what direction
    // will move us towards it.
    if(closestFood['x'] == head['x'] && closestFood['y'] < head['y']) foodDirs.push('up')
    if(closestFood['x'] == head['x'] && closestFood['y'] > head['y']) foodDirs.push('down')
    if(closestFood['x'] > head['x'] && closestFood['y'] == head['y']) foodDirs.push('right')
    if(closestFood['x'] < head['x'] && closestFood['y'] == head['y']) foodDirs.push('left')

    var resultDirs = []

    // Only pick food directions that overlap with directions that are not yet
    // banned in our flow
    for(var i in foodDirs) {
      if(legalDirs.indexOf(foodDirs[i]) != -1) resultDirs.push(foodDirs[i])
    }

    // If no directions will point us to our nearest food, just return array
    // of possible directions, ignoring food
    if(resultDirs.length == 0) resultDirs = legalDirs

    // Return all positions we have decided we can go
    return resultDirs
  }

  /**
   * Add a direction to the list of banned dirs
   * @param {string} dir    The direction to ban
   * @param {string} reason The reason for banning the direction, for debug
   */
  addBanDir(dir,reason) {
    if(reason != undefined) console.log(`Banning ${dir} because ${reason}`)
    if(this.banDirs.indexOf(dir) == -1) this.banDirs.push(dir)
  }
}

module.exports = Player
