/**
*  @file plainview - a suite of tools for parsing m3u8 and mp4 files.
*  @author krad.io <iam@krad.io>
*  @version 0.0.3
 */
var skinner         = require('./skin')
var videoTagHelpers = require('./video_tag_helpers')
var player          = require('./player')

class Plainview {

  /**
   * constructor - Initializes a new plainview instance
   *
   * @param  {String} playerID ID of an HTML element in the DOM
   * @return {Plainview} Initialized plainview instance
   */
  constructor(playerID) {
    this.AVElement = videoTagHelpers.getPlayer(playerID)
    if (this.AVElement) {
      this.playlistURLs = videoTagHelpers.getHLSURLsFromPlayerID(playerID)
      this._skinner     = new skinner(this.AVElement)

      if (this.playlistURLs.length > 0) {
        this._player = new player(this.playlistURLs[0])
      } else {
        throw 'No HLS playlists present in player tag'
      }

    } else {
      throw 'Could not find player tag'
    }
  }

  /**
   * setup - Used to setup the player.
   * Will skin the player and fetch the playlist & media info used to configure it.
   *
   * @param  {type} cb description
   * @return {type}    description
   */
  setup(cb) {
    this._skinner.skin()
    this._player.configure().then(_ => {
      cb()
    }).catch(err => {
      cb(err)
    })
  }

}

module.exports = Plainview
