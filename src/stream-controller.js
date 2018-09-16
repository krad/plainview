import "@babel/polyfill"
import HLSController from './hls-controller'
import MSEController from './mse-controller'
import Muxer from './muxer'
import Manson from '@krad/manson'
import AVSupport from './support'

class StreamController {

  constructor(config) {
    this.hls                        = new HLSController(config)
    this.muxer                      = new Muxer()

    this.segmentDownloaded          = this.segmentDownloaded.bind(this)
    this.process                    = this.process.bind(this)
    this.hls.segmentFetchedCallback = this.segmentDownloaded
    this.segmentConsumedCB          = () => { }
    this.segments                   = []
    this.processing                 = false
  }

  async start(video) {
    Manson.info('starting stream...')
    if (AVSupport.hasNativeHLSSupportFor(video)) {
      return this.startNative(video)
    } else {
      return this.startPlainview(video)
    }
  }

  async startNative(video) {
    Manson.debug('browser has native HLS support.  delegating responsibilities')
    return new Promise((resolve, _) => {
      video.src = this.hls.url
      resolve()
    })
  }

  async startPlainview(video) {
    Manson.debug('browser does not have native HLS support.  assuming responsibilities')
    return new Promise((resolve, reject) => {
      this.hls.configure()
      .then(_ => {
        this.mse = new MSEController(this.hls.codecsString)
        return this.mse.setVideo(video)
      })
      .then(_ => {
        return this.hls.start()
      }).catch(err => {
        reject(err)
      })
    })
  }

  segmentDownloaded(segment) {
    this.segments.push(segment)
    this.process()
  }

  async process() {
    if (!this.processing) {
      this.processing = true
      let segment     = this.segments.shift()
      if (this.hls.segmentsType === 'ts') {
        const res = await this.muxer.transcode(segment)
        for (let segment of res) {
          await this.mse.appendBuffer(segment)
        }
      } else {
        await this.mse.appendBuffer(segment)
      }
      this.segmentConsumedCB()
      this.processing = false
      if (this.segments.length > 0) {
        this.process()
      }
    }
  }

  get totalDuration() {
    if (this.hls && this.hls.playlist) {
      return this.hls.playlist.totalDuration
    }
  }

  set onDownloadProgress(cb) {
    if (this.hls) { this.hls.onDownloadProgress = cb }
  }

}

export default StreamController
