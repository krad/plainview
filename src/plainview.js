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
import Manson from '@krad/manson'

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
    this.onStall            = NOP
    this.onError            = NOP

    Manson.setup()
  }

  set logLevel(val) {
    Manson.level = val
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
      Manson.trace('player ended event')
      this.onEnded()
    })

    this.video.addEventListener('canplay', (_) => {
      Manson.trace('player canplay event')
      this.onCanPlay()
    })

    this.video.addEventListener('stalled', (e) => {
      Manson.trace('player stalled event')
      this.onStall()
    })

    this.video.addEventListener('error', (e) => {
      Manson.error(`player reported error ${e}`)
      this.onError()
    })

    if (AVSupport.hasNativeHLSSupportFor(this.video)) {
      Manson.debug('browser has native HLS support.  delegating responsibilities')
      this.video.autoplay = true
      this.mute()
      this.video.src      = this.player.playlistURL
    } else {
      Manson.debug('browser does not support HLS. assuming responsibilities')
      this.player.configure().then(player => {
        const timecode  = makeTimeCode(this.video.currentTime)
        const total     = makeTimeCode(this.player.totalDuration)
        this.onPlayProgress(0, timecode, total)
        Manson.debug('browser does not support HLS.')

        let mimeCodec = player.playlist.codecsString
        if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
          player.fetchSegments().catch(err => {
            Manson.error(`Error fetching segments ${err}`)
            this.onError(err)
          })

          this.mediaSource  = new window.MediaSource()
          this.video.src    = URL.createObjectURL(this.mediaSource);
          this.mediaSource.addEventListener('sourceopen', this.onSourceOpen)
        } else {
          Manson.error(`codecs not supported ${mimeCodec}`)
        }

      }).catch(err => { this.onError(err) })
    }
  }

  set onDownloadProgress(cb) {
    if (this.player) { this.player.onDownloadProgress = cb }
  }

  get video() {
    return this._video
  }

  play() {
    Manson.trace('user played')
    this._video.play()
    this.onPlay()
  }

  replay() {
    Manson.trace('user replayed')
    this.video.currentTime = 0
    this.onReplay()
    this.play()
  }

  pause() {
    Manson.trace('user paused')
    this._video.pause()
    this.onPause()
  }

  mute() {
    Manson.trace('user muted playback')
    this._video.muted = true
    this.onMute()
  }

  unmute() {
    Manson.trace('user unmuted playback')
    this._video.muted = false
    this.onUnmute()
  }

  requestFullScreen() {
    Manson.trace('user requested fullscreen')
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
