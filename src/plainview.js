/**
*  @file plainview
*  @author krad.io <iam@krad.io>
*  @version 0.1.0
 */

import Player from './player'

class plainview {
  constructor(config) {
    this.player                    = new Player(config.url)
    this.player.onDownloadProgress = config.onDownloadProgress

    this.video                     = config.video
    this.onSourceOpen              = this.onSourceOpen.bind(this)

    this.currentIdx = 0

    this.player.configure().then(player => {
      const mimeCodec = player.playlist.codecsString
      if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
        player.fetchSegments()
        this.mediaSource = new window.MediaSource()
        this.video.src = URL.createObjectURL(this.mediaSource);
        this.mediaSource.addEventListener('sourceopen', this.onSourceOpen)
      }
    })

  }

  onSourceOpen(e) {
    URL.revokeObjectURL(this.video.src);
    const mediaSource  = e.target
    console.log(mediaSource.sourceBuffers);
    const sourceBuffer = mediaSource.addSourceBuffer(this.player.playlist.codecsString)
    const segment      = this.player.playlist.segments[this.currentIdx]

    sourceBuffer.addEventListener('updateend', (e) => {
      if (this.currentIdx >= this.player.playlist.segments.length) {
        mediaSource.endOfStream()
      } else {
        console.log('get next segment');
        this.appendSegment(mediaSource, sourceBuffer, this.nextSegment())
      }
    })

    console.log('----- first call');
    this.appendSegment(mediaSource, sourceBuffer, segment)

  }

  appendSegment(mediaSource, sourceBuffer, segment) {
    console.log('==== call call call');
    if (!segment) {
      console.log('no segment - end of stream?');
      return
    }

    if (segment.progress === 100.00) {
      if (sourceBuffer.updating) {
        setTimeout(() => { this.appendSegment(mediaSource, sourceBuffer, segment) }, 200)
      } else {
        sourceBuffer.appendBuffer(segment.data.buffer)
        this.video.play()
        this.appendSegment(mediaSource, sourceBuffer, this.nextSegment())
      }

    } else {
      setTimeout(() => { this.appendSegment(mediaSource, sourceBuffer, segment) }, 200)
      return
    }
  }

  nextSegment() {
    return this.player.playlist.segments[this.currentIdx++]
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
