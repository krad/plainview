const test    = require('tape')
const resolve = require('url').resolve
import Muxer from '../src/muxer'

test('that we have an interface for muxing media', t=> {
  t.plan(4)
  const muxer = new Muxer()
  const url   = resolve(location.href, '/apple-basic-ts/gear1/fileSequence0.ts')

  fetch(url)
  .then(response => {
    if (response.ok) { return response.arrayBuffer() }
    else { throw 'Something went wrong fetching' }
  })
  .then(arrayBuffer => {
    let bytes = new Uint8Array(arrayBuffer)
    return muxer.transcode(bytes)
  })
  .then(res => {
    t.ok(res, 'got a result')
    t.assert(res !== undefined, 'was not undefined')
    t.assert(res !== null, 'was not null')
    t.equals(2, res.length, 'two entries were in the result (init & media segment)')
  }).catch(err => {
    console.log(err);
    t.fail('Failed to transcode segment')
  })

})
