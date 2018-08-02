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

  constructor(config) {
    this.player                    = new Player(config.url)
    this.player.onDownloadProgress = config.onDownloadProgress
    this.onPlay                    = config.onPlay
    this.onPause                   = config.onPause
    this.onMute                    = config.onMute
    this.onUnmute                  = config.onUnmute
    this.onPlayProgress            = config.onPlayProgress

    this.video                     = config.video
    this.video.setAttribute('playsinline', '')

    // this.video.onloadstart = (x) => {
    //   console.log('on load start', x)
    // }
    //
    // this.video.ondurationchange = (x) => {
    //   console.log('on duration change', x)
    // }
    //
    // this.video.onloadedmetadata = (x) => {
    //   console.log('onloadedmetadata', x)
    // }
    //
    // this.video.onloadeddata = (x) => {
    //   console.log('onloadeddata', x)
    // }
    //
    // this.video.onprogress = (x) => {
    //   console.log('on progress', x);
    // }
    //
    // this.video.oncanplay = (x) => {
    //   console.log('on can play', x);
    // }
    //
    // this.video.oncanplaythrough = (x) => {
    //   console.log('on can play through', x);
    // }
    //
    // this.video.addEventListener('seeked', (x) => {
    //   console.log('seeeedd');
    // })
    //
    this.video.addEventListener('timeupdate', (e) => {
      const progress = percentageComplete(this.video.currentTime, this.player.totalDuration)
      const timecode = makeTimeCode(this.video.currentTime, this.player.totalDuration)
      this.onPlayProgress(progress, timecode)
    })

    this.video.addEventListener('ended', (e) => {
      console.log('ended');
    })

    this.onSourceOpen              = this.onSourceOpen.bind(this)

    this.player.configure().then(player => {
      if (AVSupport.hasNativeHLSSupportFor(this.video)) {
        this.video.src = player.playlist.url
      } else {
        const mimeCodec = player.playlist.codecsString
        if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
          player.fetchSegments()
          this.mediaSource  = new window.MediaSource()
          this.video.src    = URL.createObjectURL(this.mediaSource);
          this.mediaSource.addEventListener('sourceopen', this.onSourceOpen)
        }
      }
    })
  }

  play() {
    this.video.play()
    this.onPlay()
  }

  replay() {
    console.log('replay hit');
  }

  pause() {
    this.video.pause()
    this.onPause()
  }

  mute() {
    this.video.muted = true
    this.onMute()
  }

  unmute() {
    this.video.muted = false
    this.onUnmute()
  }

  async onSourceOpen(e) {
    URL.revokeObjectURL(this.video.src);
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
global.Player     = Player
export default plainview
