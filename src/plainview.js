/**
*  @file plainview - a suite of tools for parsing m3u8 and mp4 files.
*  @author krad.io <iam@krad.io>
*  @version 0.0.3
 */
var playlist        = require('./playlist')
var atomPaser       = require('./atoms')
var bofh            = require('./bofh')
var playerTemplate  = require('./player_template')
var playlistFetcher = require('./playlist_fetcher')

function Plainview(playerID) {
  if (playerID) {
    getPlaylistURLFromMediaTag(this, playerID)
    skinPlayer(this, playerID)
  }
  this._bofh = new bofh.BOFH()
}

function getPlaylistURLFromMediaTag(plainview, playerID) {
  var player = document.getElementById(playerID)
  if (player) {
    plainview.player = player
    if (player.childNodes) {
      for (var i = 0; i < player.childNodes.length; i++) {
        var childNode = plainview.player.childNodes[i]
        if (childNode.type && childNode.src) {
          if (childNode.type == 'application/x-mpegURL' || childNode.type == 'vnd.apple.mpegURL') {
            plainview.playlistURL = childNode.src
            plainview.fetcher     = new playlistFetcher(plainview.playlistURL)
          }
        }
      }
    }
  }
}

function skinPlayer(plainview, playerID) {
  if (plainview.player) {
    if (plainview.player.poster) {
      var posterURL = 'url(' + plainview.player.poster + ') no-repeat'
      plainview.player.setAttribute('background', posterURL)
      plainview.player.removeAttribute('poster')
    }

    // Remove native controls
    plainview.player.controls = false

    // Insert HTML for our controls
    plainview.player.insertAdjacentHTML('afterend', playerTemplate)
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
 * fetchAndParseSegment - Fetches a media segment from a URL and runs it through the atom parser
 *
 * @param  {BOFH} client Client used to make the GET request through
 * @param  {String} url  URL of the media segment
 * @param  {Function} cb Callback used on complete.  Contains Uint8Array, parsed atom, error
 */
function fetchAndParseSegment(client, url, cb) {
  // console.log("Fetching: ", url)
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
  if (this.fetcher) {
    this.fetcher.start(function(err) {
      cb(err)
    })
    return
  }

  cb('Could not fetch playlist')
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
    loadNextSegment(pv, function(e) {
      if (!e) {
        cb(null);
        startPlaying(pv);
      } else {
        console.log('failed in recursive play');
      }
    })

  } else { cb('MediaSource not present') }
}

function loadNextSegment(pv, cb) {
  console.log('Loading next segment...');
  var next = nextSegment(pv)
  if (next) {
    var nextIdx = next[0]
    var segment = next[1]
    fetchAndParseSegment(pv._bofh, segment.url, function(payload, atom, err) {
      if (err) { cb(err); return }

      var buffer = new Uint8Array(payload)
      console.log(pv.player.error);
      pv.mediaSource.sourceBuffers[0].appendBuffer(buffer)
      pv.currentSegmentIndex = nextIdx
      cb(null)
    })
  } else {
    console.log('No next segment.');
  }
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
