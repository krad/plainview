const test    = require('tape')
const resolve = require('url').resolve
import plainview from '../src/plainview'

test('that we have access to a browser objects', t=>{
  t.ok(window)
  t.ok(document)
  t.ok(window.MediaSource)
  t.end()
})

test('constructing a plainview object', t=> {

  const url    = resolve(location.href, '/apple-basic-ts/gear1/prog_index.m3u8')
  const config = { url: url }

  const p = new plainview(config)
  t.ok(p,                     'got the object back, of course')
  t.ok(p.onCanPlay,           'has a onCanPlay property for callbacks')
  t.ok(p.onPlayProgress,      'has a onPlayProgress property for callbacks')
  t.ok(p.onDownloadProgress,  'has a onDownloadProgress property for callbacks')
  t.ok(p.onPlay,              'has a onPlay property for callbacks')
  t.ok(p.onPause,             'has a onPause property for callbacks')
  t.ok(p.onReplay,            'has a onReplay property for callbacks')
  t.ok(p.onMute,              'has a onMute property for callbacks')
  t.ok(p.onUnmute,            'has a onUnmute property for callbacks')
  t.ok(p.onEnded,             'has a onEnded property for callbacks')
  t.ok(p.onStall,             'has a onStall property for callbacks')
  t.ok(p.onError,             'has a onError property for callbacks')

  t.end()
})
