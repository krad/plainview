const test  = require('tape')
import plainview from '../src/plainview'

test('that we have access to a browser objects', t=>{
  t.ok(window)
  t.ok(document)
  t.end()
})
