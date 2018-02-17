var test    = require('tape')
var helpers = require('../src/video_tag_helpers')

var html = `
<html>
  <body>
    <video id='player'>
      <source src="https://krad.tv/vod.m3u8" type="application/x-mpegURL" />
      <source src="https://krad.tv/bunny.mp4" type='video/mp4' />
    </video>
  </body>
</html>
`

test('that we can parse the player out of an element', t => {
  document.body.innerHTML = html

  t.plan(1)
  var player = helpers.getPlayer('player')
  t.ok(player, 'got the player')
})

test('that we can parse the source of a player element', t => {
  document.body.innerHTML = html

  t.plan(2)
  var sources = helpers.getSourcesFromPlayerID('player')
  t.ok(sources, 'got sources')
  t.equals(sources.length, 2, 'got correct amount of sources')
})

test('that we can parse HLS sources of a player element', t => {
  document.body.innerHTML = html

  t.plan(2)
  var sources = helpers.getHLSSourcesFromPlayerID('player')
  t.ok(sources, 'got sources')
  t.equals(sources.length, 1, 'got correct amount of HLS sources')
})

test('that we can parse HLS urls of a player element', t => {
  document.body.innerHTML = html

  t.plan(3)
  var urls = helpers.getHLSURLsFromPlayerID('player')
  t.ok(urls, 'got urls')
  t.equals(urls.length, 1, 'got correct amount of HLS urls')
  t.equals(urls[0], 'https://krad.tv/vod.m3u8')
})
