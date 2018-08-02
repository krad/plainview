const support = require('./support')

import * as slugline from '@krad/slugline'

class Player {

  constructor(playlistURL) {
    this.playlistURL = playlistURL
    this.errors      = []
    this.nextFetchStarted           = this.nextFetchStarted.bind(this)
    this.segmentDownloadProgress    = this.segmentDownloadProgress.bind(this)
  }

  configure() {
    return new Promise((resolve, reject) => {
      slugline.Playlist.fetch(this.playlistURL).then(playlist => {
        this.playlist = playlist

        if (playlist.codecs) {
          resolve(this)
        } else {

          playlist.getCodecsInformation().then(codecs => {
            this.codecs = playlist.codecs
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
    // console.log('starting nextFetch');
  }

  segmentDownloadProgress(progress) {
    this.downloadProgress = progress
  }

  fetchSegments() {
    if (!this.playlist) { throw 'Player Misconfigured: Missing playlist' }

    let stats = {}
    this.playlist.segments.forEach(s => { stats[s.uri] = 0 })
    this.downloadStats = stats

    this.playlist.fetchSequentially(this.nextFetchStarted, this.segmentDownloadProgress)
  }

}

export default Player
