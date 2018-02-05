/**
*  @file plainview - a suite of tools for parsing m3u8 and mp4 files.
*  @author krad.io <iam@krad.io>
*  @version 0.0.2
 */
var playlist  = require('./playlist')
var atomPaser = require('./atoms')
var bofh      = require('./bofh')

function Plainview(playerID) {
  if (playerID) { setupPlayer(this, playerID) }
  this._bofh = new bofh.BOFH()
}

function setupPlayer(plainview, playerID) {
  var player = document.getElementById(playerID)
  if (player) {
    plainview.player = player
    if (player.childNodes) {
      for (var i = 0; i < player.childNodes.length; i++) {
        var childNode = plainview.player.childNodes[i]
        if (childNode.type && childNode.src) {
          if (childNode.type == 'application/x-mpegURL' || childNode.type == 'vnd.apple.mpegURL') {
            plainview.playlistURL = childNode.src
          }
        }
      }
    }
  }
}

function createSourceBuffer(plainview, payload, segment, cb) {
  if (window.MediaSource) {
    if (segment.codecsString) {
      if (MediaSource.isTypeSupported(segment.codecsString)) {
        var ms = new MediaSource()
        if (plainview.player) {
          var codecs = segment.codecsString
          ms.addEventListener('sourceopen', function(e){
            _ = ms.addSourceBuffer(codecs)
            ms.sourceBuffers[0].appendBuffer(payload);
            plainview.mediaSource = ms
            cb(null)
          })
          plainview.player.src = window.URL.createObjectURL(ms)
          return
        }
      } else { cb('Media format not supported' + segment.codecsString) }
    } else { cb('Segment has no media codecs defined') }
  } else { cb('MediaSource not present') }
}


/**
 * fetchAndParsePlaylist - Fetches a m3u8 playlist from a url and parses it
 *
 * @param  {BOFH} client Client used to make the GET request through
 * @param  {String} url  URL of the media segment
 * @param  {Function} cb Callback used on complete.  Contains a parsedPlaylist and/or err
 */

function fetchAndParsePlaylist(client, url, cb) {
  client.get(url, function(res, err){
    if (!err) {
      var decoder         = new TextDecoder();
      var playlistStr     = decoder.decode(res)
      var parsedPlaylist  = playlist(playlistStr)
      if (parsedPlaylist.info) {
        cb(parsedPlaylist, null)
        return
      }
    }
    cb(null, err)
  })
}

/**
 * fetchAndParseSegment - Fetches a media segment from a URL and runs it through the atom parser
 *
 * @param  {BOFH} client Client used to make the GET request through
 * @param  {String} url  URL of the media segment
 * @param  {Function} cb Callback used on complete.  Contains Uint8Array, parsed atom, error
 */
function fetchAndParseSegment(client, url, cb) {
  client.get(url, function(res, err){
    if (!err) {
      var uint8buffer = new Uint8Array(res)
      var tree        = atomPaser(uint8buffer)
      cb(uint8buffer, tree, null)
      return
    }
    cb(null, null, err)
  })
}


Plainview.prototype.setup = function(cb) {
  var pv = this
  if (this.playlistURL) {
    fetchAndParsePlaylist(this._bofh, this.playlistURL, function(playlist, err){
      if (playlist) {
        pv.parsedPlaylist = playlist
        cb()
        return
      }

      cb(err)
    })
  }
}


/**
 * Plainview.prototype.configureMedia - Configures the player using media info form actual a/v stream
 * Does this by fetching the first init segment from a parsed playlist, parsing it's atoms, and
 * then creating a MediaSource and SourceBuffer based on it's codecs information.
 *
 * Appends the init segment to the source buffer on success and is ready for the actual data segments
 *
 * @param  {Function} cb Callback that gets executed when configureMedia is complete
 */
Plainview.prototype.configureMedia = function(cb) {
  var pv = this
  if (pv.parsedPlaylist) {
    if (pv.parsedPlaylist.segments) {
      var segments = pv.parsedPlaylist.segments.filter(function(s) { if(s.isIndex) { return s }})
      if (segments.length > 0) {
        var segment = segments[0]
        fetchAndParseSegment(pv._bofh, segment.url, function(payload, tree, err){
          if (err) {
            cb(err)
            return
          }

          createSourceBuffer(pv, payload, tree, function(err){
            pv.currentSegmentIndex = segments.indexOf(segment)
            cb(err)
          })
          return
        })
        return
      } else { cb('Initialization Segment not present') }
    } else { cb('Playlist has no segments') }
  } else { cb('Playlist not present') }
}

// TODO: Replace with iterator once we prove this works
function nextSegment(pv) {
  if (pv.parsedPlaylist) {
    if (pv.parsedPlaylist.segments) {
      if (typeof pv.currentSegmentIndex == 'number') {
        var nextIndex = pv.currentSegmentIndex + 1
        if (pv.parsedPlaylist.segments.length >= nextIndex) {
          return [nextIndex, pv.parsedPlaylist.segments[nextIndex]]
        }
      }
    }
  }

  return null
}

function startPlaying(pv, cb) {
  var ms = pv.mediaSource
  if (ms) {

    var next = nextSegment(pv)
    if (next) {
      var nextIdx = next[0]
      var segment = next[1]
      fetchAndParseSegment(pv._bofh, segment.url, function(payload, atom, err) {
        if (err) { cb(err); return }
        pv.currentSegmentIndex = nextIdx
        cb(null)
      })
    }

    pv.player.play()

  } else { cb('MediaSource not present') }
}

Plainview.prototype.play = function(cb) {
  if (this.mediaSource) {
    startPlaying(this, function(e){ cb(e) })
  } else {

    var pv = this
    pv.setup(function(err) {
      if (err) {
        cb(err)
        return
      }

      pv.configureMedia(function(err){
        if (err) {
          cb(err)
          return
        }

        startPlaying(pv, function(e){
          cb(e)
        })
        return
      })
    })
  }
}

exports.Plainview = Plainview
module.exports = {Plainview: Plainview}
