const http    = require('http')
const express = require('express')
const path    = require('path')

const minPort = 1025
const maxPort = 65535

/// Pick a random non-privleged port to listen on
const serverPort = Math.floor(Math.random() * (maxPort - minPort + 1) + minPort)
const app        = express()
app.use(express.static(path.join(__dirname, './fixtures')))
const server = http.createServer(app)

const setupServer = (t) => {
  t.plan(1)
  server.listen(serverPort, () => {
    t.ok(1, 'Server started listening on ' + serverPort)
  })
}

const tearDownServer = (t) => {
  t.plan(1)
  t.timeoutAfter(2000)
  server.close(() => t.ok(1, 'Server closed on ' + serverPort))
}

const hostAndPort = () => {
  return 'http://localhost:'+serverPort
}


export {setupServer, tearDownServer, serverPort, hostAndPort}
