const test  = require('tape')
import * as h from '../src/time_code_helpers'

test('that that we can pad numbers', t => {
  t.plan(2)
  t.equals(h.pad(0, 2), '00')
  t.equals(h.pad(0, 3), '000')
})

test('that we can convert seconds into a struct thing', t => {
  t.plan(15)

  var e = h.convertSeconds(10)
  t.ok(e, 'time elements present')
  t.equals(e.d, 0, 'got correct days')
  t.equals(e.h, 0, 'got correct hours')
  t.equals(e.m, 0, 'got correct minutes')
  t.equals(e.s, 10, 'got correct seconds')

  e = h.convertSeconds(3661)
  t.ok(e, 'time elements present')
  t.equals(e.d, 0, 'got correct days')
  t.equals(e.h, 1, 'got correct hours')
  t.equals(e.m, 1, 'got correct minutes')
  t.equals(e.s, 1, 'got correct seconds')

  e = h.convertSeconds(86400)
  t.ok(e, 'time elements present')
  t.equals(e.d, 1, 'got correct days')
  t.equals(e.h, 0, 'got correct hours')
  t.equals(e.m, 0, 'got correct minutes')
  t.equals(e.s, 0, 'got correct seconds')

})

test('that we can make a timecode from seconds', t => {
  t.plan(5)

  t.equals(h.makeTimeCode(10),       '00:10')
  t.equals(h.makeTimeCode(60),       '01:00')
  t.equals(h.makeTimeCode(194),      '03:14')
  t.equals(h.makeTimeCode(3661),  '01:01:01')
  t.equals(h.makeTimeCode(86399), '23:59:59') // We roll over 1 second after this.

})

test('that we can make a duration counter string', t=> {
  t.plan(1)
  t.equals(h.makeDurationCounter(10, 194), '00:10 / 03:14')
})
