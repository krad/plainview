var test      = require('tape')
var plainview = require('../src/plainview')

var html = `
<html>
  <body>
    <video id='playerx'>
      <source src="/vod.m3u8" type="application/x-mpegURL">
    </video>
  </body>
</html>
`

test('that we can setup the document contents', t=> {
  document.body.innerHTML = html
  t.plan(1)
  t.ok(document.getElementById('playerx'), 'found the player')
})

var pv
test('that we can setup a plainview object', t=> {
  t.plan(6)

  pv = new plainview('playerx')
  t.ok(pv, 'was able to create an object')
  t.ok(pv.AVElement, 'found the video tag')
  t.ok(pv.playlistURLs, 'found the playlistURL')
  t.equals(pv.playlistURLs.length, 1, 'got correct number of playlistURLs')

  t.timeoutAfter(1000)
  pv.setup(err => {
    t.ok(1, 'we got setup')
    t.notOk(err, 'no err was present')
  })

})

test('that we throw when we cant find a player tag', t => {
  document.body.innerHTML = html
  t.plan(1)
  const throwCheck = () => { new plainview('playerz') }
  t.throws(throwCheck, 'Could not find player')
})
