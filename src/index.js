/**
*  @file plainview - a suite of tools for parsing m3u8 and mp4 files.
*  @author krad.io <iam@krad.io>
*  @version 0.0.2
 */
var playlist = require('./playlist')
var atoms    = require('./atoms')
var bofh     = require('./bofh')

function Plainview() { }

Plainview.prototype.setup = function(player, playlist, options) {
  if (player) {
    if (playlist) {
    } else {
      throw 'Please specify a playlist url'      
    }
  } else {
      throw 'Please set a video tag'
  }
}

module.exports = {
  Plainview: Plainview
}
