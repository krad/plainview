/**
*  @file playlist - HLS playlist parser
*  @author krad.io <iam@krad.io>
*  @version 0.0.3
*/
const url = require('url');

/**
 * Dictionary with RegExp objects used for finding stream info
 * duration, version, type, etc
 */
var INFO_MATCH_PATTERNS = {
  targetDuration: new RegExp(/#EXT-X-TARGETDURATION:(\d+)/),
  version: new RegExp(/#EXT-X-VERSION:(\d+)/),
  mediaSequenceNumber: new RegExp(/#EXT-X-MEDIA_SEQUENCE:(\d+)/),
  type: new RegExp(/#EXT-X-PLAYLIST-TYPE:(\w+)/),
}

/**
 * Ditionary with RegExp objects used for finding segment info
 */
var SEGMENT_MATCH_PATTERNS = {
  index: new RegExp(/#EXT-X-MAP:URI="(.+)"/),
  segment: new RegExp(/^(\w+\.mp4)/),
  duration: new RegExp(/#EXTINF:(.+)/),
}


/**
 * var getInfoFrom - Used to get parse info tags with playlist info
 *
 * @param  {Array<String>} lines An array with each of the lines in the playlist as entries
 * @return {Object} An object with each of the results keyed
 */
var getInfoFrom = function(lines) {
  var result
  for (var i = 0; i < lines.length; i++) {
    for (var property in INFO_MATCH_PATTERNS) {
      if (INFO_MATCH_PATTERNS.hasOwnProperty(property)) {
        var pattern = INFO_MATCH_PATTERNS[property]
        var matches = pattern.exec(lines[i])
        if (matches) {
          if (matches[1]) {
            if (!result) { result = {} }
            var intValue = parseInt(matches[1])
            if (isNaN(intValue)) {
              result[property] = matches[1]
            } else {
              result[property] = intValue
            }
          }
        }
      }
    }
  }
  return result
}

var setInfoFor = function(result, lines) {
  var info = getInfoFrom(lines)
  if (info) { result['info'] = info }
}

var getSegmentsFrom = function(lines, srcURL) {
  var result
  var lastDuration = ""
  for (var i = 0; i < lines.length; i++) {
    for (var property in SEGMENT_MATCH_PATTERNS) {
      if (SEGMENT_MATCH_PATTERNS.hasOwnProperty(property)) {
        var pattern = SEGMENT_MATCH_PATTERNS[property]
        var matches = pattern.exec(lines[i])
        if (matches) {

          if (matches[1]) {
            if (!result) { result = [] }

            /// If a srcURL is present we should prefix the segment urls with it
            var segmentURL
            if (srcURL && !srcURL.startsWith('/')) {
              if (!srcURL.endsWith('/')) {
                srcURL = srcURL += '/'
              }

              var fullPath = url.resolve(srcURL, matches[1])
              segmentURL   = fullPath
            }
            else { segmentURL = matches[1] }

            /// If it's a index/map segment
            if (property == 'index') {
              result.push({url: segmentURL, isIndex: true})
            }

            /// If it's a media segment
            if (property == 'segment') {
              var segment = {url: segmentURL, isIndex: false}
              if (lastDuration) {
                var parsedDuration = parseFloat(lastDuration)
                if (!parsedDuration.isNaN) { segment['duration'] = parsedDuration }
              }
              result.push(segment)
            }

            /// If this is a duration line, save it for the next loop
            if (property == 'duration') {
              lastDuration = matches[1]
            }
          }
        }
      }
    }
  }
  return result
}

var setSegmentsFor = function(result, lines, srcURL) {
  var segments = getSegmentsFrom(lines, srcURL)
  if (segments) { result['segments'] = segments }
}

/**
 * Playlist - An Object that represents an HLS playlist
 *
 * @param  {String} text   Contents of the HLS playlist
 * @param  {String} srcURL URL from where the playlist was fetched.  Will be prefixed onto segment urls
 * @return {Playlist}      Playlist object containing all the info about the playlist
 */
function Playlist(text, srcURL) {

  // Break up the playlist into an array of line entries
  var lines = text.split("\n")

  // Parse the info portion of the playlist
  setInfoFor(this, lines)

  // Parse the segment portion of the playlist
  setSegmentsFor(this, lines, srcURL)

  // Calculate the duration of the playlist
  if (this.segments && this.info) {
    this.info.duration = this.segments
    .filter(function(s) { if (!s.isIndex) { return s }})
    .map(function(s) { return s.duration })
    .reduce(function(a, c) { return a + c })
  }
}

/**
 * Playlist.prototype.segmentIterator - Builds an iterator object used for iterating over segment entries
 *
 * @param  {Number} startIndex This is optional.  Use if you want to start at a certain point in the array
 * @return {Object}            Returns a simple object with a `next` function.  Call next to get the next segment
 */
Playlist.prototype.segmentIterator = function(startIndex) {
  var nextIndex
  if (startIndex) { nextIndex = startIndex }
  else { nextIndex = 0 }

  var playlist = this
  if (!playlist.segments) { return null }

  return {
    next: function() {
      return nextIndex < playlist.segments.length ? playlist.segments[nextIndex++] : null
    }
  }
}

/**
 * parseM3U8 - Parses an HLS playlist
 *
 * @param  {String} text   The contents of the HLS playlist
 * @param  {String} srcURL The baseURL of the playlist.  Prefixed to each of the segment URLs
 * @return {Playlist}      An object representing the parsed contents of an HLS playlist
 */
module.exports = function parseM3U8(text, srcURL) {
  if (!text) throw Error('Missing playlist text')
  return new Playlist(text, srcURL)
}
