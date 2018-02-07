var test    = require('tape')
var fetcher = require('../src/playlist_fetcher')

var client
test('that we can fetch vod playlists', t=>{
  t.plan(6)

  client = new fetcher('/vod.m3u8')
  t.ok(client, 'client created')
  t.notOk(client.parsedPlaylist, 'no playlist present at startup')
  t.equals(client.state, 0, 'fetcher was in correct state')

  t.timeoutAfter(1000)
  client.start(function(err) {
    t.ok(1, 'client started')
    t.notOk(err, 'there was NOT an error')
    t.ok(client.parsedPlaylist, 'parsed playlist present')
  })

})

test('that we can iterator fetches for playlist segments', t=> {
  t.plan(15)
  t.ok(client, 'client was present')

  var iterator = client.segmentFetchIterator()
  t.ok(iterator, 'fetch iterator was available')

  var promise1 = iterator.next()
  t.ok(promise1, 'got an object from the iterator')

  var type = Object.prototype.toString.call(promise1)
  t.equals('[object Promise]', type, 'iterator returned a promise')

  promise1.then(function(atom) {
    t.ok(1, 'fetched the first segment')
    t.ok(atom, 'atom was present')
    t.ok(atom.root, 'it is indeed a parsed atom')
    t.equals(atom.root[0].name, 'ftyp', 'got an ftyp')
  }).catch(function(err){
    t.fail('We failed to fetch the atom')
  })

  var promise2 = iterator.next()
  t.ok(promise2, 'got an object from the iterator')

  type = Object.prototype.toString.call(promise2)
  t.equals('[object Promise]', type, 'iterator returned a promise')

  promise2.then(function(atom) {
    t.ok(1, 'fetched the next segment')
    t.ok(atom, 'atom was present')
    t.notOk(atom.root, 'this is not a parsed atom.  good')
    t.ok(atom.payload, 'it is a data segment.  payload present')
    t.equals(atom.payload.byteLength, 1919004, 'data segment length correct')
  }).catch(function(err){
    t.fail('We failed to fetch the atom')
  })

})
