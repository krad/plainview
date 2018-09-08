import HLSController from './hls-controller'
import MSEController from './mse-controller'
import Muxer from './muxer'
import Manson from '@krad/manson'
import PromiseQueue from '../src/promise-queue'
import AVSupport from './support'

class StreamController {

  constructor(config) {
    this.hls                        = new HLSController(config)
    this.muxer                      = new Muxer()
    this.muxQ                       = PromiseQueue()
    this.q                          = PromiseQueue()

    this.segmentDownloaded          = this.segmentDownloaded.bind(this)
    this.hls.segmentFetchedCallback = this.segmentDownloaded
    this.segmentConsumedCB          = () => { }
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
      resolve()
    })
  }

  startPlainview(video) {
    Manson.debug('browser does not have native HLS support.  assuming responsibilities')
    return new Promise((resolve, reject) => {
      this.hls.configure()
      .then(_ => {
        this.mse = new MSEController(this.hls.codecsString)
        return this.mse.setVideo(video)
      })
      .then(_ => {
        return this.hls.fetchSegments()
      }).then(_ => {
        resolve()
      }).catch(err => {
        reject(err)
      })
    })
  }

  segmentDownloaded(segment) {
    if (this.hls.segmentsType === 'ts') {
      this.muxQ.push(
        this.muxer.transcode(segment)
        .then(res => {
          if (res.length > 1) {
            return this.mse.appendBuffer(res[0]).then(_ => this.mse.appendBuffer(res[1]))
          } else {
            return this.mse.appendBuffer(res[0])
          }
        }).then(_ => {
          this.segmentConsumedCB()
        })
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
