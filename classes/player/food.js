const PF = require('pathfinding')

module.exports = {

  /**
   * Naive find-closest-food. This does not care about
   * having a valid path to the food, or snakes in the
   * area. Simply mathematically closest fruit.
   * @param  {object} map The map class instance of the current game
   * @return {object}     Coords for the nearest food
   */
  findClosestFood: function(foods,head) {
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
  },

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
  getDirectionToFood: function(closestFood,legalDirs,head) {
    var foodDirs = []

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
  },

  getDirectionToFoodAStar: function(closestFood,legalDirs,pfGrid,canEatFood,head,tail) {
    var finder = new PF.AStarFinder()
    var grid = new PF.Grid(pfGrid)

    for(var i =0;i<pfGrid.length;i++) {
      for(var j =0;j<pfGrid.length[0];j++) {
        // This is a snek, set unwalkable
        if(pfGrid[i][j] == 2) {
          grid.setWalkableAt(i,j,false)
        }
        // This is food, maybe walkable
        else if(pfGrid[i][j] == 1) {
          if(canEatFood) {
            grid.setWalkableAt(i,j,true)
          } else {
            grid.setWalkableAt(i,j,false)
          }
        }
      }
    }

    grid.setWalkableAt(closestFood['x'],closestFood['y'],true)
    grid.setWalkableAt(tail['x'],tail['y'],true)

    var path = finder.findPath(head['x'], head['y'], closestFood['x'], closestFood['y'], grid)

    if(path.length == 0) return legalDirs

    closestFood = {x:path[1][0], y:path[1][1]}

    var foodDirs = []

    // Check food's position relative to snake head, and add valid directions to
    // array of possible outcomes

    // If the snake is in the same row or column as a food, calculate what direction
    // will move us towards it.
    if(closestFood['x'] == head['x'] && closestFood['y'] < head['y']) foodDirs.push('up')
    else if(closestFood['x'] == head['x'] && closestFood['y'] > head['y']) foodDirs.push('down')
    else if(closestFood['x'] > head['x'] && closestFood['y'] == head['y']) foodDirs.push('right')
    else if(closestFood['x'] < head['x'] && closestFood['y'] == head['y']) foodDirs.push('left')
    else {
      if(closestFood['x'] < head['x'] && legalDirs.indexOf('left') != -1) foodDirs.push('left')
      if(closestFood['x'] > head['x'] && legalDirs.indexOf('right') != -1) foodDirs.push('right')
      if(closestFood['y'] > head['y'] && legalDirs.indexOf('down') != -1) foodDirs.push('down')
      if(closestFood['y'] < head['y'] && legalDirs.indexOf('up') != -1) foodDirs.push('up')
    }

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
}
