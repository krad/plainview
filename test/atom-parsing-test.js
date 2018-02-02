var test   = require('tape')
var fs     = require('fs')
var parser = require('../atoms')

var mockBuffer  = fs.readFileSync('./test/fileSeq0.mp4')
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

test('that can parse ftyp components', t=> {
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
