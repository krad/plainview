const test    = require('tape')
const resolve = require('url').resolve
import StreamController from '../src/stream-controller'

test('that we can start a stream and feed downloads to the mse', t=> {
  t.plan(24)

  const url    = resolve(location.href, '/basic/krad.tv/tractor/vod.m3u8')
  const config = { url: url }

  const stream  = new StreamController(config)
  t.ok(stream.hls,      'has an hls controller')
  t.notOk(stream.mse,   'does not have a mse controller yet')

  const video = document.createElement('video')

  stream.segmentConsumedCB = () => {
    video.play()
    t.ok(1, 'Got segment consumed notification')
  }

  stream.start(video)
  .then(_ => {
    console.log('hello');
    t.ok(1, 'Streamed the video')
  }).catch(err => {
    t.fail('Stream failed to start')
    console.log(err);
  })

})

test('that we can start a stream, transmux it and feed results to the mse', t=> {
  t.plan(30)

  const url    = resolve(location.href, '/apple-basic-ts/gear1/prog_index.m3u8')
  const config = { url: url }

  const stream  = new StreamController(config)
  t.ok(stream.hls,      'has an hls controller')
  t.notOk(stream.mse,   'does not have a mse controller yet')

  const video = document.createElement('video')
  // document.body.appendChild(video)

  stream.segmentConsumedCB = () => {
    // video.play()
    t.ok(1, 'Got segment consumed notification')
  }

  stream.start(video).then(_ => {})
  .catch(err => {
    t.fail('Stream failed to start')
    console.log(err);
  })

})
