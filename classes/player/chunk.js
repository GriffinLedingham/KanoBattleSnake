const PF      = require('pathfinding')
const config  = require('../config')
const _       = require('lodash')
const ceil   = Math.ceil
const floor   = Math.ceil
const rand   = Math.random



module.exports = {

    /**
     * Determine which division of the map contains the least amount of snakes.
     * Once found path find to that spot if food is over the find food threshold
     * @param  {object} map.grid the grid of the current turn of the game
     * @param  {int}    width    width of the grid
     * @param  {int}    height   height of the grid
     * @param  {int}    tilesX   number of tiles per chunk on x axis
     * @param  {int}    tilesY   number of tiles per chunk on y axis
     * @return {object}     coord for the nearest space available in the least populated division
     */
    generateChunkData: function(transposedGrid, width, height, tilesX, tilesY) {
      var chunks = [];

      //chunk each row
      var rowChunks= _.chunk(transposedGrid[0], tilesX)
      var length = rowChunks.length

      for (var i = 0; i < length; i++)
      {
        rowChunks[i] = [rowChunks[i]];
      }

      var currY = 1;
      while (currY < height) {
        var currRowChunked = _.chunk(transposedGrid[currY++], tilesX)

        for (var i = 0; i < length; i++) {
          rowChunks[i].push(currRowChunked[i])
        }

        if ((currY % tilesY) == 0 || currY == height) {
          for (var i = 0; i < length; i++)
          {
            chunks.push(_.cloneDeep(rowChunks[i]))
            rowChunks[i] = [];
          }
        }
      }

      return chunks
    },


     /**
     * Determine which chunk of the map contains the safest location
     * @param  {object} chunkData contains each chunks data of each snake, and food
     * @return {object}     chunk data counts, and suggest safest tile on the map
     */
    findSafestChunk: function(chunkData) {

        var length = chunkData.length
        var chunkCounts = [0,0]
        var currChunk;
        for (var i = 0; i < length; i++)
        {
          var currChunkData = _.flatten(chunkData[i])
          var chunkLength = currChunkData.length

          var count = [0,0,0,0,0,0,0]
          for (var j = 0; j < chunkLength; j++)
          {
            switch(currChunkData[j]) {
              case config.walkable:
                count[config.walkable] += 1
                break
              case config.food:
                count[config.food] += 1
                break;
              case config.ownSnakeBody:
                count[config.ownSnakeBody] += 1
                break;
              case config.oppsnakeBody:
                count[config.oppSnakeBody] += 1
                break;
              case config.ownHead:
                count[config.ownHead] += 1
                chunkCounts[0] = _.cloneDeep(i)
                break;
              case config.ownTail:
                count[config.ownTail] += 1
                break;
              case config.oppHead:
                count[config.oppHead] += 1
                break;
              case config.oppTail:
                count[config.oppTail] += 1
                break;
            }
          }
          chunkCounts.push(_.cloneDeep(count))
        }

        var currFoodCount = 0;
        var prevFoodCount = 0;
        var currSafeCount = 0;
        var prevSafeCount = 0;
        for (var i = 0; i < length; i++)
        {
          var index = i+2;
          currFoodCount = chunkCounts[index][config.food]
          currSafeCount = chunkCounts[index][config.walkable] +
                          chunkCounts[index][config.food] +
                          chunkCounts[index][config.ownHead] +
                          chunkCounts[index][config.ownTail] +
                          chunkCounts[index][config.ownSnakeBody];

          if (i > 0 && (currSafeCount > prevSafeCount || (currSafeCount == prevSafeCount && currFoodCount > prevFoodCount))) {

               chunkCounts[1] = i
          }

          prevSafeCount = currSafeCount
          prevFoodCount = currFoodCount
        }

        return chunkCounts
      },

      /**
     * Determine which chunk of the map contains the safest location
     * @param  {object} chunkData contains each chunks data of each snake, and food
     * @return {object}     chunk data counts, and suggest safest tile on the map
     */
    isPosInChunk: function(x, y, tilesX, tilesY, chunksX, chunksY, chunkIndex) {
      var tileChunkY = floor(y / tilesY) - 1
      var tileChunkX = floor(x / tilesX) - 1
      var currChunkIndex = (tileChunkY * chunksX) + tilesX

      return (currChunkIndex == chunkIndex)
    },

    /** Determine which chunk of the map contains the safest location
      * @param  {object} chunkData contains each chunks data of each snake, and food
      * @return {object}     chunk data counts, and suggest safest tile on the map
      */
    findSafestPointInChunk: function(chunkData, index, chunksX, chunksY) {


      var safeChunk = chunkData[index]

      var xLength = chunkData[0].length
      var yLength = safeChunk.length
      var x = floor(xLength / 2);
      var y = floor(yLength / 2);

      var point = [-1, -1]
      var currPointData
      while (true) {
        currPointData = safeChunk[x][y]
        if (currPointData < config.oppSnakeBody)
        {
          var safeSidePoints = 0
          if (safeChunk[x-1][y] < config.oppSnakeBody &&
              safeChunk[x][y-1] < config.oppSnakeBody &&
              safeChunk[x+1][y] < config.oppSnakeBody &&
              safeChunk[x][y+1] < config.oppSnakeBody) {
              point = [x, y]
          }
          break;
        }
        Math.floor(Math.random() * 6) + 1
        x = floor(rand() * xLength) + 1
        y = floor(rand() * yLength) + 1
      }

      return this.convertChunkPointToGridPoint(chunkData, index, point);
    },

     /**
     * Determine which chunk of the map contains the safest location
     * @param  {object} chunkData contains each chunks data of each snake, and food
     * @return {object}     chunk data counts, and suggest safest tile on the map
     */
    isPosInChunk: function(x, y, tilesX, tilesY, chunksX, chunksY, chunkIndex) {
      var tileChunkY = floor(y / tilesY) - 1
      var tileChunkX = floor(x / tilesX) - 1
      var currChunkIndex = (tileChunkY * chunksX) + tilesX

      return (currChunkIndex == chunkIndex)
    },

    /** Determine which chunk of the map contains the safest location
      * @param  {object} chunkData contains each chunks data of each snake, and food
      * @return {object}     chunk data counts, and suggest safest tile on the map
      */
    convertChunkPointToGridPoint: function(chunkData, index, point) {
      var x = 0;
      var y = 0;

      var currIndex = 1;
      var newRow = true;
      //convert to grid position
      while (currIndex <= index) {
        var currChunk = chunkData[currIndex++]

        //calculate x
        if (currChunk[0].length % x == 0)
        {
          x = 0;
          y += currChunk.length
          newRow = true
        }
        else
        {
          x += currChunk[0].length
        }
      }

      return {x:point[0] + x, y: point[1] + y};
    },

    /** Determine which chunk of the map contains the safest location
      * @param  {object} chunkData contains each chunks data of each snake, and food
      * @return {object}     chunk data counts, and suggest safest tile on the map
      */
    isHeadNearCenterOfChunk: function(chunkData, index, head) {
      var safeChunk = chunkData[index]
      var headX = head['x'];
      var headY = head['y'];

      var centerX = floor(chunkData[0].length / 2);
      var centerY = floor(safeChunk.length / 2);
      var centerChunkGridPosition = this.convertChunkPointToGridPoint(chunkData, index, [centerX, centerY])
      centerX = centerChunkGridPosition['x']
      centerY = centerChunkGridPosition['y']

      return (this.getPointDistance({x:centerX,y:centerY}, head) < config.distanceFromSafePoint)
    },

    getPointDistance(pA,pB) {
      return (Math.abs(pA.x-pB.x) + Math.abs(pA.y - pB.y))
    }

}
