var test      = require('tape')
var plainview = require('../src/index')

var html = `
<html>
  <body>
    <video id='player'>
      <source src="/vod.m3u8" type="application/x-mpegURL">
    </video>
  </body>
</html>
`

test('that we can setup the document contents', t=> {
  t.plan(2)
  t.notOk(document.getElementById('player'), 'document starts with no player')
  document.body.innerHTML = html
  t.ok(document.getElementById('player'), 'found the player')
})

var pv
test('that we can setup a plainview object', t=> {
  t.plan(7)
  document.body.innerHTML = html

  pv = new plainview.Plainview('player')
  t.ok(pv, 'was able to create an object')
  t.ok(pv.player, 'found the player tag')
  t.ok(pv.playlistURL, 'found the playlistURL')

  t.timeoutAfter(1000)
  t.notOk(pv.player.src, 'player did NOT have a source yet. good.')
  pv.setup(function(err){
    t.ok(1, 'player setup')
    t.notOk(err, 'no error produced.  good')
    t.ok(pv.parsedPlaylist, 'parsed playlist is present')
  })
})

test('that we can configureMedia', t=> {
  t.plan(6)

  t.ok(pv, 'plainview object present')
  t.ok(pv.player, 'player present')
  t.notOk(pv.player.src, 'player source not present')
  t.ok(pv.parsedPlaylist, 'parsed playlist is present')

  t.timeoutAfter(1000)
  pv.configureMedia(function(err){
    if (err) { t.fail("Error fetching segment") }
    t.ok('player started', 'got player callback')
    t.ok(pv.sourceBuffer, 'source buffer present')
  })
})
