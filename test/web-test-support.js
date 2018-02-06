var test      = require('tape')
var support   = require('../src/support')
var plainview = require('../src/plainview')

var html = `
<html>
  <body>
    <video id='player'>
      <source src="/vod.m3u8" type="application/x-mpegURL">
    </video>
  </body>
</html>
`

document.body.innerHTML = html
var pv = new plainview.Plainview('player')


test('that we can get a list of a/v codecs a browser could support', t=>{
  t.plan(7)

  var s = new support()
  t.ok(s, 'support object created')
  t.ok(s.codecs, 'codecs list present')
  t.equals(s.codecs.length, 16, 'correct amount of codecs')

  t.ok(s.videoCodecs, 'list of video codecs present')
  t.ok(s.audioCodecs, 'list of audio codecs present')

  t.equals(s.videoCodecs.length, 8, 'correct number of video codecs present')
  t.equals(s.audioCodecs.length, 2, 'correct number of audio codecs present')
  console.log(s.codecs);
})

test('that we can check if a browser has native HLS support', t=> {
  t.plan(6)

  t.ok(pv, 'was able to create a plainview object')
  t.ok(pv.player, 'found the player tag')
  t.ok(pv.playlistURL, 'found the playlistURL')

  var s = new support()
  t.ok(s, 'support object created')

  var check = s.hasNativeSupportFor(pv.player)
  t.equals(false, check, 'Chrome does NOT have native HLS support')

  var fakePlayer = {}
  fakePlayer.canPlayType = function(type) {
    if (type == 'application/vnd.apple.mpegurl' || type == 'vnd.apple.mpegURL') {
      return true
    }
    return false
  }

  check = s.hasNativeSupportFor(fakePlayer)
  t.ok(check, 'it supports our fake player')

})

test('that we can check if a browser supports different a/v combos', t=> {
  var s           = new support
  var codecs      = s.codecs
  var videoCodecs = s.videoCodecs
  var audioCodecs = s.audioCodecs

  t.plan(2 + codecs.length + videoCodecs.length + audioCodecs.length)

  t.ok(pv, 'plainview object present')
  t.ok(pv.player, 'found the player tag')

  for (var i = 0; i < codecs.length; i++) {
    var codec = codecs[i]
    var check = s.canSupport(codec)
    t.ok(check, 'can support ' + codec)
  }

  for (var i = 0; i < videoCodecs.length; i++) {
    var codec = videoCodecs[i]
    var check = s.canSupport(codec)
    t.ok(check, 'can support ' + codec)
  }

  for (var i = 0; i < audioCodecs.length; i++) {
    var codec = audioCodecs[i]
    var check = s.canSupport(codec)
    t.ok(check, 'can support ' + codec)
  }

})

test('that we can build a support matrix object', t=> {
  t.plan(5)
  var s = new support
  var supportMatrix = s.supportMatrix
  t.ok(supportMatrix, 'supportMatrix present')

  // t.ok(supportMatrix.hasOwnProperty('audio/video'), 'has audio/video property')
  t.ok(supportMatrix.hasOwnProperty('audio'), 'has audio property')
  t.ok(supportMatrix.hasOwnProperty('video'), 'has video property')

  // t.ok(supportMatrix['audio/video'], 'audio/video was present')
  t.ok(supportMatrix['audio'], 'audio was present')
  t.ok(supportMatrix['video'], 'video was present')

  console.log(supportMatrix);

})
