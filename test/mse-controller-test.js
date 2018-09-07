const test    = require('tape')
const resolve = require('url').resolve
import MSEController from '../src/mse-controller'
import HLSController from '../src/hls-controller'

test('that we can create a source', t=> {
  t.plan(7)
  t.timeoutAfter(4000)

  const mimeCodec = 'video/mp4; codecs="avc1.42001E,mp4a.40.2"'
  t.throws(() => { const m = new MSEController()}, 'threw error')
  t.doesNotThrow(() => { const m = new MSEController(mimeCodec) }, 'did not throw')

  const mse = new MSEController(mimeCodec)
  t.ok(mse.mediaSource,    'MediaSource was created')
  t.ok(mse.mediaSourceURL, 'URL was created for MediaSource')
  t.notOk(mse.video)

  const video = document.createElement('video')
  mse.setVideo(video, () => {
    t.ok(1, 'Got on source open callback thing')
    t.ok(mse.sourceBuffer, 'source buffer was created')
  })

})

test.only('that we can feed media samples to an open source', t=> {

  t.plan(25)

  const url       = resolve(location.href, '/basic/krad.tv/tractor/vod.m3u8')
  const config    = { url: url }
  const mimeCodec = 'video/mp4; codecs="avc1.42001E,mp4a.40.2"'

  const segments             = []
  const hls                  = new HLSController(config)
  hls.segmentFetchedCallback = (segment) => {
    segments.push(segment)
  }

  hls.configure()
  .then(_ => hls.fetchSegments())
  .then(_ => {

    const mse   = new MSEController(mimeCodec)
    const video = document.createElement('video')
    mse.setVideo(video, () => {
      t.ok(1, 'Got on source open callback thing')
      t.equals(22, segments.length, 'stored all the segments')
      const segment = segments.shift()
      t.ok(segment, 'segment was present')

      const feeder = () => {
        const segment = segments.shift()
        if (segment) {
          // video.play()
          mse.appendBuffer(segment, feeder)
        } else {
          mse.endOfStream()
        }
        t.ok(1, 'Source Buffer updated')
      }
      mse.appendBuffer(segment, feeder)
    })

  }).catch(_ => {
    t.fail('Failed to fetch segments')
  })

})
