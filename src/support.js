const MPG_AUDIO_CODECS = {
  'mp4a.40.2': {name: 'AAC-LC', mimeType: 'audio/mp4'},
  'mp4a.40.5': {name: 'HE-AAC', mimeType: 'audio/mp4'},
  //'mp4a.40.34': {name: 'MP3', mimeType: 'audio/mpeg'}
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

function mimeTypeFor(codec) {
  if (codec.indexOf(',') >= 0) {
    var components = codec.split(',')
    var codecDict = MPG_VIDEO_CODECS[components[0]]
    if (codecDict) { return codecDict.mimeType }
  } else {
    var codecV = MPG_VIDEO_CODECS[codec]
    var codecA = MPG_AUDIO_CODECS[codec]
    if (codecV) { return codecV.mimeType }
    if (codecA) { return codecA.mimeType }
  }

  return null
}

function allAudioVideoCodecCombinations() {
  return Object.keys(MPG_VIDEO_CODECS).flatMap(function(v) {
     return Object.keys(MPG_AUDIO_CODECS).map(function(a) {
       return [v,a].join(',')
     })
   })
}


/**
 * buildCodecTypeString - Builds a string from a mimeType and a codec
 *
 * @param  {String} mimeType A string. Usually looks like video/mp4
 * @param  {String} codec    An RFC whatever string.  Looks like mp4a.40.2 usually
 * @return {String}          A string that looks like this: video/mp4; codecs="mp4a.40.2"
 */
function buildCodecTypeString(mimeType, codec) {
  return mimeType + '; codecs="' + codec + '"'
}


/**
 * checkSupportFor - Checks browser support for all the codecs!
 *
 * @param  {Object} codecsObject Something like the MPG_VIDEO_CODECS in this file
 * @return {Object}              Object with all the codec details and whether its supported
 */
function checkSupportFor(codecsObject) {
  var result
  var codecList = Object.keys(codecsObject)
  for (var i = 0; i < codecList.length; i++) {
    var codec            = codecList[i]
    var details          = codecsObject[codec]
    var type             = buildCodecTypeString(details.mimeType, codec)
    details['type']      = type
    var supported        = MediaSource.isTypeSupported(type)
    details['supported'] = supported

    if (!result) { result = [] }
    result.push(details)
  }
  return result
}

function buildSupportMatrix() {
  var result = {}
  // result['audio/video'] = checkSupportFor(allAudioVideoCodecCombinations())
  result['video']       = checkSupportFor(MPG_VIDEO_CODECS)
  result['audio']       = checkSupportFor(MPG_AUDIO_CODECS)
  return result
}


/**
 * AVSupport - Support object.  Used to deterine what your browser can / can not do
 *
 * @return {AVSupport}  AVSupport object populted with various codec support info
 */
function AVSupport(){
  this.codecs         = allAudioVideoCodecCombinations()
  this.videoCodecs    = Object.keys(MPG_VIDEO_CODECS)
  this.audioCodecs    = Object.keys(MPG_AUDIO_CODECS)
  this.supportMatrix  = buildSupportMatrix()
}


/**
 * AVSupport.prototype.hasNativeHLSSupportFor - Checks if the browser has native HLS support (Safari)
 *
 * @param  {MediaSource} player video tag thingie
 * @return {Booelan}        true if video tag can take an HLS playlist directly
 */
AVSupport.prototype.hasNativeHLSSupportFor = function(player) {
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

/**
 * AVSupport.prototype.canSupport - Checks if the browser supports playback for certain media types
 *
 * @param  {String} codec  A string describing a codec.  Ex: avc1.42E01E,mp4a.40.2
 * @return {Boolean}       true is it supports playback
 */
AVSupport.prototype.canSupport = function(codec) {
  var mimeType = mimeTypeFor(codec)

  var checkStr
  if (mimeType) { checkStr = buildCodecTypeString(mimeType, codec) }
  else { checkStr = codec }

  return MediaSource.isTypeSupported(checkStr)
}

module.exports = AVSupport
