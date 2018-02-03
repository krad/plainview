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

test('that we can setup a plainview object', t=> {
  t.plan(6)
  document.body.innerHTML = html

  var pv = new plainview.Plainview('player')
  t.ok(pv, 'was able to create an object')
  t.ok(pv.player, 'found the player tag')
  t.ok(pv.playlistURL, 'found the playlistURL')
  t.ok('http://fake.host/vod.m3u8', pv.playlistURL, 'found the playlistURL')

  t.timeoutAfter(5000)
  pv.setup(function(err){
    t.ok(1, 'player setup')
    t.notOk(err, 'no error produced.  good')

    t.ok(pv.parsedPlaylist, 'parsed playlist is present')
  })

})
