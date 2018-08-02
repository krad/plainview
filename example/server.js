const express 	 = require('express')
const path       = require('path')
const http	 = require('http')
const app        = express()
const serverPort = 8080
app.use(express.static(path.join(__dirname, '../test/fixtures')))
app.use(express.static(path.join(__dirname, '../distribution')))
app.use(express.static(path.join(__dirname, '.')))
const server = http.createServer(app)

server.listen(serverPort, () => {
  console.log('Server started listening on', serverPort) 
})
