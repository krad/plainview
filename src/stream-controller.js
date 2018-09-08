import HLSController from './hls-controller'
import MSEController from './mse-controller'
import Muxer from './muxer'
import Manson from '@krad/manson'
import PromiseQueue from '../src/promise-queue'
import AVSupport from './support'

class StreamController {

  constructor(config) {
    this.segmentDownloaded = this.segmentDownloaded.bind(this)
    this.segmentConsumedCB = () => {}

    this.hls                        = new HLSController(config)
    this.hls.segmentFetchedCallback = this.segmentDownloaded
    this.muxer                      = new Muxer()
    this.q                          = PromiseQueue()
  }

  start(video) {
    Manson.info('starting stream...')
    if (AVSupport.hasNativeHLSSupportFor(video)) {
      return this.startNative(video)
    } else {
      return this.startPlainview(video)
    }
  }

  startNative(video) {
    Manson.debug('browser has native HLS support.  delegating responsibilities')
    return new Promise((resolve, _) => {
      video.src = this.hls.url
      resolve(0)
    })
  }

  startPlainview(video) {
    Manson.debug('browser does not have native HLS support.  assuming responsibilities')
    this.runningPromise = new Promise((resolve, reject) => {
      this.hls.configure()
      .then(_ => {
        this.mse = new MSEController(this.hls.codecsString)
        return this.mse.setVideo(video)
      })
      .then(_ => {
        return this.hls.fetchSegments()
      })
    })
    return this.runningPromise
  }

  segmentDownloaded(segment) {
    if (this.hls.segmentsType === 'ts') {
      this.q.push(
        this.muxer.transcode(segment)
        .then(bytes => this.mse.appendBuffer(bytes))
        .then(_ => this.segmentConsumedCB())
      )
    } else {
      this.q.push(
        this.mse.appendBuffer(segment)
        .then(_ => this.segmentConsumedCB())
      )
    }
  }

}

export default StreamController
