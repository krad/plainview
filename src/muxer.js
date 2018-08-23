import * as slugline from '@krad/slugline'

export default class Muxer {
  constructor() {
    this.tasks      = []
    this.transmuxer = new slugline.Transmuxer()
  }

  addJob(bytes) {
    this.tasks.push(bytes)
  }

  async processJob() {
    // console.log('job');
    return new Promise((resolve, reject) => {
      const segment = this.tasks.shift()
      const ts      = slugline.TransportStream.parse(segment)
      this.transmuxer.setCurrentStream(ts)
      let res       = this.transmuxer.build()

      let result = []

      if (this.initSegment === undefined) {
        this.initSegment = this.transmuxer.buildInitializationSegment(res[0])
        result.push(this.initSegment)
      }

      let media = this.transmuxer.buildMediaSegment(res)
      result.push(media)
      resolve(result)
    })
  }

}
