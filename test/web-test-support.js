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

test('that we can get a list of a/v codecs a browser could support', t=>{
  t.plan(3)

  var s = new support()
  t.ok(s, 'support object created')
  t.ok(s.codecs, 'codecs list present')
  t.equals(s.codecs.length, 24, 'correct amount of codecs')
  console.log(s.codecs);
})

test('that we can check if a browser has native HLS support', t=> {
  t.plan(6)

  var pv = new plainview.Plainview('player')
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
