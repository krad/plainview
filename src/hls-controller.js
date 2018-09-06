require('@babel/polyfill')
import * as slugline from '@krad/slugline'
import Manson from '@krad/manson'

class HLSController {
  constructor(config) {
    Manson.trace('configuring HLSController')
    this.url    = config.url
    this.codecs = config.codecs
    this.fetchPlaylist  = this.fetchPlaylist.bind(this)
    this.fetchCodecInfo = this.fetchCodecInfo.bind(this)
  }

  set codecs(val) {
    if (val && val.constructor.name === 'String') {
      this._codecs = JSON.parse(val)
    } else {
      this._codecs = val
    }

    if (this._codecs) {
      this.codecsString = slugline.MPEGParser.createCodecsString(this._codecs)
    }
  }

  get codecs() { return this._codecs }

  fetchPlaylist() {
    return new Promise((resolve, reject) => {
      Manson.debug(`fetching playlist ${this.url}`)
      slugline.Playlist.fetch(this.url).then(playlist => {
        this.playlist = playlist
        resolve(playlist)
      }).catch(err => {
        reject(err)
      })
    })
  }

  fetchCodecInfo() {
    return new Promise((resolve, reject) => {
      Manson.debug('fetching codec information')
      if (this.playlist === undefined) {
        reject('Playlist not present')
        return
      }
      this.playlist.getCodecsInformation().then(codecs => {
        this.codecs       = codecs
        resolve(codecs)
      }).catch(err => {
        reject(err)
      })
    })
  }

  configure() {
    let requests = []
    if (!this.playlist) { requests.push(this.fetchPlaylist) }
    if (!this.codecs) { requests.push(this.fetchCodecInfo) }
    return promiseSerial(requests)
  }

}

const promiseSerial = funcs =>
  funcs.reduce((promise, func) =>
    promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]))

export default HLSController
