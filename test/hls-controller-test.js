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
  t.plan(5)
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
  }).catch(err => {
    t.failed('Failed to configure controller')
  })
})

test('configuring a controller with prior knowledge of codecs', t=> {
  t.plan(11)
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

  const hls3 = new HLSController(config2)
  hls3.configure().then(_ => {
    t.ok(hls3.playlist,                            'fetched the playlist')
    t.deepEquals(hls3.codecs,   hls2.codecs,       'did not change codecs info')
    t.equals(hls3.codecsString, hls2.codecsString, 'did not change codecsString')
  }).catch(err => {
    t.fail('Failed to configure controller')
    console.log(err);
  })

})
