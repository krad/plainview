var test = require('tape')

test('that we have access to browser structures', t=> {
  t.plan(5)
  t.ok(window, 'has a window object')
  t.ok(window.MediaSource, 'MediaSource api is available')
  t.ok(window.URL, 'window.URL is available')
  t.ok(URL, 'URL is available')
  t.ok(document, 'document is available')
})

test('that we can open a new MediaSource', t=> {
  t.plan(5)

  var mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  t.ok(MediaSource.isTypeSupported(mimeCodec), 'codec is supported')

  var vidTag = document.createElement("video");

  var ms = new MediaSource()
  t.ok(ms, 'MediaSource present')

  var onSourceOpen = function(videoTag, e) {
    t.ok(videoTag, 'video tag is present')
    t.ok(e, 'event is present')
    t.ok(1, 'got sourceopen from MediaSource')
  }

  t.timeoutAfter(10000)
  ms.addEventListener('sourceopen', onSourceOpen.bind(this, vidTag))
  vidTag.src = URL.createObjectURL(ms)

})
