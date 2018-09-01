import * as slugline from '@krad/slugline'
import Manson from '@krad/manson'

export default class Muxer {
  constructor() {
    this.tasks      = []
    this.transmuxer = new slugline.Transmuxer()
  }

  addJob(bytes) {
    Manson.trace('adding new job to muxer')
    this.tasks.push(bytes)
  }

  async processJob() {
    return new Promise((resolve, reject) => {
      const segment = this.tasks.shift()

      Manson.info(`parsing segment #${segment.id}`)
      const ts      = slugline.TransportStream.parse(segment)
      this.transmuxer.setCurrentStream(ts)

      Manson.trace(`transmuxing segment #${segment.id}`)
      let res       = this.transmuxer.build()

      let result = []

      if (this.initSegment === undefined) {
        Manson.trace(`building init info from segment #${segment.id}`)
        this.initSegment = this.transmuxer.buildInitializationSegment(res[0])
        result.push(this.initSegment)
      }

      Manson.trace(`building media info from segment #${segment.id}`)
      let media = this.transmuxer.buildMediaSegment(res)
      result.push(media)
      resolve(result)
    })
  }

}
