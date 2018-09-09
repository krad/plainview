const test    = require('tape')
const resolve = require('url').resolve
import MSEController from '../src/mse-controller'
import HLSController from '../src/hls-controller'

test('that we can create a source', t=> {
  t.plan(7)
  t.timeoutAfter(4000)

  const mimeCodec = 'video/mp4; codecs="avc1.42001E,mp4a.40.2"'
  t.throws(() => { const m = new MSEController()}, 'MediaSource not available')
  t.doesNotThrow(() => { const m = new MSEController(mimeCodec) }, 'did not throw')

  const mse = new MSEController(mimeCodec)
  t.ok(mse.mediaSource,    'MediaSource was created')
  t.ok(mse.mediaSourceURL, 'URL was created for MediaSource')
  t.notOk(mse.video)

  const video = document.createElement('video')
  mse.setVideo(video)
  .then(_ => {
    t.ok(1, 'Got on source open callback thing')
    t.ok(mse.sourceBuffer, 'source buffer was created')
  }).catch(err => {
    t.fail('Failed to open source')
    console.log(err);
  })

})

test('that we can feed media samples to an open source', async t=> {
  t.plan(23)
  t.timeoutAfter(10000)

  const url       = resolve(location.href, '/basic/krad.tv/tractor/vod.m3u8')
  const config    = { url: url }
  const mimeCodec = 'video/mp4; codecs="avc1.42001E,mp4a.40.2"'

  let segments               = []
  const hls                  = new HLSController(config)
  hls.segmentFetchedCallback = (segment) => { segments.push(segment) }

  const mse   = new MSEController(mimeCodec)
  const video = document.createElement('video')

  await hls.configure()
  await hls.start()
  t.equals(22, segments.length, 'stored all the segments')

  await mse.setVideo(video)

  for (let segment of segments) {
    await mse.appendBuffer(segment)
    t.ok(segment, 'segment consumed')
  }

  mse.endOfStream()

})
