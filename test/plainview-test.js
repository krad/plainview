var test  = require('tape')
var fs    = require('fs')
var p     = require('../src/index')

test('that we can create a plainview object', t=> {
  t.plan(3)

  var plainview = new p.Plainview()
  t.ok(plainview, 'was able to create an object')
  t.throws(plainview.setup, 'Please set a video tag', 'threw no player tag error')

  try { plainview.setup('#player') }
  catch(e) { t.ok(1, 'threw no playlist err') }

})
