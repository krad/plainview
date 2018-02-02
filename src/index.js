/**
*  @file plainview - a suite of tools for parsing m3u8 and mp4 files.
*  @author krad.io <iam@krad.io>
*  @version 0.0.2
 */
var playlist = require('./playlist')
var atoms    = require('./atoms')
var bofh     = require('./bofh')

module.exports = {
  parseM3U8: playlist,
  parseAtoms: atoms
}
