class Map {
  constructor(game) {
    this.id     = game.game_id
    this.height = game.height
    this.width  = game.width
  }

  getWidth() {
    return this.width
  }

  getHeight() {
    return this.height
  }
}

module.exports = Map