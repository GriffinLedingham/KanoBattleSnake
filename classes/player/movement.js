const PF = require('pathfinding')
const _ = require('lodash')

module.exports = {
  getDirectionToPointAStar: function(destPoint,legalDirs,pfGrid,canEatFood,head,tail) {
    var finder = new PF.AStarFinder()

    // Build up A* grid for use
    var grid = new PF.Grid(_.zip.apply(_, _.cloneDeep(pfGrid)))
    for(var i = 0;i<grid.nodes.length;i++) {
      for(var j = 0;j<grid.nodes[0].length;j++) {
        // This is a snek, set unwalkable
        if(pfGrid[j][i] == 2) {
          grid.setWalkableAt(j,i,false)
        }
        // This is food, maybe walkable
        else if(pfGrid[j][i] == 1) {
          if(canEatFood) {
            grid.setWalkableAt(j,i,true)
          } else {
            grid.setWalkableAt(j,i,false)
          }
        }
      }
    }

    // Set our destination as walkable, as wel as our tail
    grid.setWalkableAt(destPoint['x'],destPoint['y'],true)
    grid.setWalkableAt(tail['x'],tail['y'],true)

    // Find path to destPoint using A*
    var path = finder.findPath(head['x'], head['y'], destPoint['x'], destPoint['y'], grid)

    // If there is no path long enough, return all
    // legal directions
    if(path.length < 2) return legalDirs

    // Set destination point to next step in A* path
    destPoint = {x:path[1][0], y:path[1][1]}

    var foodDirs = []

    // Check food's position relative to snake head, and add valid directions to
    // array of possible outcomes

    // If the snake is in the same row or column as a food, calculate what direction
    // will move us towards it.
    if(destPoint['x'] == head['x'] && destPoint['y'] < head['y']) foodDirs.push('up')
    else if(destPoint['x'] == head['x'] && destPoint['y'] > head['y']) foodDirs.push('down')
    else if(destPoint['x'] > head['x'] && destPoint['y'] == head['y']) foodDirs.push('right')
    else if(destPoint['x'] < head['x'] && destPoint['y'] == head['y']) foodDirs.push('left')
    else {
      if(destPoint['x'] < head['x'] && legalDirs.indexOf('left') != -1) foodDirs.push('left')
      if(destPoint['x'] > head['x'] && legalDirs.indexOf('right') != -1) foodDirs.push('right')
      if(destPoint['y'] > head['y'] && legalDirs.indexOf('down') != -1) foodDirs.push('down')
      if(destPoint['y'] < head['y'] && legalDirs.indexOf('up') != -1) foodDirs.push('up')
    }

    // Array of all possible directions we are allowed to go
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

  /**
   * Check if a path to a given point exists
   * @param  {object}  destPoint  The point to find a path to
   * @param  {array}  pfGrid      The grid array
   * @param  {bool}  canEatFood   If the snake is allowed to eat food
   * @param  {object}  head       The coords of the start position
   * @param  {object}  tail       The snake's tail
   * @return {bool}               If a path exists to dest
   */
  hasPathToPoint(destPoint, pfGrid, canEatFood, head, tail) {
    var finder = new PF.AStarFinder()

    // Build up A* grid for use
    var grid = new PF.Grid(_.zip.apply(_, _.cloneDeep(pfGrid)))
    for(var i = 0;i<grid.nodes.length;i++) {
      for(var j = 0;j<grid.nodes[0].length;j++) {
        // This is a snek, set unwalkable
        if(pfGrid[j][i] == 2) {
          grid.setWalkableAt(j,i,false)
        }
        // This is food, maybe walkable
        else if(pfGrid[j][i] == 1) {
          if(canEatFood) {
            grid.setWalkableAt(j,i,true)
          } else {
            grid.setWalkableAt(j,i,false)
          }
        }
      }
    }

    // Set our destination as walkable, as wel as our tail
    grid.setWalkableAt(destPoint['x'],destPoint['y'],true)
    grid.setWalkableAt(tail['x'],tail['y'],true)

    // Find path to destPoint using A*
    var path = finder.findPath(head['x'], head['y'], destPoint['x'], destPoint['y'], grid)

    // Does a path exist?
    return (path.length > 0)
  }
}
