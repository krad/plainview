import Manson from '@krad/manson'

class MSEController {
  constructor(mimeCodec) {
    this.onSourceOpen = this.onSourceOpen.bind(this)
    this.appendBuffer = this.appendBuffer.bind(this)

    if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {

      Manson.debug(`browser supports mimecodec: ${mimeCodec}`)
      this.mimeCodec      = mimeCodec
      this.mediaSource    = new window.MediaSource()
      this.mediaSourceURL = URL.createObjectURL(this.mediaSource);
      this.mediaSource.addEventListener('sourceopen', this.onSourceOpen)

    } else {
      if ('MediaSource' in window) { throw `Media Type not supported: ${mimeCodec}` }
      else { throw `MediaSource not available` }
    }
  }

  setVideo(video, setVideoCB) {
    if (video) {
      this.setVideoCB = setVideoCB
      this.video      = video
      video.src       = this.mediaSourceURL
    }
  }

  onSourceOpen(e) {
    URL.revokeObjectURL(this.video.src);
    const mediaSource   = e.target
    this.sourceBuffer  = mediaSource.addSourceBuffer(this.mimeCodec)
    this.setVideoCB()
  }

  appendBuffer(buffer, updateEndCB) {
    this.sourceBuffer.appendBuffer(buffer)
    this.sourceBuffer.onupdateend = (e) => {
      this.sourceBuffer.onupdateend = undefined
      updateEndCB()
    }
  }

  endOfStream() {
    this.mediaSource.endOfStream()
  }


}

export default MSEController
