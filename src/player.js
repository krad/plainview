const support = require('./support')

import * as slugline from '@krad/slugline'
import Manson from '@krad/manson'
import Muxer from './muxer'

class Player {

  constructor(playlistURL, codecs) {
    if (codecs) {
      try { this.codecs = JSON.parse(codecs) }
      catch (e) { this.codecs = undefined }
    }
    this.codecs                   = codecs
    this.playlistURL              = playlistURL
    this.nextFetchStarted         = this.nextFetchStarted.bind(this)
    this.nextFetchCompleted       = this.nextFetchCompleted.bind(this)
    this.segmentDownloadProgress  = this.segmentDownloadProgress.bind(this)
    this.playlistRefreshed        = this.playlistRefreshed.bind(this)
    this.segments                 = []
    this.muxer = new Muxer()
    this.cnt = 0
  }

  get codecsString() {
    return 'video/mp4; codecs="' + this.codecs.join(',') + '"'
  }

  configure() {
    Manson.debug('configuring player')
    return new Promise((resolve, reject) => {
      Manson.debug('fetching playlist')

      slugline.Playlist.fetch(this.playlistURL).then(playlist => {
        this.playlist = playlist

        if (playlist.codecs || this.codecs) {
          Manson.debug('playlist contained codecs information')
          resolve(this)
        } else {

          Manson.debug('fetching codecs information')
          playlist.getCodecsInformation().then(codecs => {
            this.codecs = codecs
            resolve(this)
          }).catch(err => {
            Manson.error('failed to fetch codecs information')
            reject(err)
          })
        }

      }).catch(err => {
        console.log(err);
        Manson.error('failed to fetch playlist')
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
    Manson.debug(`fetching segment #${segment.id} - ${segment.url}`)
  }

  nextFetchCompleted(segment) {
    Manson.info(`fetched segment #${segment.id} - ${segment.url}`)
    if (this.playlist.segmentsType === 'ts') {
      this.muxer.addJob(segment)
      this.muxer.processJob().then(res => {
        res.forEach(segment => this.segments.push(segment))
      }).catch(err => {
        Manson.error(`Error transcoding ${err}`)
      })
    } else {
      this.segments.push(segment)
    }
  }

  playlistRefreshed() {
    Manson.trace('refreshed playlist')
  }

  segmentDownloadProgress(progress) {
    this.downloadProgress = progress
  }

  fetchSegments() {
    Manson.info('beginning segments fetch loo')
    if (!this.playlist) { throw 'Player Misconfigured: Missing playlist' }
    let stats = {}
    this.playlist.segments.forEach(s => { stats[s.uri] = 0 })
    this.downloadStats = stats

    if (this.playlist.type === 'LIVE' || this.playlist.type === 'EVENT') {
      this.playlist.startAutoRefresh(this.playlistRefreshed)
    }

    return this.playlist.fetchSequentially(this.nextFetchStarted, this.nextFetchCompleted, this.segmentDownloadProgress)
  }

}

export default Player
