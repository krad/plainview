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

test('that we can feed media samples to an open source', t=> {
  t.plan(24)
  t.timeoutAfter(10000)

  const url       = resolve(location.href, '/basic/krad.tv/tractor/vod.m3u8')
  const config    = { url: url }
  const mimeCodec = 'video/mp4; codecs="avc1.42001E,mp4a.40.2"'

  let segments               = []
  const hls                  = new HLSController(config)
  hls.segmentFetchedCallback = (segment) => { segments.push(segment) }

  const mse   = new MSEController(mimeCodec)
  const video = document.createElement('video')

  hls.configure()
  .then(_ => hls.start())
  .then(_ => {
    return mse.setVideo(video)
  }).then(_ => {
    t.ok(1, 'Got on source open callback')
    t.equals(22, segments.length, 'stored all the segments')

    return new Promise((resolve, reject) => {
      const loop = () => {
        const segment = segments.shift()
        if (segment) {
          t.ok(segment, 'got next segment')
          /// video.play() // <- Uncommenting this an tapping on the browser when it's run shows that this works
          mse.appendBuffer(segment).then(loop)
        } else {
          resolve()
        }
      }
      loop()
    })

  }).then(_ => {
    console.log('At the end');
    mse.endOfStream()
  }).catch(err => {
    t.fail('Failed to fetch segments')
    console.log(err);
  })

})
