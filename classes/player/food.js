/**
 * food.js
 *
 * This file's main purpose is to handle food operations.
 * Finding nearest food to player, calculating food density
 * in map areas, etc..
 *
 */

const _           = require('lodash')
const moveHelper  = require('../movement')

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
   * A* find-closest-food.
   * @param  {object} map The map class instance of the current game
   * @return {object}     Coords for the nearest food
   */
  findClosestFoodAStar: function(foods,head,tail,map,canEatFood) {
    // Initial arbitrary value of the closest food, there
    // will always be one closer than 1000..
    var minDist = 1000
    var closestCoords = false

    for(var i = 0;i<foods.length;i++) {
      var food = foods[i]

      if(
        !moveHelper.hasPathToPoint({x:map.width-1,y:map.height-1},map,canEatFood,food,tail)
        && !moveHelper.hasPathToPoint({x:map.width-1,y:0},map,canEatFood,food,tail)
        && !moveHelper.hasPathToPoint({x:0,y:map.height-1},map,canEatFood,food,tail)
        && !moveHelper.hasPathToPoint({x:0,y:0},map,canEatFood,food,tail)
      ) {
        continue
      }

      var thisDist = moveHelper.getPathLengthToPoint(food,map,canEatFood,head,tail)

      // Path doesn't exist, break out
      if(thisDist == 0) continue

      // TODO: See if this food has path to corners, if not
      // also break out.

      // If this food is closer, store it as new closest
      if(thisDist < minDist) {
        closestCoords = {x:food['x'], y: food['y']}
        minDist = thisDist
      }
    }

    // Return closest food
    return {coords:closestCoords,dist:minDist}
  },


  /**
  * -----------------------
  * DEPRECATED
  * -----------------------
  *
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
  }
}
