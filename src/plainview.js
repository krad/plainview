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
   * @param  {Function(err)} cb A function that is executed when setup is complete
   */
  setup(cb) {
    this._skinner.skin(this)
    this._player.configure(this.AVElement)
    .then(_ => {
      this._skinner.setTime(this.AVElement.currentTime, this._player.duration)

      this.AVElement.addEventListener('timeupdate', x => {
        this._skinner.setTime(this.AVElement.currentTime, this._player.duration)
      })

      this.AVElement.addEventListener('play', x => {
        this._skinner.setPauseButtonToPause()
      })

      this.AVElement.addEventListener('ended', x => {
        this._skinner.setPauseButtonToRestart()
      })

      // TODO: Handle these events
      this.AVElement.addEventListener('pause', x => { })
      this.AVElement.addEventListener('seeked', x => { })
      this.AVElement.addEventListener('stalled', x => { })

      if(cb) { cb() }
    }).catch(err => {
      if(cb) { cb(err) }
    })
  }

  play()              { this._player.play(this.AVElement) }
  pause()             { this._player.pause(this.AVElement) }
  set muted(value)    { this.AVElement.muted = value }
  requestFullscreen() { requestFullscreen(this.AVElement) }
}

const requestFullscreen = (player) => {
    if (player.requestFullscreen) {
      player.requestFullscreen();
    } else if (player.mozRequestFullScreen) {
      player.mozRequestFullScreen(); // Firefox
    } else if (player.webkitRequestFullscreen) {
      player.webkitRequestFullscreen(); // Chrome and Safari
    }
}


module.exports = Plainview
