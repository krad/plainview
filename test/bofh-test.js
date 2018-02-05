var test    = require('tape')
var fs      = require('fs')
var client  = require('../src/bofh')

function MockHttpRequest() {}

test('test that we can mock request/responses', t=> {
  t.plan(3)

  var bofh = new client.BOFH(MockHttpRequest)
  MockHttpRequest.prototype.open = function(method, url) {
    t.ok(1, 'called open/get')

    var urlComps  = url.split('/')
    this.url      = urlComps[urlComps.length-1]
  }

  MockHttpRequest.prototype.send = function() {
    t.ok(1, 'called send')
    if (this.url) {
      var path        = './test/fixtures/' + this.url
      var mockBuffer  = fs.readFileSync(path)
      var mock        = new Uint8Array(mockBuffer)
      this.response   = mock
      this.onload()
    } else {
      t.fail('no url set')
    }
  }

  t.timeoutAfter(1000)
  bofh.get('/fileSeq1.mp4', function(data){
    t.ok(data, 'got data back')
  })

})
