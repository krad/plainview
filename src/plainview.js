/**
*  @file plainview - a suite of tools for parsing m3u8 and mp4 files.
*  @author krad.io <iam@krad.io>
*  @version 0.0.3
 */

import Player from './player'

class plainview {
  constructor(config) {

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

const requestFullscreen = (player) => {
    if (player.requestFullscreen) {
      player.requestFullscreen();
    } else if (player.mozRequestFullScreen) {
      player.mozRequestFullScreen(); // Firefox
    } else if (player.webkitRequestFullscreen) {
      player.webkitRequestFullscreen(); // Chrome and Safari
    }
}


export default plainview
