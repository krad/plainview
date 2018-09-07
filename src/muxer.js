import * as slugline from '@krad/slugline'
import Manson from '@krad/manson'

export default class Muxer {

  constructor() {
    this.transmuxer = new slugline.Transmuxer()
  }


  /**
   * transcode - Transmuxes a transport stream segment into a fmp4 segment
   *
   * @param  {Uint8Array} bytes An array of unsigned 8 bit integers representing the TS segment
   * @return {Promise<Array<Uint8Array>>} Returns an array of Uint8Array.  Arrays greater than 1 in length mean an init segment is at the front
   */
  transcode(bytes) {
    Manson.info('transcoding new segment')
    return new Promise((resolve, reject) => {
      Manson.debug(`parsing segment...`)

      const ts = slugline.TransportStream.parse(bytes)
      Manson.debug('segment parsed.')

      Manson.debug('starting transmux...')
      this.transmuxer.setCurrentStream(ts)
      Manson.debug('setup state...')
      let res = this.transmuxer.build()
      Manson.debug('transmux struct built.')

      let result = []
      if (this.initSegment === undefined) {
        Manson.debug('building init segment...')
        this.initSegment = this.transmuxer.buildInitializationSegment(res[0])
        result.push(this.initSegment)
      }

      Manson.debug('building media info from segment...')
      let media = this.transmuxer.buildMediaSegment(res)
      result.push(media)

      Manson.debug('transmuxing complete.')
      resolve(result)
    })
  }

}
