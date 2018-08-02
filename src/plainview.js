/**
*  @file plainview
*  @author krad.io <iam@krad.io>
*  @version 0.1.0
 */

require("babel-polyfill");
import Player from './player'
import AVSupport from './support'
import { percentageComplete, makeTimeCode } from './time-code-helpers'

class plainview {

  constructor(url) {
    this.player                    = new Player(url)
    // this.video.onloadstart = (x) => { }
    // this.video.ondurationchange = (x) => { }
    // this.video.onloadedmetadata = (x) => { }
    // this.video.onloadeddata = (x) => { }
    // this.video.onprogress = (x) => { }
    // this.video.oncanplay = (x) => { }
    // this.video.oncanplaythrough = (x) => { }
    // this.video.addEventListener('seeked', (x) => { })
    this.onSourceOpen = this.onSourceOpen.bind(this)
  }

  set video(val) {
    this._video = val
    this.video.setAttribute('playsinline', '')

    this.video.addEventListener('timeupdate', (e) => {
      const progress = percentageComplete(this.video.currentTime, this.player.totalDuration)
      const timecode = makeTimeCode(this.video.currentTime)
      const total    = makeTimeCode(this.player.totalDuration)
      this.onPlayProgress(progress, timecode, total)
    })

    this.video.addEventListener('ended', (e) => {
      this.onEnded()
    })

    this.video.addEventListener('canplay', (_) => {
      this.onCanPlay()
    })


    this.player.configure().then(player => {
      if (AVSupport.hasNativeHLSSupportFor(this.video)) {
        this.video.src = player.playlist.url
      } else {
        const mimeCodec = player.playlist.codecsString

        const timecode  = makeTimeCode(this.video.currentTime)
        const total     = makeTimeCode(this.player.totalDuration)
        this.onPlayProgress(0, timecode, total)

        if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
          player.fetchSegments()
          this.mediaSource  = new window.MediaSource()
          this.video.src    = URL.createObjectURL(this.mediaSource);
          this.mediaSource.addEventListener('sourceopen', this.onSourceOpen)
        }
      }
    })
  }

  set onDownloadProgress(cb) {
    if (this.player) { this.player.onDownloadProgress = cb }
  }

  get video() {
    return this._video
  }

  play() {
    this._video.play()
    this.onPlay()
  }

  replay() {
    this.video.currentTime = 0
    this.onReplay()
  }

  pause() {
    this._video.pause()
    this.onPause()
  }

  mute() {
    this._video.muted = true
    this.onMute()
  }

  unmute() {
    this._video.muted = false
    this.onUnmute()
  }

  async onSourceOpen(e) {
    URL.revokeObjectURL(this._video.src);
    const mediaSource  = e.target
    const sourceBuffer = mediaSource.addSourceBuffer(this.player.playlist.codecsString)

    for (let segment of this.player.playlist.segments) {
      await segment.fetchPromise
      await new Promise(async (resolve, reject) => {
        sourceBuffer.appendBuffer(segment.data.buffer)
        sourceBuffer.onupdateend = (e) => {
          sourceBuffer.onupdateend = undefined
          resolve()
        }
      })
    }
    mediaSource.endOfStream()

  }

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

global.plainview  = plainview
export default plainview
export { makeTimeCode }
