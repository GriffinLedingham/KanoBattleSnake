module.exports = {
  // What HP we should start looking for food at
  minHealthToFindFood: 30,

  // How much extra health we should give, on top of
  // closest food before we start heading there.
  //
  // ie. Food is 10 squares away, start moving at 20 HP
  foodSearchPaddingHP: 10,

  // How far away from closest food we should idle
  distanceToWaitFromFood: 10,

  // If we should match the lenght of longest snake
  //
  // This currently makes our snake perform worse.
  // Might be better if it matched avg. lenght of all
  // snakes?
  matchLongestSnake: false,

  // This enables banDir logging, and any other desired
  // logs that may come up
  enableLogging: false
}
