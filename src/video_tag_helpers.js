
/**
 * getPlayer - Used to get an HTMLElement matching an id
 */
const getPlayer = (playerID) => {
  var player = document.getElementById(playerID)
  if (player) {
    return player
  }
  return null
}


/**
 * getSourcesFromPlayerID - Used to get all source elements in a video or audio tag
 */
const getSourcesFromPlayerID = (playerID) => {
  const player = getPlayer(playerID)
  if (player) { return player.querySelectorAll('source') }
  return null
}


/**
 * getHLSSourcesFromPlayerID - Used to get all source elements that have an HLS type
 */
const getHLSSourcesFromPlayerID = (playerID) => {
  const allSources = getSourcesFromPlayerID(playerID)
  if (allSources) {
    return Array.from(allSources)
    .filter(x =>
      (x.type == 'application/x-mpegURL' || x.type == 'vnd.apple.mpegURL'))
  }
  return null
}


/**
 * getHLSURLsFromPlayerID - Used to get all HLS playlist URLs from a player id
 */
const getHLSURLsFromPlayerID = (playerID) => {
  const allSources = getHLSSourcesFromPlayerID(playerID)
  if (allSources) { return allSources.map(x => x.src) }
  return null
}

module.exports = {
  getPlayer: getPlayer,
  getSourcesFromPlayerID: getSourcesFromPlayerID,
  getHLSSourcesFromPlayerID: getHLSSourcesFromPlayerID,
  getHLSURLsFromPlayerID: getHLSURLsFromPlayerID
}
