import HLSController from './hls-controller'
import MSEController from './mse-controller'
import serialPromise from './serial-promise'

class StreamController {
  constructor(config) {
    this.hls = new HLSController(config)
    this.mse = new MSEController(config)
  }
}

export default StreamController
