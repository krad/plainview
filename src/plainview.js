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

function Plainview(playerID) {
  if (playerID) {
    getPlaylistURLFromMediaTag(this, playerID)
    this.skinner = new skinner(playerID)
    this._bofh = new bofh.BOFH()
    this.segmentQueue = []
  }
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

function createSourceBuffer(plainview, segment, cb) {
  if (window.MediaSource) {
    if (segment.codecsString) {
      if (MediaSource.isTypeSupported(segment.codecsString)) {
        var ms = new MediaSource()
        if (plainview.player) {
          var codecs = segment.codecsString

          player.addEventListener('timeupdate', function(e){
            plainview.skinner.update(e)
          }, false);

          ms.addEventListener('sourceopen', function(e){
            var sourceBuffer = ms.addSourceBuffer(codecs)

            sourceBuffer.addEventListener('updateend', function() {
              if (plainview.segmentQueue.length) {
                // console.log(plainview.player.videoHeight);
                // console.log(plainview.player.videoWidth);

                sourceBuffer.appendBuffer(plainview.segmentQueue.shift());
              }
            }, false)

            ms.sourceBuffers[0].appendBuffer(segment.payload);
            plainview.mediaSource = ms

            cb(ms, null)
          })
          plainview.player.src = window.URL.createObjectURL(ms)
          return
        }
      } else { cb(null, 'Media format not supported' + segment.codecsString) }
    } else { cb(null, 'Segment has no media codecs defined') }
  } else { cb(null, 'MediaSource not present') }
}

function primeForStreaming(plainview, cb) {
  if (plainview.fetcher) {
    plainview.fetcher.start(function(err) {
      if (!err) { plainview.segments = plainview.fetcher.segmentFetchIterator() }
      cb(err)
    })
  } else {
    cb('Could not fetch playlist')
  }
}

Plainview.prototype.setup = function() {
  var pv = this
  return new Promise((resolve, reject) => {
    primeForStreaming(pv, function(err){
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function fetchNextSegment(pv) {
  return new Promise((resolve, reject) => {
    if (pv.segments) {
      var nextSegmentFetch = pv.segments.next()
      nextSegmentFetch.then(function(atom){
        resolve(atom)
      }).catch(function(err){
        reject(err)
      })
    } else {
      reject('Segment iterator not present')
    }
  })
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
Plainview.prototype.configureMedia = function() {
  var pv = this
  return new Promise((resolve, reject) => {
    fetchNextSegment(pv).then(function(atom){
      createSourceBuffer(pv, atom, function(ms, err){
        resolve(ms)
      })
    }).catch(function(err){
      reject(err)
    })
  })
}

function startPlaying(pv) {
  var segmentFetch
  while (segmentFetch = pv.segments.next()) {
    segmentFetch.then(function(atom){
      var sourceBuffer = pv.mediaSource.sourceBuffers[0]
      if (sourceBuffer.updating) {
        pv.segmentQueue.push(atom.payload)
      } else {
        sourceBuffer.appendBuffer(atom.payload)
      }
    }).catch(function(err){
      console.log(err);
    })
  }
}

Plainview.prototype.play = function(cb) {
  var pv = this
  pv.setup().then(function(){
    return pv.configureMedia()
  }).then(function(ms){
    var parsedPlaylist = pv.fetcher.parsedPlaylist
    pv.skinner.addPlaylist(parsedPlaylist)
    startPlaying(pv)
    // pv.player.play()
    cb()
  }).catch(function(err){
    cb(err)
  })
}

module.exports = Plainview
