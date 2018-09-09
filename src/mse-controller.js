import "@babel/polyfill"
import Manson from '@krad/manson'

class MSEController {
  constructor(mimeCodec) {
    this.appendBuffer = this.appendBuffer.bind(this)

    if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {

      Manson.debug(`browser supports mimecodec: ${mimeCodec}`)
      this.mimeCodec      = mimeCodec
      this.mediaSource    = new window.MediaSource()
      this.mediaSourceURL = URL.createObjectURL(this.mediaSource);
      this.mediaSource.addEventListener('sourceopen', (e) => {
        URL.revokeObjectURL(this.video.src);
        const mediaSource   = e.target
        this.sourceBuffer  = mediaSource.addSourceBuffer(this.mimeCodec)
        this.setVideoCB()
      })

    } else {
      if ('MediaSource' in window) { throw `Media Type not supported: ${mimeCodec}` }
      else { throw `MediaSource not available` }
    }
  }

  async setVideo(video) {
    return new Promise((resolve, reject) => {
      if (video) {
        this.setVideoCB = () => { resolve() }
        this.video      = video
        video.src       = this.mediaSourceURL
      } else {
        reject('Video was undefined')
      }
    })
  }

  async appendBuffer(buffer) {
    return new Promise((resolve, reject) => {
      if (this.video.error) {
        reject(this.video.error)
        return
      }

      this.sourceBuffer.appendBuffer(buffer)
      this.sourceBuffer.onupdateend = (e) => {
        this.sourceBuffer.onupdateend = undefined
        resolve()
      }
    })
  }

  endOfStream() {
    this.mediaSource.endOfStream()
  }

}

export default MSEController
