var ATOMS = [ "ftyp", "mvhd", "tkhd", "mdhd", "hdlr", "vmhd", "dref",
              "dinf", "stco", "stsz", "stsc", "stts", "pasp", "colr",
              "avcC", "avc1", "stsd", "stbl", "minf", "mdia", "trak",
              "moov", "trex", "mvex", "mfhd", "tfhd", "tfdt", "trun",
              "traf", "moof", "mdat", "smhd", "mp4a", "esds",]

Array.prototype.flatMap = function(lambda) {
  return Array.prototype.concat.apply([], this.map(lambda)).filter(function(x){
    if (x) { return x }
  })
}

function Atom(name, location, size) {
  this.name     = name
  this.location = location
  this.size     = size
  this.children = null
}

Atom.prototype.insert = function(child) {
  if (!this.children) { this.children = [] }
  this.children.push(child)
}

function AtomTree() {
  this.root = []
  this.length = function() { return this.root.length }
}

AtomTree.prototype.insert = function(atom) {
  var root = this.root

  var children = root
  .flatMap(function(e) { return explode(e) })
  .filter(function(e) { if (isChild(atom, e)) { return e } })

  if (children.length == 0) {
    root.push(atom)
  } else {
    var lastChild = children[children.length-1]
    lastChild.insert(atom)
  }

}

function explode(atom) {
  if (atom.children) {
    var exploded = atom.children.flatMap(function(x){ return explode(x) })
    return [atom].concat(exploded)
  } else {
    return [atom]
  }
}

function isChild(subject, suspect) {
  if (subject.location < (suspect.location + suspect.size)) {
    return true
  }
  return false
}

function isObject(o) {
  return o instanceof Object && o.constructor === Object;
}

function isAtom(o) {
  return o instanceof Atom && o.constructor === Atom;
}

module.exports = function parseAtoms(arraybuffer) {
  var cursor = 0;

  var tree = new AtomTree()
  while (cursor <= arraybuffer.length) {

    var atomIdent = arraybuffer.slice(cursor, cursor+4)
    var atomName  = String.fromCharCode.apply(null, atomIdent)

    if (ATOMS.includes(atomName)) {
      var sizeBytes = arraybuffer.buffer.slice(cursor-4, cursor)
      var view      = new DataView(sizeBytes)
      var atomSize  = view.getUint32(0)

      var atom = new Atom(atomName, cursor-4, atomSize)
      tree.insert(atom)

      cursor += 4
      continue
    }

    cursor += 1
  }

  return tree

}
