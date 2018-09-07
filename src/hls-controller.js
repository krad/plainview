require('@babel/polyfill')
import * as slugline from '@krad/slugline'
import Manson from '@krad/manson'
import serialPromise from './serial-promise'

class HLSController {

  constructor(config) {
    Manson.trace('configuring HLSController')
    this.url    = config.url
    this.codecs = config.codecs
    this.fetchPlaylist          = this.fetchPlaylist.bind(this)
    this.fetchCodecInfo         = this.fetchCodecInfo.bind(this)
    this.nextFetchStarted       = this.nextFetchStarted.bind(this)
    this.nextFetchCompleted     = this.nextFetchCompleted.bind(this)
    this.fetchSegments          = this.fetchSegments.bind(this)
    this.segmentFetchedCallback = () => {}
  }

  /**
   * configure - Configures the state of the player after initialization
   *
   * @return {Promise} Executes n number of promises serially to mutate the state of the controller
   */
  configure() {
    let requests = []
    if (!this.playlist) { requests.push(this.fetchPlaylist) }
    if (!this.codecs) { requests.push(this.fetchCodecInfo) }
    return serialPromise(requests)
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

  /**
   * get segmentsType - Returns the segment types associated with the playlist
   *
   * @return {String}  'ts' for transport streams. 'fmp4' for fragmented mp4s
   */
  get segmentsType() {
    if (this.playlist) {
      return this.playlist.segmentsType
    }
    return undefined
  }

  /**
   * fetchPlaylist - Fetch the playlist the controller is configured for
   *
   * @return {Promise<Playlist>} Returns a Playlist object from slugline when successful
   */
  fetchPlaylist() {
    return new Promise((resolve, reject) => {
      Manson.debug(`fetching playlist ${this.url}`)
      slugline.Playlist.fetch(this.url).then(playlist => {
        this.playlist     = playlist
        resolve(playlist)
      }).catch(err => {
        reject(err)
      })
    })
  }


  /**
   * fetchCodecInfo - Fetches codec information from media associated with the playlist
   *
   * @return {Promise<Array<String>>} Returns an array of strings for all the codecs in the playlist
   */
  fetchCodecInfo() {
    return new Promise((resolve, reject) => {
      Manson.debug('fetching codec information')
      if (this.playlist === undefined) {
        reject('Playlist not present')
        return
      }
      this.playlist.getCodecsInformation().then(codecs => {
        this.codecs = codecs
        resolve(codecs)
      }).catch(err => {
        reject(err)
      })
    })
  }


  /**
   * nextFetchStarted - Called when the controller begins to fetch the next segment
   *
   * @param  {Segment} segment The Segment object that will be fetched
   */
  nextFetchStarted(segment) {
    Manson.debug(`fetching segment #${segment.id} - ${segment.url}`)
  }

  /**
   * nextFetchCompleted - Called when a segment fetch has been completed
   * Has a side effect of calling this.segmentFetchedCallback
   *
   * @param  {Uint8Array} segment Raw byte data fetched for a segment
   */
  nextFetchCompleted(segment) {
    Manson.info(`fetched segment #${segment.id} - ${segment.url}`)
    this.segmentFetchedCallback(segment)
  }


  /**
   * fetchSegments - Begins fetching segments in a playlist sequentially
   * If a playlist is of type LIVE or EVENT it will periodically refresh the playlist
   * and fetch all segments appended to it
   *
   * @return {Promise} A promise of the fetch routine
   */
  fetchSegments() {
    Manson.info('beginning segments fetch loop...')
    if (!this.playlist) { throw 'Player Misconfigured: Missing playlist' }

    if (this.playlist.type === 'LIVE' || this.playlist.type === 'EVENT') {
      this.playlist.startAutoRefresh(this.playlistRefreshed)
    } else {
      let stats = {}
      this.playlist.segments.forEach(s => { stats[s.uri] = 0 })
      this.downloadStats = stats
    }

    return this.playlist.fetchSequentially(this.nextFetchStarted,
                                           this.nextFetchCompleted,
                                           this.segmentDownloadProgress)
  }

}

export default HLSController
