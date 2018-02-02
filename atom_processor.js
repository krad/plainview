/**
 * @file Atom processing (fill details from payload)
 * @author krad.io <iam@krad.io>
 * @version 0.0.1
 */


/**
 * var parseFTYP - Parses a 'ftyp atom'
 *
 * @param  {Atom} atom          An 'ftyp' Atom
 * @param  {Uint8Array} payload Uint8 array of atom data starting AFTER the 4 byte atom name
 */
var parseFTYP = function(atom, payload) {
  var view            = new DataView(payload.buffer, 4, 4)
  var majorBrandBytes = payload.slice(0, 4)
  atom.majorBrand     = String.fromCharCode.apply(null, majorBrandBytes)
  atom.minorVersion   = view.getUint32(0)

  atom.compatibleBrands = []

  var i = 8
  while (i < payload.length) {
    var brandSlice = payload.slice(i, i+4)
    var brandName  = String.fromCharCode.apply(null, brandSlice)
    atom.compatibleBrands.push(brandName)
    i += 4
  }

}

var parseMVHD = function(atom, payload) {
  // console.log('parseMVHD')
}

var parseTKHD = function(atom, payload) {
  // console.log('parseTKHD')
}

var parseMDHD = function(atom, payload) {
  // console.log('parseMDHD')
}

var parseHDLR = function(atom, payload) {
  // console.log('parseHDLR')
}

var parseVMHD = function(atom, payload) {
  // console.log('parseVMHD')
}

var parseDREF = function(atom, payload) {
  // console.log('parseDREF')
}

var parseDINF = function(atom, payload) {
  // console.log('parseDINF')
}

var parseSTCO = function(atom, payload) {
  // console.log('parseSTCO')
}

var parseSTSZ = function(atom, payload) {
  // console.log('parseSTSZ')
}

var parseSTSC = function(atom, payload) {
  // console.log('parseSTSC')
}

var parseSTTS = function(atom, payload) {
  // console.log('parseSTTS')
}

var parsePASP = function(atom, payload) {
  // console.log('parsePASP')
}

var parseCOLR = function(atom, payload) {
  // console.log('parseCOLR')
}

var parseAVCC = function(atom, payload) {
  // console.log('parseAVCC')
}

var parseAVC1 = function(atom, payload) {
  // console.log('parseAVC1')
  // var view    = new DataView(payload.buffer, 24, 4)
  // this.width  = view.getUint16(0)
  // this.height = view.getUint16(1)
}

var parseSTSD = function(atom, payload) {
  // console.log('parseSTSD')
}

var parseSTBL = function(atom, payload) {
  // console.log('parseSTBL')
}

var parseMINF = function(atom, payload) {
  // console.log('parseMINF')
}

var parseMDIA = function(atom, payload) {
  // console.log('parseMDIA')
}

var parseTRAK = function(atom, payload) {
  // console.log('parseTRAK')
}

var parseMOOV = function(atom, payload) {
  // console.log('parseMOOV')
}

var parseTREX = function(atom, payload) {
  // console.log('parseTREX')
}

var parseMVEX = function(atom, payload) {
  // console.log('parseMVEX')
}

var parseMFHD = function(atom, payload) {
  // console.log('parseMFHD')
}

var parseTFHD = function(atom, payload) {
  // console.log('parseTFHD')
}

var parseTFDT = function(atom, payload) {
  // console.log('parseTFDT')
}

var parseTRUN = function(atom, payload) {
  // console.log('parseTRUN')
}

var parseTRAF = function(atom, payload) {
  // console.log('parseTRAF')
}

var parseMOOF = function(atom, payload) {
  // console.log('parseMOOF')
}

var parseMDAT = function(atom, payload) {
  // console.log('parseMDAT')
}

var parseSMHD = function(atom, payload) {
  // console.log('parseSMHD')
}

var parseMP4A = function(atom, payload) {
  // console.log('parseMP4A')
}

var parseESDS = function(atom, payload) {
  // console.log('parseESDS')
}


module.exports = {
  ftyp: parseFTYP,
  mvhd: parseMVHD,
  tkhd: parseTKHD,
  mdhd: parseMDHD,
  hdlr: parseHDLR,
  vmhd: parseVMHD,
  dref: parseDREF,
  dinf: parseDINF,
  stco: parseSTCO,
  stsz: parseSTSZ,
  stsc: parseSTSC,
  stts: parseSTTS,
  pasp: parsePASP,
  colr: parseCOLR,
  avcC: parseAVCC,
  avc1: parseAVC1,
  stsd: parseSTSD,
  stbl: parseSTBL,
  minf: parseMINF,
  mdia: parseMDIA,
  trak: parseTRAK,
  moov: parseMOOV,
  trex: parseTREX,
  mvex: parseMVEX,
  mfhd: parseMFHD,
  tfhd: parseTFHD,
  tfdt: parseTFDT,
  trun: parseTRUN,
  traf: parseTRAF,
  moof: parseMOOF,
  mdat: parseMDAT,
  smhd: parseSMHD,
  mp4a: parseMP4A,
  esds: parseESDS,

}
