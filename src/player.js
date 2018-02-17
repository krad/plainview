var playlistFetcher = require('./playlist_fetcher')
var support         = require('./support')

class Player {
  constructor(playlistURL) {
    this.playlistURL   = playlistURL
    this._fetcher      = new playlistFetcher(playlistURL)
    this._support      = new support()
    this._segmentQueue = []
  }

  configure() {
    return new Promise((resolve, reject) => {
      this._fetcher.fetchPlaylist()
      .then(playlist => {
        this.duration = playlist.info.duration

        // Make a segment iterator from the playlist and fetch the first segment
        this._segmentIterator = this._fetcher.makeSegmentFetchIterator()
        if (this._segmentIterator) { return this._segmentIterator.next() }
        else { reject('Could not make iterator from playlist') }

      }).then(firstAtom => {
        // Get the codec information from the first segment
        if (firstAtom.codecsString) {
          // Check if we support this codec
          if (this._support.canSupport(firstAtom.codecsString)) {
            // Save state.  This is as far as we go when configuring
            this.codecs = firstAtom.codecsString
            this._segmentQueue.push(firstAtom)
            resolve(this.codecs)
          } else {
            reject('Codec not supported.')
          }

        } else {
          reject('Segment had no codec information')
        }

      }).catch(err => {
        reject(err)
      })
    })
  }

  createMediaSource(AVElement) {
    this.mediaSource = new MediaSource()

    this.mediaSource.addEventListener('sourceopen', e => {
      this.mediaSource.duration = this.duration

      const sourceBuffer = this.mediaSource.addSourceBuffer(this.codecs);
      sourceBuffer.addEventListener('updateend', x => {
        console.log('sourceBuffer updatedend');
        const fetchNextSegment = this._segmentIterator.next()
        if (fetchNextSegment) {
          fetchNextSegment
          .then(data => {
            sourceBuffer.appendBuffer(data.payload)
          })
          .catch(err => {
            console.log('Err fetching segment');
          })
        }
      })
      sourceBuffer.appendBuffer(this._segmentQueue.shift().payload)
    })

    this.mediaSource.addEventListener('onsourceclose', e => {
      console.log('onsourceclode');
    })

    this.mediaSource.addEventListener('onsourceended', e => {
      console.log('onsourceended');
    })
    AVElement.src = window.URL.createObjectURL(this.mediaSource);
  }

}

module.exports = Player
