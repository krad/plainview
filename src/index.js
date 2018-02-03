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

function createSourceBuffer(plainview) {
  if (window.MediaSource) {
    var ms = new MediaSource()
    if (plainview.player) {
      plainview.player.src   = window.URL.createObjectURL(ms)
      // plainview.sourceBuffer = ms.addSourceBuffer()
    }
  }
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
  client.get(url, function(ress, err){
    if (!err) {

    }
    cb(null, err)
  })
}

Plainview.prototype.setup = function(cb) {
  var pv = this
  if (this.playlistURL) {
    fetchAndParsePlaylist(this._bofh, this.playlistURL, function(playlist, err){
      if (playlist) {
        pv.parsedPlaylist = playlist
        createSourceBuffer(pv)
        cb()
        return
      }

      cb(err)
    })
  }
}

module.exports = {Plainview: Plainview}
