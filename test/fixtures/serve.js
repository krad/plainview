const express    = require('express')
const path       = require('path')
const http       = require('http')
const app        = express()
const cors 	 = require('cors')

const serverPort = 8000

app.use(cors({
  exposedHeaders: ['Location', 'Content-Length'],
  credentials: true,
  origin: '*'
}))

app.use(express.static(path.join(__dirname, '.')))


const server = http.createServer(app)

server.listen(serverPort, () => {
  console.log('Server started listening on', serverPort)
})
