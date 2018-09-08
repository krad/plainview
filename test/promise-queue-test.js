const test = require('tape')
import PromiseQueue from '../src/promise-queue'

test('that we can queue promises', t=> {
  t.plan(3)

  let q = PromiseQueue()
  let a = promiseFactory('a', t, false, 500)
  let b = promiseFactory('b', t, false, 500)
  let c = promiseFactory('c', t, false, 500)

  q.push(a)
  q.push(b)
  q.push(c)

})

test('that we can change things to queued promises', t=> {
  t.plan(3)

  let q = PromiseQueue()
  let a = promiseFactory('a', t, false, 1000)
  let b = promiseFactory('b', t, false, 500)
  let c = promiseFactory('c', t, false, 500)

  q.push(a.then(console.log('completed a')))
  q.push(b.then(console.log('completed b')))
  q.push(c.then(console.log('completed c')))
})


let promiseFactory = (ident, t, shouldFail, timeout) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      t.ok(ident, `resolving ${ident}`)
      if (shouldFail) {
        reject(ident)
      } else {
        resolve(ident)
      }
    }, timeout)
  })
}
