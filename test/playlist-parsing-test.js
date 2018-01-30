var test      = require('tape')
var fs        = require('fs')
var plainview = require('../')

test('test that we can test', t=> {
  t.plan(1)
  t.ok(1)
})

test('that we can parse a m3u8 playlist', t=> {
  t.plan(16)
  var mock = fs.readFileSync('./test/vod.m3u8').toString()
  var parsed = plainview.parseM3U8(mock)
  t.ok(parsed, 'parsed mock')

  t.ok(parsed.hasOwnProperty('info'), 'has playlist info')
  t.equals(parsed['info']['targetDuration'], 6, 'target duration correct')
  t.equals(parsed['info']['version'], 7, 'hls version correct')
  t.equals(parsed['info']['mediaSequenceNumber'], 1, 'media seq num correct')
  t.equals(parsed['info']['type'], "VOD", 'playlist type correct')

  t.ok(parsed.hasOwnProperty('segments'), 'has segments')
  t.ok(Array.isArray(parsed.segments), 'segments is array')
  t.equals(parsed.segments.length, 6, 'segment count is correct')

  t.equals(true, parsed.segments[0].isIndex, 'first segment is index')
  t.equals(false, parsed.segments[1].isIndex, 'second segment is NOT index')

  t.equal(6.039592488, parsed.segments[1].duration, 'segment duration correct')
  t.equal(5.005198766, parsed.segments[2].duration, 'segment duration correct')
  t.equal(5.005186063, parsed.segments[3].duration, 'segment duration correct')
  t.equal(5.005201669, parsed.segments[4].duration, 'segment duration correct')
  t.equal(5.00518475,  parsed.segments[5].duration, 'segment duration correct')

  console.log(parsed)
})
