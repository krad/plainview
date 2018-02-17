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
}

const decodePlaylist = (fetcher, data) => {
  var decoder         = new TextDecoder();
  var playlistStr     = decoder.decode(data)

  var srcURL
  if (fetcher.url.endsWith('m3u8')) {
    var urlComps    = fetcher.url.split('/')
    var compsStrips = urlComps.slice(2, urlComps.length-1)
    var hostAndPath = compsStrips.join('/')
    srcURL          = urlComps[0] + '//' + hostAndPath
  }

  var parsedPlaylist = playlist(playlistStr, srcURL)
  if (parsedPlaylist.info) {
    return parsedPlaylist
  }

  return null
}

const parseAtom = (segmentData) => {
  var uint8buffer = new Uint8Array(segmentData)
  var atom        = atomParser(uint8buffer)
  atom.payload    = uint8buffer
  return atom
}

PlaylistFetcher.prototype.start = (cb) => {
  var plf   = this
  var fetch = this._bofh.get(this.url)

  fetch.then(function(data){
    plf.parsedPlaylist = decodePlaylist(plf, data)
    cb(null)
  }).catch(function(err) {
    cb(err)
  })
}

PlaylistFetcher.prototype.fetch = (item) => {
  if (typeof item === 'object') {
    if (item.hasOwnProperty('url')) {
      return this._bofh.get(item.url)
    }
  } else {
    return this._bofh.get(item)
  }

  return null
}

PlaylistFetcher.prototype.segmentFetchIterator = () => {
  if (this.parsedPlaylist) {
    var fetcher  = this
    var iterator = fetcher.parsedPlaylist.segmentIterator()
    return {
      next: function() {
        var nextSegment = iterator.next()
        if (nextSegment) {
          return new Promise((resolve, reject) => {
            fetcher.fetch(nextSegment).then(function(segmentData){
              if (nextSegment.isIndex) {
                var parsedAtom = parseAtom(segmentData)
                resolve(parsedAtom)
              } else {
                resolve({payload: segmentData})
              }
            }).catch(function(err){
              reject(err)
            })
          })
        }
      }
    }
  }

  return null
}

module.exports = PlaylistFetcher
