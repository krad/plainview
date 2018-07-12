/**
*  @file playlist_fetcher - Fetches segments in an HLS playlist.
*  @author krad.io <iam@krad.io>
*  @version 0.0.3
 */

 var bofh       = require('./bofh')
 var playlist   = require('./playlist')
 var atomParser = require('./atoms')

class PlaylistFetcher {

  constructor(url) {
    this.url   = url
    this._bofh = new bofh.BOFH()
  }

  /**
   * fetchPlayslist - Returns a promise that returns a parsed playlist
   *
   * @return {Promise<Playlist>} Will attempt to fetch the playlist and parse it's contents
   */
  fetchPlaylist() {
    return new Promise((resolve, reject) => {

      this._bofh.get(this.url).then(data => {
        return decodeData(data)
      })
      .then(playlistStr => {
        var parsedPlaylist = playlist(playlistStr, buildSourceURL(this.url))
        if (parsedPlaylist.info) {
          this.playlist = parsedPlaylist
          resolve(this.playlist)
        } else {
          reject('Could not parse playlist')
        }
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  fetchItem(item) {
    if (typeof item == 'object') {
      if (item.hasOwnProperty('url')) {
        return this._bofh.get(item.url)
      }
    } else {
      return this._bofh.get(item)
    }
    return null
  }

  /**
   * makeSegmentFetchIterator - Returns an iterator that returns Promises for fetching each segment in a playlist
   *
   * @return {Iterator<Promise>} An iterator that returns sequential fetch promises for segments in a playlist
   */
  makeSegmentFetchIterator() {
    if (this.playlist) {
      const iterator = this.playlist.segmentIterator()
      return {
        next: () => {
          const nextSegment = iterator.next()
          if (nextSegment) {
            return new Promise((resolve, reject) => {
              this.fetchItem(nextSegment).then(data => {
                if (nextSegment.isIndex) {
                  const atom = parseAtom(data)
                  resolve(atom)
                } else {
                  resolve({payload: data})
                }
              }).catch(err => {
                reject(err)
              })
            })
          }
        }
      }
    }
    return null
  }

}

const decodeData = (data) => {
  return new Promise((resolve, reject) => {
    const decoder     = new TextDecoder()
    const playlistStr = decoder.decode(data)
    resolve(playlistStr)
  })
}

const buildSourceURL = (itemURL) => {
  var srcURL
  if (itemURL.endsWith('m3u8')) {
    var urlComps    = itemURL.split('/')
    var compsStrips = urlComps.slice(2, urlComps.length-1)
    var hostAndPath = compsStrips.join('/')
    srcURL          = urlComps[0] + '//' + hostAndPath
  }
  return srcURL
}


const parseAtom = (segmentData) => {
  var uint8buffer = new Uint8Array(segmentData)
  var atom        = atomParser(uint8buffer)
  atom.payload    = uint8buffer
  return atom
}

module.exports = PlaylistFetcher
