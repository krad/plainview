/**
*  @file plainview - a suite of tools for parsing m3u8 and mp4 files.
*  @author krad.io <iam@krad.io>
*  @version 0.0.3
 */
var playlist        = require('./playlist')
var atomPaser       = require('./atoms')
var bofh            = require('./bofh')
var playlistFetcher = require('./playlist_fetcher')
var skinner         = require('./skin')
var helpers         = require('./video_tag_helpers')

class Plainview {
  constructor(playerID) {
    this.player =
    // getPlaylistURLFromMediaTag(this, playerID)
    this.skinner = new skinner(playerID)
    this._bofh = new bofh.BOFH()
    this.segmentQueue = []
  }

}


// Plainview.prototype.play = function(cb) {
//   var pv = this
//   pv.setup().then(function(){
//     return pv.configureMedia()
//   }).then(function(ms){
//     var parsedPlaylist = pv.fetcher.parsedPlaylist
//     pv.skinner.addPlaylist(parsedPlaylist)
//     startPlaying(pv)
//     cb()
//   }).catch(function(err){
//     cb(err)
//   })
// }

module.exports = Plainview
