/**
*  @file plainview
*  @author krad.io <iam@krad.io>
*  @version 0.1.0
 */

require("babel-polyfill");
import Player from './player'
import AVSupport from './support'
import { percentageComplete, makeTimeCode } from './time-code-helpers'
import * as slugline from '@krad/slugline'

class plainview {

  constructor(url) {
    this.player       = new Player(url)
    this.onSourceOpen = this.onSourceOpen.bind(this)

    /// Stub out everything with no operations until the user configures them
    const NOP               = () => {}
    this.onCanPlay          = NOP
    this.onPlayProgress     = NOP
    this.onDownloadProgress = NOP
    this.onPlay             = NOP
    this.onPause            = NOP
    this.onReplay           = NOP
    this.onMute             = NOP
    this.onUnmute           = NOP
    this.onEnded            = NOP


    // this.video.onloadstart = (x) => { }
    // this.video.ondurationchange = (x) => { }
    // this.video.onloadedmetadata = (x) => { }
    // this.video.onloadeddata = (x) => { }
    // this.video.onprogress = (x) => { }
    // this.video.oncanplay = (x) => { }
    // this.video.oncanplaythrough = (x) => { }
    // this.video.addEventListener('seeked', (x) => { })
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
      const timecode  = makeTimeCode(this.video.currentTime)
      const total     = makeTimeCode(this.player.totalDuration)
      this.onPlayProgress(0, timecode, total)

      if (AVSupport.hasNativeHLSSupportFor(this.video)) {
        this.video.src = player.playlist.url
      } else {
        let mimeCodec = player.playlist.codecsString
        if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
          player.fetchSegments()
          this.mediaSource  = new window.MediaSource()
          //console.log(this.mediaSource);
          this.video.src    = URL.createObjectURL(this.mediaSource);
          this.mediaSource.addEventListener('sourceopen', this.onSourceOpen)
        } else {
          console.log('Codecs not supported', mimeCodec);
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
    this.play()
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

  requestFullScreen() {
    if (this.video.requestFullscreen) {
      this.video.requestFullscreen();
    } else if (this.video.mozRequestFullScreen) {
      this.video.mozRequestFullScreen(); // Firefox
    } else if (this.video.webkitRequestFullscreen) {
      this.video.webkitRequestFullscreen(); // Chrome and Safari
    }
  }

  async onSourceOpen(e) {
    URL.revokeObjectURL(this._video.src);
    const mediaSource  = e.target

    let codecsString = this.player.playlist.codecsString
    let sourceBuffer = mediaSource.addSourceBuffer(codecsString)

    let checkForWork = () => {
      setTimeout(() => {
        if (this.player.segments.length > 0) {
          this.video.autoplay = true
          console.log(this.video.error)
          new Promise(async (resolve, reject) => {
            const segment = this.player.segments.shift()
            sourceBuffer.appendBuffer(segment)
            sourceBuffer.onupdateend = (e) => {
              sourceBuffer.onupdateend = undefined
              resolve()
            }
          }).then(_ => {
            checkForWork()
          })
        } else {
          checkForWork()
        }
      }, 500)
    }

    checkForWork()

  }

}



global.plainview  = plainview
export default plainview
export { makeTimeCode }
