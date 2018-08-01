const support = require('./support')

import * as slugline from 'slugline/slugline'

class Player {
  static build(playlistURL) {
    player.playlistURL   = playlistURL
  }

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
        resolve(this)
      }).catch(err => {
        this.errors.push(err)
        reject('Failed to fetch playlist')
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

    this._downloadProgress = parseInt(total)
  }

  get totalDuration() {
    if (this.playlist) { return this.playlist.totalDuration }
    return undefined
  }

  nextFetchStarted(segment) {
    console.log('starting nextFetch');
  }

  segmentDownloadProgress(progress) {
    this.downloadProgress = progress
  }

  fetchSegments() {
    if (!this.playlist) { throw 'Player Misconfigured: Missing playlist' }
    console.log(this.playlist.segments.map(s => s.uri));

    let stats = {}
    this.playlist.segments.forEach(s => { stats[s.uri] = 0 })
    this.downloadStats = stats

    this.playlist.fetchSequentially(this.nextFetchStarted, this.segmentDownloadProgress)
  }

}

export default Player
