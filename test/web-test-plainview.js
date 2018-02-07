var test      = require('tape')
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

test('that we can setup the document contents', t=> {
  t.plan(1)
  t.ok(document.getElementById('player'), 'found the player')
})

var pv
test('that we can setup a plainview object', t=> {
  t.plan(10)

  pv = new plainview('player')
  t.ok(pv, 'was able to create an object')
  t.ok(pv.player, 'found the player tag')
  t.ok(pv.playlistURL, 'found the playlistURL')

  t.timeoutAfter(1000)
  t.notOk(pv.player.src, 'player did NOT have a source yet. good.')

  var setupPromise = pv.setup()

  setupPromise.then(function(){
    t.ok(1, 'player setup')
    t.ok(pv.fetcher, 'playlist fetcher is present')
    t.ok(pv.fetcher.parsedPlaylist, 'parsed playlist is present')
    t.ok(pv.playlistURL.startsWith('http://localhost'), 'playlist url has the host and proto prefixed on it')

    var segments = pv.fetcher.parsedPlaylist.segments
    t.ok(segments, 'segments were present in playlist')

    var urlCheck = new RegExp(/http:\/\/localhost:(\d+)\/fileSeq/)
    t.ok(segments[0].url.match(urlCheck), 'segment url had host and proto prefixed')

  }).catch(function(err){
    t.fail('setup failed')
    console.log(err);
  })

})

test('that we can configureMedia', t=> {
  t.plan(7)

  t.ok(pv, 'plainview object present')
  t.ok(pv.player, 'player present')
  t.notOk(pv.player.src, 'player source not present')
  t.ok(pv.fetcher, 'playlist fetcher present')
  t.ok(pv.fetcher.parsedPlaylist, 'parsed playlist is present')

  t.timeoutAfter(1000)

  var configurePromise = pv.configureMedia()

  configurePromise.then(function(e){
    t.ok('player started', 'got player callback')
    t.ok(pv.mediaSource, 'mediaSource present')
  }).catch(function(err){
    t.fail('configureMedia failed')
    console.log(err);
  })

})

test('that we can play', t=> {
  t.plan(6)
  document.body.innerHTML = html

  var pvv = new plainview('player')
  t.ok(pvv, 'was able to create an object')
  t.ok(pvv.player, 'found the player tag')
  t.ok(pvv.playlistURL, 'found the playlistURL')
  t.notOk(pvv.player.src, 'player did NOT have a source yet. good.')

  t.timeoutAfter(2000)
  pvv.play(function(err){
    t.notOk(err, 'there was an error')
    t.ok(1, 'we started playing')
  })

})
