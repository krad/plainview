var playlistFetcher = require('./playlist_fetcher')
var support         = require('./support')

class Player {
  constructor(playlistURL) {
    this.playlistURL   = playlistURL
    this._fetcher      = new playlistFetcher(playlistURL)
    this._support      = new support()
    this._segmentQueue = []
  }

  configure(AVElement) {
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

          if (this._support.hasNativeHLSSupportFor(AVElement)) {
            this.codecs = firstAtom.codecsString
            this._segmentQueue.push(firstAtom)
            resolve(true)
            return
          }

          // Check if we support this codec
          if (this._support.canSupport(firstAtom.codecsString)) {
            // Save state.  This is as far as we go when configuring
            this.codecs = firstAtom.codecsString
            this._segmentQueue.push(firstAtom)
            resolve(true)
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

  play(AVElement) {
    if (this._support.hasNativeHLSSupportFor(AVElement)) {
      AVElement.play()
    } else {
      if (this.mediaSource) {
        AVElement.play()
        .then(_ => {
        }).catch(err => {
          console.log('MediaSourcePresent play error', err);
        })
      } else {
        this.createMediaSource(AVElement)
        .then(_ => {
          return AVElement.play()
        }).then(_ => { })
        .catch(err => {
          console.log('problem playing');
        })
      }
    }
  }

  pause(AVElement) {
    AVElement.pause()
  }

  createMediaSource(AVElement) {
    return new Promise((resolve, reject) => {
      this.mediaSource = new window.MediaSource()
      this.mediaSource.addEventListener('sourceopen', e => {
        this.mediaSource.duration = this.duration

        const sourceBuffer = this.mediaSource.addSourceBuffer(this.codecs);
        sourceBuffer.addEventListener('updateend', x => {
          const fetchNextSegment = this._segmentIterator.next()
          if (fetchNextSegment) {
            fetchNextSegment
            .then(data => {
              sourceBuffer.appendBuffer(data.payload)
            })
            .catch(err => {
              console.log('Err fetching segment');
            })
          } else {
            this.mediaSource.endOfStream();
          }
        })
        sourceBuffer.appendBuffer(this._segmentQueue.shift().payload)
      })
      AVElement.src = window.URL.createObjectURL(this.mediaSource);
      resolve()
    })
  }

}

module.exports = Player
