const test  = require('tape')
import Player from '../src/player'
import {setupServer, tearDownServer, serverPort, hostAndPort} from './fixture-server'

test.only('player behavior', t=> {
  t.test(setupServer,         'player behavior - started fixture server')
  t.test(playerConfigureTest, 'player behavior - configuring a player')
  t.test(tearDownServer,      'player behavior - tore down fixture server')
  t.end()
})

const playerConfigureTest = (t) => {
  t.plan(11)
  t.timeoutAfter(3000)
  const url     = hostAndPort() + '/basic/krad.tv/tractor/vod.m3u8'
  const player  = new Player(url)

  t.equals(player.playlistURL, url, 'set the playlist url properly')
  t.deepEqual(player.errors, [],    'errors array was empty')

  player.configure().then(player => {

    t.ok(player)
    t.ok(player.playlist, 'Player has playlist object now')
    t.equals('MediaPlaylist', player.playlist.constructor.name, 'MediaPlaylist object type')

    t.ok(player.codecs, 'player had codec info')
    t.deepEqual(player.codecs, ['avc1.42001E', 'mp4a.40.2'], 'player had correct codec info')

    t.ok(player.totalDuration, 'player had total duration')
    t.equals(player.totalDuration, 119.65063333333353, 'total duration was correct')

    t.notOk(player.downloadProgress, 'no download progress yet')
    player.fetchSegments()

    setTimeout(() => { t.equals(100.00, player.downloadProgress, 'downloaded all segments') }, 1200)

  }).catch(err => {
    t.fail('Failed to fetch playlist:' + err)
  })
}
