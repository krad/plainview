var INFO_MATCH_PATTERNS = {
  targetDuration: new RegExp(/#EXT-X-TARGETDURATION:(\d+)/),
  version: new RegExp(/#EXT-X-VERSION:(\d+)/),
  mediaSequenceNumber: new RegExp(/#EXT-X-MEDIA_SEQUENCE:(\d+)/),
  type: new RegExp(/#EXT-X-PLAYLIST-TYPE:(\w+)/),
}

var SEGMENT_MATCH_PATTERNS = {
  index: new RegExp(/#EXT-X-MAP:URI="(.+)"/),
  segment: new RegExp(/^(\w+\.mp4)/),
  duration: new RegExp(/#EXTINF:(.+)/),
}

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

var getSegmentsFrom = function(lines) {
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

            if (property == 'index') {
              result.push({url: matches[1], isIndex: true})
            }

            if (property == 'segment') {
              var segment = {url: matches[1], isIndex: false}
              if (lastDuration) {
                var parsedDuration = parseFloat(lastDuration)
                if (!parsedDuration.isNaN) { segment['duration'] = parsedDuration }
              }
              result.push(segment)
            }

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

var setSegmentsFor = function(result, lines) {
  var segments = getSegmentsFrom(lines)
  if (segments) { result['segments'] = segments }
}

module.exports = function parseM3U8(text) {
  if (!text) throw Error('Missing playlist text')
  var result = {}

  var lines = text.split("\n")
  setInfoFor(result, lines)
  setSegmentsFor(result, lines)

  return result
}
