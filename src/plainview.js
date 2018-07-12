/**
*  @file plainview - a suite of tools for parsing m3u8 and mp4 files.
*  @author krad.io <iam@krad.io>
*  @version 0.0.3
 */
var skinner         = require('./skin')
var videoTagHelpers = require('./video_tag_helpers')
var player          = require('./player')

class plainview {
  constructor(config) {
    this.config   = this.config
    this.url      = config.url || ''
    this.playing  = false
    this.loop     = config.loop || false
    this.volume   = 1.0
    this.muted    = false
    this.width    = config.with || 1000
    this.height   = config.height || 1000
    this.style    = config.style || {}
    this.progressInterval = config.progressInterval || 1000

    // Called when media is loaded and ready to play. If playing is set to true, media will play immediately
    this.onReady = () => {}

    // Called when media starts playing
    this.onStart = () => {}

    // Called when media starts or resumes playing after pausing or buffering
    this.onPlay = () => {}

    // Callback containing played and loaded progress as a fraction, and playedSeconds and loadedSeconds in seconds
    // ◦  eg { played: 0.12, playedSeconds: 11.3, loaded: 0.34, loadedSeconds: 16.7 }
    this.onProgress = () => {}

    // Callback containing duration of the media, in seconds
    this.onDuration = () => {}

    // Called when media is paused
    this.onPause = () => {}

    // Called when media starts buffering
    this.onBuffer = () => {}

    // Called when media seeks with seconds parameter
    this.onSeek = () => {}

    // Called when media finishes playing
    this.onEnded = () => {}

    // Called when an error occurs whilst attempting to play media
    this.onError = () => {}
  }

  static canPlay(url) {
    return false
  }

  seekTo(time) {   }
  getCurrentTime() { return 0 }
  getSecondsLoaded()	{ return 0 }
  getDuration()	{ return 0 }
  
}

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
      this.AVElement.addEventListener('seeking', x => { })
      this.AVElement.addEventListener('seeked', x => { })
      this.AVElement.addEventListener('stalled', x => {
        console.log('stalled', x);
      })

      this.AVElement.addEventListener('loadeddata', x => {
        console.log('loaded data');
      })

      this.AVElement.addEventListener('loadstart', x => {
        console.log('load start');
      })

      this.AVElement.addEventListener('progress', x => {
        console.log('progress', x);
      })

      this.AVElement.addEventListener('waiting', x => {
        console.log('waiting', x);
      })

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
