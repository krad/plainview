const MPG_AUDIO_CODECS = {
  'mp4a.40.2': {name: 'AAC-LC', mimeType: 'audio/mp4'},
  'mp4a.40.5': {name: 'HE-AAC', mimeType: 'audio/mp4'},
  'mp4a.40.34': {name: 'MP3', mimeType: 'audio/mpeg'}
}

const MPG_VIDEO_CODECS = {
  'avc1.42001E': {name: 'H.264 Baseline Profile level 3.0', mimeType: 'video/mp4'},
  'avc1.42001F': {name: 'H.264 Baseline Profile level 3.1', mimeType: 'video/mp4'},
  'avc1.4D001E': {name: 'H.264 Main Profile level 3.0',     mimeType: 'video/mp4'},
  'avc1.4D001F': {name: 'H.264 Main Profile level 3.1',     mimeType: 'video/mp4'},
  'avc1.4D0028': {name: 'H.264 Main Profile level 4.0',     mimeType: 'video/mp4'},
  'avc1.64001F': {name: 'H.264 High Profile level 3.1',     mimeType: 'video/mp4'},
  'avc1.640028': {name: 'H.264 High Profile level 4.0',     mimeType: 'video/mp4'},
  'avc1.640029': {name: 'H.264 High Profile level 4.1',     mimeType: 'video/mp4'}
}

function AVSupport(){
  // Build a list of all MPG audio/video combos
  var audioVideoCodecs = Object.keys(MPG_VIDEO_CODECS).flatMap(function(v) {
     return Object.keys(MPG_AUDIO_CODECS).map(function(a) {
       return [v,a].join(',')
     })
   })

  this.codecs = audioVideoCodecs
}

AVSupport.prototype.hasNativeSupportFor = function(player) {
  var supportsNativeHLS = player.canPlayType('application/vnd.apple.mpegurl')
  if (supportsNativeHLS) {
    return true
  }

  supportsNativeHLS = player.canPlayType('vnd.apple.mpegURL')
  if (supportsNativeHLS) {
    return true
  }

  return false
}

module.exports = AVSupport
