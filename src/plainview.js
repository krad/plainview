/**
*  @file plainview
*  @author krad.io <iam@krad.io>
*  @version 1.3.19
*/

import StreamController from './stream-controller'
import Manson from '@krad/manson'
import { percentageComplete, makeTimeCode } from './time-code-helpers'

class plainview {
  constructor(config) {
    Manson.setup()

    this.stream = new StreamController(config)

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
  }

  setLogLevel(val) { Manson.level = val }

  get video() { return this._val }

  set video(val) {
    this._video = val
    this.mute() // videos need to be muted for autoplay to start
    this.video.setAttribute('playsinline', '')
    this.video.setAttribute('autoplay', 'true')

    this.video.addEventListener('timeupdate', (e) => {
      Manson.trace(`timeupdate event: ${e}`)
      // const progress = percentageComplete(this.video.currentTime, this.player.totalDuration)
      // const timecode  = makeTimeCode(this.video.currentTime)
      // const total     = makeTimeCode(this.player.totalDuration)
      // this.onPlayProgress(progress, timecode, total)
    })

    this.video.addEventListener('canplay', () => {
      Manson.trace('player canplay event')
      this.onCanPlay()
    })

    this.video.addEventListener('ended', (e) => {
      Manson.trace('player ended event')
      this.onEnded()
    })

    this.video.addEventListener('stalled', (e) => {
      Manson.trace(`player stalled event ${e}`)
      this.onStall()
    })

    this.video.addEventListener('error', (e) => {
      Manson.trace(`player error event ${e}`)
      this.onError()
    })

    this.stream.start().catch(err => {
      Manson.error('problem starting player')
      console.log(err);
    })
  }

  play() {
    Manson.info('user pressed play')
    this.video.play()
    this.onPlay()
  }

  replay() {
    Manson.info('user pressed replay')
    this.video.play()
    this.onReplay()
    this.play()
  }

  pause() {
    Manson.info('user pressed paused')
    this.video.pause()
    this.onPause()
  }

  mute() {
    Manson.info('user pressed mute')
    this.video.muted = true
    this.onMute()
  }

  unmute() {
    Manson.info('user pressed unmute')
    this.video.muted = false
    this.onUnmute()
  }

  requestFullScreen() {
    Manson.info('user pressed fullscreen')
    if (this.video.requestFullscreen) {
      this.video.requestFullscreen();
    } else if (this.video.mozRequestFullScreen) {
      this.video.mozRequestFullScreen(); // Firefox
    } else if (this.video.webkitRequestFullscreen) {
      this.video.webkitRequestFullscreen(); // Chrome and Safari
    }
  }

}

export default plainview
//       this.player.configure().then(player => {
//         Manson.debug('player configured')
//         // const timecode  = makeTimeCode(this.video.currentTime)
//         // const total     = makeTimeCode(this.player.totalDuration)
//         // this.onPlayProgress(0, timecode, total)2
//
//
// export { makeTimeCode }
