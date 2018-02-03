var test   = require('tape')
var fs     = require('fs')
var parser = require('../src/atoms')

var mockBuffer  = fs.readFileSync('./test/fixtures/fileSeq0.mp4')
var mock        = new Uint8Array(mockBuffer)

test('that we can parse atoms from a segment', t=> {
  t.plan(11)
  t.equals(1156, mock.length)

  var parsed = parser(mock)
  t.ok(parsed, 'parsed init segment')

  var root = parsed.root
  t.equals(root.length, 2, 'correct count of atoms in root')
  t.equals(root[0].name, 'ftyp', 'has an ftyp atom')
  t.equals(root[1].name, 'moov', 'has a moov atom')
  t.equals(root[1].children.length, 4, 'moov has correct amount of children')
  t.equals(root[1].children[0].name, 'mvhd', 'mvhd is present')
  t.equals(root[1].children[1].name, 'trak', 'trak is present')
  t.equals(root[1].children[2].name, 'trak', 'trak is present')
  t.equals(root[1].children[3].name, 'mvex', 'mvex is present')

  // video trak
  t.equals(root[1].children[1].children.length, 2, 'trak has correct children')

  console.log(root)
})

test('that we can parse ftyp components', t=> {
  t.plan(10)

  var parsed = parser(mock)
  t.ok(parsed, 'parsed init segment')
  t.equals(parsed.root[0].name, 'ftyp', 'has an ftyp atom')

  var ftyp = parsed.root[0]
  t.ok(ftyp.hasOwnProperty('majorBrand'), 'has a majorBrand')
  t.equals(ftyp.majorBrand, 'mp42', 'correct majorBrand')
  t.equals(ftyp.minorVersion, 1, 'correct minorVersion')
  t.equals(ftyp.compatibleBrands.length, 4, 'correct number of compatibleBrands')
  t.equals(ftyp.compatibleBrands[0], 'mp41', 'compatiable brand name was correct #1')
  t.equals(ftyp.compatibleBrands[1], 'mp42', 'compatiable brand name was correct #2')
  t.equals(ftyp.compatibleBrands[2], 'isom', 'compatiable brand name was correct #3')
  t.equals(ftyp.compatibleBrands[3], 'hlsf', 'compatiable brand name was correct #4')

  console.log(ftyp)
})

test('that we can find atoms by name', t=> {
  t.plan(6)

  var parsed = parser(mock)
  t.ok(parsed)
  t.ok(typeof parsed.findAtoms === 'function', 'has a find atom function')

  var atoms = parsed.findAtoms('trak')
  t.ok(atoms, 'found atoms')
  t.equals(2, atoms.length, 'found the correct amount of traks')

  atoms = parsed.findAtoms('trex')
  t.ok(atoms, 'found atoms')
  t.equals(2, atoms.length, 'found the correct amount of trexs')

  console.log(atoms)
})

test('that we can parse avc1 components', t=> {
  t.plan(7)
  var parsed = parser(mock)
  t.ok(parsed, 'parsed init segment')

  var atoms = parsed.findAtoms('avc1')
  t.ok(atoms, 'found atoms')
  t.equals(1, atoms.length, 'found correct amount of avc1 atoms')

  var avc1 = atoms[0]
  t.ok(avc1.hasOwnProperty('width'), 'has a width property')
  t.ok(avc1.hasOwnProperty('height'), 'has a height property')

  t.equals(avc1.width, 480, 'width value was correct')
  t.equals(avc1.height, 272, 'height value was correct')

  console.log(avc1)
})


test('that we can parse avcC components', t=> {
  t.plan(11)

  var parsed = parser(mock)
  t.ok(parsed, 'parsed init segment')

  var atoms = parsed.findAtoms('avcC')
  t.ok(atoms, 'found atoms')
  t.equals(1, atoms.length, 'found correct amount of avcC atoms')

  var avcC = atoms[0]
  t.ok(avcC.hasOwnProperty('version'), 'has a version property')
  t.ok(avcC.hasOwnProperty('profile'), 'has a profile property')
  t.ok(avcC.hasOwnProperty('profileCompatibility'), 'has a profileCompatibility property')
  t.ok(avcC.hasOwnProperty('levelIndication'), 'has a levelIndication property')

  t.equals(avcC.version, 1, 'version property correct')
  t.equals(avcC.profile, 66, 'profile property correct')
  t.equals(avcC.profileCompatibility, 0, 'profileCompatibility property correct')
  t.equals(avcC.levelIndication, 30, 'levelIndication property correct')

  console.log(avcC)
})

test('that we can parse esds components', t=>{
  t.plan(10)

  var parsed = parser(mock)
  t.ok(parsed, 'parsed init segment')

  var atoms = parsed.findAtoms('esds')
  t.ok(atoms, 'found atoms')
  t.equals(1, atoms.length, 'found correct amount of esds atoms')

  var esds = atoms[0]
  t.equals(esds.name, 'esds', 'got the right atom')
  t.ok(esds.hasOwnProperty('objectProfileIndication'), 'has objectProfileIndication')
  t.equals(esds.objectProfileIndication, 64, 'has correct objectProfileIndication (audio)')

  t.ok(esds.hasOwnProperty('audioSpecificConfig'), 'has audioSpecificConfig')
  t.ok(esds.audioSpecificConfig, 'audioSpecificConfig actually exists')

  var audioSpecificConfig = esds.audioSpecificConfig
  t.ok(audioSpecificConfig.hasOwnProperty('type'), 'has type')
  t.equals(2, audioSpecificConfig.type, 'audio specific config type is correct')

})

test('that we can get codec information out of a tree', t=> {
  t.plan(6)

  var parsed = parser(mock)
  t.ok(parsed, 'parsed init segment')
  t.ok(parsed.hasOwnProperty('codecs'), 'has codecs property')
  t.ok(parsed.codecs, 'codecs are present')

  t.equals(parsed.codecs.length, 2, 'correct number of codecs available')

  t.equals(parsed.codecs[0], 'avc1.42001E', 'video codec string is correct')
  t.equals(parsed.codecs[1], 'mp4a.40.2', 'audio codec string is correct')

  console.log(parsed.codecs)
})
