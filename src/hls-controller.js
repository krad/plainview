import "@babel/polyfill"
import * as slugline from '@krad/slugline'
import Manson from '@krad/manson'

class HLSController {

  constructor(config) {
    Manson.trace('configuring HLSController')
    this.url                      = config.url
    this.codecs                   = config.codecs
    this.lastSegmentID            = undefined
    this.playlistRefreshed        = this.playlistRefreshed.bind(this)
    this.fetchPlaylist            = this.fetchPlaylist.bind(this)
    this.fetchCodecInfo           = this.fetchCodecInfo.bind(this)
    this.segmentFetchedCallback   = () => {}
    this.segmentDownloadProgress  = this.segmentDownloadProgress.bind(this)
  }

  /**
   * configure - Configures the state of the player after initialization
   *
   * @return {Promise} Executes n number of promises serially to mutate the state of the controller
   */
  async configure() {
    if (!this.playlist) { await this.fetchPlaylist(this.url) }

    if (this.playlist.objType === 'MasterPlaylist') {
      this.masterPlaylist = this.playlist

      const variant = this.masterPlaylist.completeVariants.sort((a, b) => a.bandwidth - b.bandwidth)[0]
      if (variant) {
        await this.fetchPlaylist(variant.url)
      }
    }

    if (!this.codecs) { await this.fetchCodecInfo() }
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
  fetchPlaylist(url) {
    return new Promise((resolve, reject) => {
      Manson.debug(`fetching playlist ${url}`)
      slugline.Playlist.fetch(url).then(playlist => {
        this.playlist = playlist
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
   * get totalDuration - Total duration of all segments as reported by the playlist
   *
   * @return {Float}  A float representing the duration of the playlist in seconds
   */
  get totalDuration() {
    if (this.playlist) { return this.playlist.totalDuration }
    return undefined
  }


  /**
   * segmentDownloadProgress - Callback used by the fetch process to update the controller about download progress
   *
   * @param  {Object} progress Simple object with properties about how much has been downloaded and how much is left
   */
  segmentDownloadProgress(progress) {
    Manson.trace(progress)
  }

  /**
   * get downloadProgress - How much progress has been made of the download
   *
   * @return {Float}  0.0 - 100.0
   */
  get downloadProgress() {
    if (this.playlist) { return this._downloadProgress }
    return undefined
  }

  /**
   * set downloadProgress - Setter used to calculate download progress
   */
  set downloadProgress(val) {
    this.downloadStats[val.uri] = val.progress

    let total = 0
    const segmentMax = (100/Object.keys(this.downloadStats).length)
    Object.keys(this.downloadStats).forEach(k => {
      const segmentProgress = segmentMax * (100 * (this.downloadStats[k]/10000))
      total += segmentProgress
    })

    this._downloadProgress = (total.toFixed(2) * 1)
    if (this.onDownloadProgress) {
      this.onDownloadProgress(this._downloadProgress)
    }
  }

  /**
   * playlistRefreshed - Callback fired when the playlist is refresh
   */
  playlistRefreshed() {
    Manson.trace('playlist refreshed')
    let segments = []
    if (this.lastSegmentID) {
      segments = this.playlist.segments.filter(s => s.id > this.lastSegmentID)
    }

    if (segments.length > 0) {
      this.fetch(segments)
    }
  }


  /**
   * start - Begins fetching segments in a playlist sequentially
   * If a playlist is of type LIVE or EVENT it will periodically refresh the playlist
   * and fetch all segments appended to it
   *
   * @return {Promise} A promise of the fetch routine
   */
  async start() {
    Manson.trace('beginning segments fetch loop...')
    if (!this.playlist) { throw 'Player Misconfigured: Missing playlist' }
    if (this.playlist.type === 'LIVE' || this.playlist.type === 'EVENT') {
      this.playlist.startAutoRefresh(this.playlistRefreshed)
    }

    return this.fetch(this.playlist.segments)
  }

  async fetch(segments) {
    for (let segment of segments) {
      if (segment.id <= this.lastSegmentID) {
        continue
      }

      Manson.debug(`fetching segment #${segment.id}`)
      this.lastSegmentID = segment.id
      const segmentData = await segment.fetch()
      this.segmentFetchedCallback(segmentData)
    }
  }

}

export default HLSController
