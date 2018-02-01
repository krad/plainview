var test      = require('tape')
var fs        = require('fs')
var plainview = require('../')

test('that we can parse atoms from a segment', t=> {
  t.plan(11)
  var mockBuffer  = fs.readFileSync('./test/fileSeq0.mp4')
  var mock        = new Uint8Array(mockBuffer)
  t.equals(1156, mock.length)

  var parsed = plainview.parseAtoms(mock)
  t.ok(parsed, 'parsed mock')

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



  // console.log(parsed)
  console.log(root)
})
