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

function createSourceBuffer(plainview, segment, cb) {
  if (window.MediaSource) {
    if (segment.codecsString) {
      if (MediaSource.isTypeSupported(segment.codecsString)) {
        var ms = new MediaSource()
        if (plainview.player) {
          var codecs = segment.codecsString
          ms.addEventListener('sourceopen', function(e){
            plainview.sourceBuffer = ms.addSourceBuffer(codecs)
            cb(null)
          })
          plainview.player.src = window.URL.createObjectURL(ms)
          return
        }
      } else { cb('Media format not supported' + segment.codecsString) }
    } else { cb('Segment has no media codecs defined') }
  } else { cb('MediaSource not present') }
}

function fetchAndParsePlaylist(client, url, cb) {
  client.get(url, function(res, err){
    if (!err) {
      var decoder         = new TextDecoder();
      var playlistStr     = decoder.decode(res)
      var parsedPlaylist  = playlist(playlistStr)
      if (parsedPlaylist.info) {
        cb(parsedPlaylist)
        return
      }
    }
    cb(null, err)
  })
}

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

Plainview.prototype.configureMedia = function(cb) {
  var pv = this
  if (pv.parsedPlaylist) {
    if (pv.parsedPlaylist.segments) {
      var segments = pv.parsedPlaylist.segments.filter(function(s) { if(s.isIndex) { return s }})
      if (segments.length > 0) {
        var segment = segments[0]
        fetchAndParseSegment(pv._bofh, segment.url, function(_, tree, err){
          if (err) {
            cb(err)
            return
          }
          createSourceBuffer(pv, tree, function(err){
            cb(err)
          })
          return
        })
        return
      } else { cb('Init Segment not present') }
    } else { cb('Playlist has no segments') }
  } else { cb('Playlist not present') }
}

module.exports = {Plainview: Plainview}
