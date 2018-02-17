var test   = require('tape')
var player = require('../src/player')
var vth    = require('../src/video_tag_helpers')

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

test('that we we can configure a player', t => {
  document.body.innerHTML = html
  t.plan(9)
  const p = new player('/vod.m3u8')
  t.ok(p,                             'created a player')
  t.notOk(p._segmentIterator,         'segmentIterator was not present')
  t.notOk(p.mediaSource,              'mediaSource was not present')
  t.equals(p._segmentQueue.length, 0, 'segment queue was empty')

  t.timeoutAfter(1000)

  p.configure()
  .then(result => {
    t.ok(p._segmentIterator, 'segmentIterator was present')
    t.ok(p.codecs, 'player had codec information')
    t.equals(p.codecs, 'video/mp4; codecs="avc1.42001E,mp4a.40.2"', 'player had correct codec information')
    t.notOk(p.mediaSource, 'Should not have had mediaSource')
    t.equals(p._segmentQueue.length, 1, 'segment queue had the first media segment present')
  }).catch(err => {
    t.fail('Failed to configure the player', err)
  })

})
