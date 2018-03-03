const PF      = require('pathfinding')
const config  = require('../config')
const _       = require('lodash')
const ceil   = Math.ceil
const floor   = Math.floor
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
        var numChunks = chunkData.length
        var chunkInfo = {
            currentChunkIndex: 0,
            targetChunk: 0
        }

        var chunkCounts = []
        var chunkScores = []

        for(var i = 0; i < numChunks; i++) {
            var itChunkData = _.flatten(chunkData[i])
            var itChunkLength = itChunkData.length
            var itChunkScore = 0

            var itCounts = {

            }

            itCounts[config.walkable] = 0
            itCounts[config.food] = 0
            itCounts[config.ownSnakeBody] = 0
            itCounts[config.ownHead] = 0
            itCounts[config.ownTail] = 0
            itCounts[config.oppSnakeBody] = 0
            itCounts[config.oppHead] = 0
            itCounts[config.oppTail] = 0

            for (var j = 0; j < itChunkLength; j++) {
                switch (itChunkData[j]) {
                    case config.walkable:
                        itCounts[config.walkable] += 1
                        itChunkScore++
                        break
                    case config.food:
                        itCounts[config.food] += 1
                        itChunkScore += 2
                        break;
                    case config.ownSnakeBody:
                        itCounts[config.ownSnakeBody] += 1
                        break;
                    case config.oppsnakeBody:
                        itCounts[config.oppSnakeBody] += 1
                        itChunkScore -= 1
                        break;
                    case config.ownHead:
                        itCounts[config.ownHead] += 1
                        // This is the chunk our head is in
                        currentChunkIndex = i
                        itChunkScore += 10
                        break;
                    case config.ownTail:
                        itCounts[config.ownTail] += 1
                        itChunkScore++
                        break;
                    case config.oppHead:
                        itCounts[config.oppHead] += 1
                        itChunkScore -= 10
                        break;
                    case config.oppTail:
                        itCounts[config.oppTail] += 1
                        itChunkScore -= 2
                        break;
                }
            }

            chunkCounts.push( itCounts )
            chunkScores.push( itChunkScore )
        }

        var bestChunkScore = false
        var bestChunkIndex = false
        for(var i = 0; i<chunkScores.length;i++) {
            if(chunkScores[i] > bestChunkScore || bestChunkScore == false) {
                bestChunkScore = chunkScores[i]
                bestChunkIndex = i
            }
        }

        // Overwrite this for return
        chunkCounts = [chunkInfo.currentChunkIndex, bestChunkIndex]

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
    findSafestPointInChunk: function(chunkData, index, chunksX, chunksY, mapWidth, mapHeight) {

      var safeChunk = chunkData[index]

      var xLength = chunkData[0].length

      var yLength = safeChunk.length
      var x = floor(xLength / 2);
      var y = floor(yLength / 2);

      var point = [x,y]

      // Comment this out for now cause broken
      //
      //
      //
      // var currPointData
      // while (true) {
      //   currPointData = safeChunk[x][y]
      //   if (currPointData < config.oppSnakeBody)
      //   {
      //     var safeSidePoints = 0
      //     if (safeChunk[x-1][y] < config.oppSnakeBody &&
      //         safeChunk[x][y-1] < config.oppSnakeBody &&
      //         safeChunk[x+1][y] < config.oppSnakeBody &&
      //         safeChunk[x][y+1] < config.oppSnakeBody) {
      //         point = [x, y]
      //     }
      //     break;
      //   }
      //   x = floor(rand() * xLength) + 1
      //   y = floor(rand() * yLength) + 1
      // }

      return this.convertChunkPointToGridPoint(chunkData, index, point, mapWidth, mapHeight);
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
    convertChunkPointToGridPoint: function(chunkData, index, point, mapWidth, mapHeight) {
      var x = 0;
      var y = 0;

      var currIndex = 0;

      let xLength = 0

      while ( currIndex < index)
      {
        var currChunk = chunkData[currIndex++]

        x += currChunk[0].length;
        if (x == mapWidth)
        {
            x = 0;
            y += currChunk.length
        }
      }
      return {x:point[0] + x, y: point[1] + y}
    },

    /** Determine which chunk of the map contains the safest location
      * @param  {object} chunkData contains each chunks data of each snake, and food
      * @return {object}     chunk data counts, and suggest safest tile on the map
      */
    isHeadNearCenterOfChunk: function(chunkData, index, head, mapWidth, mapHeight) {
      var safeChunk = chunkData[index]
      var headX = head['x'];
      var headY = head['y'];

      var centerX = floor(chunkData[0].length / 2);
      var centerY = floor(safeChunk.length / 2);
      var centerChunkGridPosition = this.convertChunkPointToGridPoint(chunkData, index, [centerX, centerY], mapWidth, mapHeight)
      centerX = centerChunkGridPosition['x']
      centerY = centerChunkGridPosition['y']

      return (this.getPointDistance({x:centerX,y:centerY}, head) < config.distanceFromSafePoint)
    },

    getPointDistance(pA,pB) {
      return (Math.abs(pA.x-pB.x) + Math.abs(pA.y - pB.y))
    }

}
