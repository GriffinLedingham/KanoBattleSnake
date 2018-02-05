/**
 * player.js
 *
 * This is the main player file our snake will
 * be using to operate. This may get large, so code
 * should be fragmented into logical groups as best
 * possible to maintain a manageable file.
 *
 *
 */

const foodHelper   = require('./player/food')
const moveHelper   = require('./movement')
const chunkHelper  = require('./player/chunk')
const config       = require('./config')

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

  getHealth() {
    return this.hp
  }

  /**
   * Master function to run all snake calculations and
   * find the next direction to move.
   * @param  {object} map The map class instance of the current game
   * @return {string}     The direction our snake will move next
   */
  calcMove(map) {
    var result = false
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

      // Check for collision points in all 3 valid directions
      this.checkImmediateCollision(map, allowEarlyFood)

      // Get the opposite of banDirs to find all possible
      // move directions
      var legalDirs = this.getLegalDirs()

      var closestFood = false
      var destPoint

      // Use A* to find closest food, by path distance
      closestFood = foodHelper.findClosestFoodAStar(map.food,this.getHead(),this.getAss(),map,canEatFood)

      destPoint = closestFood.coords

      // If a path to a nearest food exists, let's try and
      // make our way over to it.
      //
      // If it does not exist, skip this logic block, and
      // attempt to find a move to elsewhere on the grid
      // that doesn't trap us.
      if(destPoint != false) {
        var canEatFood = false
        var possibleDirs

        // Should our snake eat food by our rule set
        if(this.shouldEatFood(map,closestFood)) canEatFood = true

        // Was our last pathfind attempt unsuccesful? Try
        // again with less-strict requirements (early food)
        if(allowEarlyFood) canEatFood = true

        // counts all data in each chunk, and returns the data with which chunk is the safest
        // determins what the safest chunk is on the map at that moment
        var chunkCountData = chunkHelper.findSafestChunk(map.chunkData)
        var currChunk = chunkCountData[0]
        var safeChunkId = chunkCountData[1]

        var isNearCenterOfChunk = chunkHelper.isHeadNearCenterOfChunk(map.chunkData, safeChunkId, this.getHead())

        var logging = ''
        if(canEatFood) {
          // Use A* to path find to given point
          logging = 'Low health, heading for food.'
        }
        if(!canEatFood  && isNearCenterOfChunk && closestFood.dist < config.distanceToWaitFromFood) {
          destPoint = this.getAss()
          logging = 'Idle in safe chunk, aiming for tail.'
        }
        else if (!canEatFood && !isNearCenterOfChunk) {
          // If this point is a food tile, we'll eat early because 1 is
          // being set as safe in checkImmediateCollision.
          //
          // We should keep it being set in there, and manage food illegality
          // via the pathfinding grid.
          destPoint = chunkHelper.findSafestPointInChunk(map.chunkData, safeChunkId, map.numChunksX, map.numChunksY)
          logging = 'Heading for safe chunk.'
        }

        if(config.enableLogging) {
          console.log(logging)
        }

        possibleDirs = moveHelper.getDirectionToPointAStar(destPoint,legalDirs,map,canEatFood,this.getHead(),this.getAss())

        // If no boolean valid directions are available, retry for
        // looser constraints, otherwise break the while loop
        if(possibleDirs.length == 0) retry = true
        else retry = false
      }

      // Randomize the direction to take of all possible ones.
      // TODO: This will call our main logic/danger/weighting function,
      // with A* or whatever, to choose a best direction out of our possible
      // ones.
      var head = this.getHead()

      for(var i in possibleDirs) {
        var newHead
        // Get coords for where the head will be if moving
        // this direction
        switch(possibleDirs[i]) {
          case 'up':
            newHead = this.getUpCoords(head,map)
            break;
          case 'down':
            newHead = this.getDownCoords(head,map)
            break;
          case 'left':
            newHead = this.getLeftCoords(head,map)
            break;
          case 'right':
            newHead = this.getRightCoords(head,map)
            break;
        }
        // If this direction has a path to the map's corner
        // accept it, and move that way
        //
        // TODO: This is where we'll check path weights etc.
        // in the future
        if(
          moveHelper.hasPathToPoint({x:map.width-1,y:map.height-1},map,canEatFood,newHead,this.getAss())
          || moveHelper.hasPathToPoint({x:map.width-1,y:0},map,canEatFood,newHead,this.getAss())
          || moveHelper.hasPathToPoint({x:0,y:map.height-1},map,canEatFood,newHead,this.getAss())
          || moveHelper.hasPathToPoint({x:0,y:0},map,canEatFood,newHead,this.getAss())
        ) {
          result = possibleDirs[i]
          break
        }
      }

      // Worst case, couldn't find any directions with path to
      // map's corner or food, or tail.
      //
      // Pick a random one ¯\_(ツ)_/¯
      if(result == false && retry) {
        result = legalDirs[Math.floor(Math.random()*legalDirs.length)]
      } else if(result == false) {
        retry = true
      }

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
    //
    // TODO: This no longer works, because we aren't keeping
    // snake's state from game to game. Do we need this? Snake
    // looks to kill itself moving upwards on this replay:
    //
    // https://play.snakedown.com/app/replay/c1d5785d-7893-4fca-b311-5144a2bf6b2b
    //
    // I would think A*/checking for snakes on grid would not allow
    // this, but may be missing an edge case.
    //
    // if(this.lastDir == 'up') this.addBanDir('down', 'last move')
    // if(this.lastDir == 'down') this.addBanDir('up','last move')
    // if(this.lastDir == 'left') this.addBanDir('right','last move')
    // if(this.lastDir == 'right') this.addBanDir('left','last move')

    var head = this.getHead()

    // Set valid spaces to be those that are 0's
    var safeSpace = [0,1]

    // Calculate all adjacent spaces to the snake, and their coords
    var leftGridCoords = this.getLeftCoords(head,map)
    var leftGrid = map.grid[leftGridCoords['x']][leftGridCoords['y']]

    var rightGridCoords = this.getRightCoords(head,map)
    var rightGrid = map.grid[rightGridCoords['x']][rightGridCoords['y']]

    var upGridCoords = this.getUpCoords(head,map)
    var upGrid = map.grid[upGridCoords['x']][upGridCoords['y']]

    var downGridCoords = this.getDownCoords(head,map)
    var downGrid = map.grid[downGridCoords['x']][downGridCoords['y']]

    // If any of the adjacent spaces aren't in the array of safe tiles,
    // ban them.
    //
    // TODO:  If the conflicting space is a snake, we should check if
    //        it's the snake's end piece. If so, we know that it won't
    //        be here next tick, so the space is actually safe (as along
    //        as they don't have a food within 1-tile's reach of their head)
    if(safeSpace.indexOf(leftGrid) == -1 && (!this.spaceIsAss(leftGridCoords) || !this.canTouchTail())) this.addBanDir('left','space is filled')
    if(safeSpace.indexOf(rightGrid) == -1 && (!this.spaceIsAss(rightGridCoords) || !this.canTouchTail())) this.addBanDir('right','space is filled')
    if(safeSpace.indexOf(upGrid) == -1 && (!this.spaceIsAss(upGridCoords) || !this.canTouchTail())) this.addBanDir('up','space is filled')
    if(safeSpace.indexOf(downGrid) == -1 && (!this.spaceIsAss(downGridCoords) || !this.canTouchTail())) this.addBanDir('down','space is filled')
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
    if(config.enableLogging) {
      if(reason != undefined) console.log(`Banning ${dir} because ${reason}`)
    }
    if(this.banDirs.indexOf(dir) == -1) this.banDirs.push(dir)
  }

  /**
   * Check if the given space is our snake's tail
   * @param  {object} coords Coords of the position to check
   * @return {boolean}       If the coords are the snake's tail
   */
  spaceIsAss(coords) {
    var ass = this.getAss()
    return (coords.x == ass.x && coords.y == ass.y)
  }

  // Check if snake can touch tail yet (need to buffer
  // by a couple after eating food)
  canTouchTail() {
    var result = false
    if(this.length > 3 && this.getHealth()<100) {
      result = true
    }
    return result
  }

  /**
   * Get distance to a point
   * @param  {object} pA Point A
   * @param  {object} pB Point B
   * @return {int}    Distance between points
   */
  getPointDistance(pA,pB) {
    return (Math.abs(pA.x-pB.x) + Math.abs(pA.y - pB.y))
  }

  /**
   * Check if the snake should eat food. This
   * will likely get larger as we add more constraints
   * @param  {Map} map Current game's map instance
   * @return {boolean}     If the snake should eat food
   */
  shouldEatFood(map, closestFood) {
    var distToClosestFood = closestFood.dist

    var conditional

    // Closest food will only exist when using A* food
    // finding. Otherwise default to naive method
    if(closestFood != false) {
      // Use A* distance to food to check when we need to
      // go fetch food.
      conditional = (
        (this.hp < (distToClosestFood + this.getLength() + config.foodSearchPaddingHP))
        || (config.matchLongestSnake && (this.getLength() < map.getLongestSnake()))
      )
    } else {
      // Use naive "find food below health" calculation
      conditional = (
        (this.hp < config.minHealthToFindFood)
        || (config.matchLongestSnake && (this.getLength() < map.getLongestSnake()))
      )
    }
    return conditional
  }

  // Get coords of the space left of head
  getLeftCoords(head,map) {
    return {x:Math.max(head['x']-1,0),y:head['y']}
  }

  // Get coords of the space right of head
  getRightCoords(head,map) {
    return {x:Math.min(head['x']+1,map.grid.length-1),y:head['y']}
  }

  // Get coords of the space up of head
  getUpCoords(head,map) {
    return {x:head['x'],y:Math.max(head['y']-1,0)}
  }

  // Get coords of the space down of head
  getDownCoords(head,map) {
    return {x:head['x'],y:Math.min(head['y']+1,map.grid[0].length-1)}
  }
}

module.exports = Player
