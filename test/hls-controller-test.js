const test    = require('tape')
const resolve = require('url').resolve
import HLSController from '../src/hls-controller'

test('fetching a playlist', t=> {
  t.plan(3)
  t.timeoutAfter(3000)

  const url    = resolve(location.href, '/apple-basic-ts/gear1/prog_index.m3u8')
  const config = { url: url }

  const hls = new HLSController(config)
  t.equals(config.url, hls.url, 'configured the url')
  hls.fetchPlaylist().then(playlist => {
    t.ok(playlist, 'fetched a playlist')
    t.equals(hls.playlist, playlist, 'hls controller assigned playlist property')
  }).catch(err => {
    t.fail('Failed to fetch playlist')
    console.log(err);
  })

})

test('configuring a controller without prior knowledge of playlist or codecs', t=> {
  t.plan(6)
  t.timeoutAfter(3000)

  const url    = resolve(location.href, '/apple-basic-ts/gear1/prog_index.m3u8')
  const config = { url: url }

  const hls = new HLSController(config)
  hls.configure().then(_ => {
    t.ok(hls.playlist,      'controller had a playlist configured')
    t.ok(hls.codecs,        'controller had codecs configured')
    t.ok(hls.codecsString,  'controller had a codecs string')
    t.deepEquals(hls.codecs, ['avc1.4D4015', 'mp4a.40.2'], 'correct codec information')
    t.equals(hls.codecsString, 'video/mp4; codecs="avc1.4D4015,mp4a.40.2"', 'got correct codec string')
    t.equals(hls.segmentsType, 'ts', 'correctly identified as ts segments in stream')
  }).catch(err => {
    t.failed('Failed to configure controller')
  })
})

test('configuring a controller with prior knowledge of codecs', t=> {
  t.plan(14)
  t.timeoutAfter(3000)

  const url    = resolve(location.href, '/apple-basic-ts/gear1/prog_index.m3u8')
  const config = {
    url: url,
    codecs: ['avc1.4D4015', 'mp4a.40.2']
  }

  const hls = new HLSController(config)
  t.ok(hls.codecs, 'has codecs information')
  t.ok(hls.codecsString, 'has codecsString information')
  t.deepEquals(hls.codecs,  ['avc1.4D4015','mp4a.40.2'], 'had correct codec information')
  t.equals(hls.codecsString, 'video/mp4; codecs="avc1.4D4015,mp4a.40.2"', 'produced correct codecs string')
  t.notOk(hls.segmentsType, 'we have no way of knowing what segment types we have yet')

  //// Test passing in a string
  const config2 = {
    url: url,
    codecs: '["avc1.4D4015","mp4a.40.2"]'
  }

  const hls2 = new HLSController(config2)
  t.ok(hls2.codecs, 'has codecs information')
  t.ok(hls2.codecsString, 'has codecsString information')
  t.deepEquals(hls2.codecs,  ['avc1.4D4015','mp4a.40.2'], 'had correct codec information')
  t.equals(hls2.codecsString, 'video/mp4; codecs="avc1.4D4015,mp4a.40.2"', 'produced correct codecs string')
  t.notOk(hls2.segmentsType, 'we have no way of knowing what segment types we have yet')

  const hls3 = new HLSController(config2)
  hls3.configure().then(_ => {
    t.ok(hls3.playlist,                            'fetched the playlist')
    t.deepEquals(hls3.codecs,   hls2.codecs,       'did not change codecs info')
    t.equals(hls3.codecsString, hls2.codecsString, 'did not change codecsString')
    t.equals(hls3.segmentsType, 'ts', 'we have no way of knowing what segment types we have yet')
  }).catch(err => {
    t.fail('Failed to configure controller')
    console.log(err);
  })
})

test('fetching segments from the playlist WITHOUT prior codec knowledge', t=> {
  t.plan(3)
  t.timeoutAfter(10000)

  const url    = resolve(location.href, '/basic/krad.tv/tractor/vod.m3u8')
  const config = { url: url }

  const hls                   = new HLSController(config)
  let fetchedSegmentCnt       = 0
  hls.segmentFetchedCallback  = (segment) => {
    fetchedSegmentCnt++
  }

  hls.configure()
  .then(_ => hls.start())
  .then(_ => {
    t.ok(1, 'got fetch segments completion callback')
    t.equals(22, fetchedSegmentCnt, 'got correct amount of segments back')
    t.equals(hls.segmentsType, 'fmp4', 'controller knows we are dealing with fmp4 segments')
  }).catch(err => {
    t.fail('Failed to fetch segments')
    console.log(err);
  })

})

test('fetching segments from the playlist WITH prior codec knowledge', t=> {
  t.plan(3)
  t.timeoutAfter(10000)

  const url    = resolve(location.href, '/basic/krad.tv/tractor/vod.m3u8')
  const config = {
    url: url,
    codecs: ['avc1.42001E','mp4a.40.2']
  }

  const hls             = new HLSController(config)
  let fetchedSegmentCnt = 0
  hls.segmentFetchedCallback = (segment) => { fetchedSegmentCnt++ }

  hls.configure()
  .then(_ => hls.start())
  .then(_ => {
    t.ok(1, 'got fetch segments completion callback')
    t.equals(22, fetchedSegmentCnt, 'got correct amount of segments back')
    t.equals(hls.segmentsType, 'fmp4', 'controller knows we are dealing with fmp4 segments')
  }).catch(err => {
    t.fail('Failed to fetch segmetns')
    console.log(err);
  })
})

// test('that we pass segment jobs ')

class MockMuxer {
  constructor() { }
}
