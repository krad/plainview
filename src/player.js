const support = require('./support')

import * as slugline from '@krad/slugline'
import Muxer from './muxer'

class Player {

  constructor(playlistURL) {
    this.playlistURL              = playlistURL
    this.errors                   = []
    this.nextFetchStarted         = this.nextFetchStarted.bind(this)
    this.nextFetchCompleted       = this.nextFetchCompleted.bind(this)
    this.segmentDownloadProgress  = this.segmentDownloadProgress.bind(this)
    this.playlistRefreshed        = this.playlistRefreshed.bind(this)
    this.segments                 = []
    this.muxer = new Muxer()
    this.cnt = 0
  }

  configure() {
    return new Promise((resolve, reject) => {
      slugline.Playlist.fetch(this.playlistURL).then(playlist => {
        this.playlist = playlist

        if (playlist.codecs) {
          resolve(this)
        } else {

          playlist.getCodecsInformation().then(codecs => {
            this.codecs = codecs
            resolve(this)
          }).catch(err => {
            reject(err)
          })
        }

      }).catch(err => {
        this.errors.push(err)
        reject(err)
      })
    })
  }

  get downloadProgress() {
    if (this.playlist) { return this._downloadProgress }
    return undefined
  }

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

  get totalDuration() {
    if (this.playlist) { return this.playlist.totalDuration }
    return undefined
  }

  nextFetchStarted(segment) {
    console.log('starting nextFetch', segment.id);
  }

  nextFetchCompleted(segment) {
    if (this.playlist.segmentsType === 'ts') {
      this.muxer.addJob(segment)
      this.muxer.processJob().then(res => {
        res.forEach(segment => this.segments.push(segment))
      }).catch(err => {
        console.log(err);
      })
    } else {
      this.segments.push(segment)
    }
  }

  playlistRefreshed() {
    // console.log('playlist refreshed');
  }

  segmentDownloadProgress(progress) {
    this.downloadProgress = progress
  }

  fetchSegments() {
    if (!this.playlist) { throw 'Player Misconfigured: Missing playlist' }

    if (this.playlist.segmentsType === 'ts') {
      this.segments.forEach(segment => {
        segment.process = async () => {
          return new Promise(async (resolve, reject) => {
            await segment.fetchPromise
            const ts = slugline.TransportStream.parse(segment.data)
            this.transmuxer.setCurrentStream(ts)
            let rs   = this.transmuxer.build()

            let result = []
            if (this.initSegment === undefined) {
              this.initSegment = this.transmuxer.buildInitializationSegment(rs[0])
              segment.init = this.initSegment
            }

            segment.body = this.transmuxer.buildMediaSegment(rs)
            resolve()
          })
        }
      })
    }
    let stats = {}
    this.playlist.segments.forEach(s => { stats[s.uri] = 0 })
    this.downloadStats = stats

    if (this.playlist.type === 'LIVE' || this.playlist.type === 'EVENT') {
      this.playlist.startAutoRefresh(this.playlistRefreshed)
    }

    this.playlist.fetchSequentially(this.nextFetchStarted, this.nextFetchCompleted, this.segmentDownloadProgress)
  }

}

export default Player
