var test      = require('tape')
var fs        = require('fs')
var playlist  = require('../src/playlist')

var mock = fs.readFileSync('./test/fixtures/vod.m3u8').toString()

test('that we can parse a m3u8 playlist', t=> {
  t.plan(17)
  var parsed = playlist(mock)
  t.ok(parsed, 'parsed mock')

  t.ok(parsed.hasOwnProperty('info'), 'has playlist info')
  t.equals(parsed['info']['targetDuration'], 6, 'target duration correct')
  t.equals(parsed['info']['version'], 7, 'hls version correct')
  t.equals(parsed['info']['mediaSequenceNumber'], 1, 'media seq num correct')
  t.equals(parsed['info']['type'], "VOD", 'playlist type correct')

  t.ok(parsed.info.hasOwnProperty('duration'), 'has a duration')
  t.equals(21.02180154, parsed['info']['duration'], 'duration was correct')

  t.ok(parsed.hasOwnProperty('segments'), 'has segments')
  t.ok(Array.isArray(parsed.segments), 'segments is array')
  t.equals(parsed.segments.length, 5, 'segment count is correct')

  t.equals(true, parsed.segments[0].isIndex, 'first segment is index')
  t.equals(false, parsed.segments[1].isIndex, 'second segment is NOT index')

  t.equal(6.006226722, parsed.segments[1].duration, 'segment duration correct')
  t.equal(5.005193369, parsed.segments[2].duration, 'segment duration correct')
  t.equal(5.005189734, parsed.segments[3].duration, 'segment duration correct')
  t.equal(5.005191715, parsed.segments[4].duration, 'segment duration correct')

  console.log(parsed)
})

test('that we can prefix segment urls with urls', t=> {
  t.plan(13)
  var parsed = playlist(mock, 'https://krad.tv/test-playlist/')
  t.ok(parsed, 'parsed mock')

  var segments = parsed.segments
  t.ok(segments, 'segments present')
  t.equals(segments[0].url, 'https://krad.tv/test-playlist/fileSeq0.mp4', 'prefixed the url properly')
  t.equals(segments[1].url, 'https://krad.tv/test-playlist/fileSeq1.mp4', 'prefixed the url properly')

  parsed = playlist(mock, 'https://krad.tv/test-playlist')
  t.ok(parsed, 'parsed mock')
  segments = parsed.segments
  t.ok(segments, 'segments present')
  t.equals(segments[0].url, 'https://krad.tv/test-playlist/fileSeq0.mp4', 'prefixed the url properly')

  parsed = playlist(mock, 'https://krad.tv/')
  t.ok(parsed, 'parsed mock')
  segments = parsed.segments
  t.ok(segments, 'segments present')
  t.equals(segments[0].url, 'https://krad.tv/fileSeq0.mp4', 'prefixed the url properly')

  parsed = playlist(mock, 'https://krad.tv')
  t.ok(parsed, 'parsed mock')
  segments = parsed.segments
  t.ok(segments, 'segments present')
  t.equals(segments[0].url, 'https://krad.tv/fileSeq0.mp4', 'prefixed the url properly')

})

test('that we can interate over segments of the playlist', t=> {
  t.plan(13)

  var pl = playlist(mock)
  t.ok(pl, 'created playlist')

  var iterator = pl.segmentIterator()
  t.ok(iterator, 'created a segment iterator')

  var segment = iterator.next()
  t.ok(segment, 'iterator vended a segment')
  t.equals(segment.url, 'fileSeq0.mp4', 'url in vended segment was correct')

  segment = iterator.next()
  t.ok(segment, 'vended another segment')
  t.equals(segment.url, 'fileSeq1.mp4', 'url was for next segment')

  segment = iterator.next()
  t.ok(segment, 'vended another segment')
  t.equals(segment.url, 'fileSeq2.mp4', 'url was for next segment')

  segment = iterator.next()
  t.ok(segment, 'vended another segment')
  t.equals(segment.url, 'fileSeq3.mp4', 'url was for next segment')

  segment = iterator.next()
  t.ok(segment, 'vended another segment')
  t.equals(segment.url, 'fileSeq4.mp4', 'url was for next segment')

  segment = iterator.next()
  t.notOk(segment, 'hit the end of the iterator')

})
