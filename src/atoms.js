/**
*  @file Atom parsing
*  @author krad.io <iam@krad.io>
*  @version 0.0.2
**/
var atomProcessor = require('./atom_processor')

/**
 *
 */
var ATOMS = {
  "ftyp": atomProcessor.ftyp,
  "mvhd": atomProcessor.mvhd,
  "tkhd": atomProcessor.tkhd,
  "mdhd": atomProcessor.mdhd,
  "hdlr": atomProcessor.hdlr,
  "vmhd": atomProcessor.vmhd,
  "dref": atomProcessor.dref,
  "dinf": atomProcessor.ding,
  "stco": atomProcessor.stco,
  "stsz": atomProcessor.stsz,
  "stsc": atomProcessor.stsc,
  "stts": atomProcessor.stts,
  "pasp": atomProcessor.pasp,
  "colr": atomProcessor.colr,
  "avcC": atomProcessor.avcC,
  "avc1": atomProcessor.avc1,
  "stsd": atomProcessor.stsd,
  "stbl": atomProcessor.stbl,
  "minf": atomProcessor.minf,
  "mdia": atomProcessor.mdia,
  "trak": atomProcessor.trak,
  "moov": atomProcessor.moov,
  "trex": atomProcessor.trex,
  "mvex": atomProcessor.mvex,
  "mfhd": atomProcessor.mfhd,
  "tfhd": atomProcessor.tfhd,
  "tfdt": atomProcessor.tfdt,
  "trun": atomProcessor.trun,
  "traf": atomProcessor.traf,
  "moof": atomProcessor.moof,
  "mdat": atomProcessor.mdat,
  "smhd": atomProcessor.smhd,
  "mp4a": atomProcessor.mp4a,
  "esds": atomProcessor.esds,
}



/**
 * Array.prototype.flatMap - flatMap over arrays
 *
 * @param  {Function} lambda Map function
 * @return {Array}        Mapped array flattened with undefined/null removed
 */
Array.prototype.flatMap = function(lambda) {
  return Array.prototype.concat
  .apply([], this.map(lambda))
  .filter(function(x){
    if (x) { return x }
  })
}


/**
 * Atom - An atom represents a section of data in a mpeg file
 *
 * @param  {String} name          Name of the atom (4 characters)
 * @param  {Integer} location     Location of the beginning of the atom (where size starts)
 * @param  {Integer} size         Size of the atom reported from the 32bit size integer
 * @param  {Uint8Array} payload   The actual atom data (starting after the atom name)
 * @return {Atom}                 Atom struct with appropriate fields
 */
function Atom(name, location, size, payload) {
  this.name     = name
  this.location = location
  this.size     = size
  if (ATOMS[name]) { ATOMS[name](this, payload) }
}


/**
 * Atom.prototype.insert - Insert a child atom into a parent atom
 *
 * @param  {Atom} child An atom which is a descendant of a media atom
 */
Atom.prototype.insert = function(child) {
  if (!this.children) { this.children = [] }
  this.children.push(child)
}


/**
 * AtomTree - A structure describing the atoms within an mpeg file
 *
 * @return {AtomTree}  An AtomTree object with appropriate data filled
 */
function AtomTree() {
  this.root = []
  this.length = function() { return this.root.length }
  this.config = null
}


/**
 * AtomTree.prototype.insert - Insert an atom into the atom tree at it's appropriate location
 *
 * @param  {Atom} atom An Atom object
 */
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


/**
 * AtomTree.prototype.findAtoms - Finds atoms by name
 *
 * @param  {String} atomName The name of all the atoms you want to find
 * @return {Array<Atom>}     An array of atoms with the name searched for
 */
AtomTree.prototype.findAtoms = function(atomName) {
  return this.root.flatMap(function(e) { return explode(e) })
  .filter(function(e) { if (e.name == atomName) { return e } })
}


/**
 * explode - Used to recursively unwrap an Atom's children into a flat array
 *
 * @param  {Atom} atom An Atom object with children
 * @return {Array<Atom>} A 1 dimensional array including an atom and all of it's children (and there children and so forth)
 */
function explode(atom) {
  if (atom.children) {
    var exploded = atom.children.flatMap(function(x){ return explode(x) })
    return [atom].concat(exploded)
  } else {
    return [atom]
  }
}


/**
 * isChild - Simple check if an atom is a descendant (direct and otherwise) of a parent atom
 *
 * @param  {Atom} subject The Atom that may be a child
 * @param  {Atom} suspect The Atom that may be the parent
 * @return {Boolean} A bool.  true if the subject falls within the range of the parent
 */
function isChild(subject, suspect) {
  if (subject.location < (suspect.location + suspect.size)) {
    return true
  }
  return false
}


/**
 * isObject - Simple check if something is an object
 *
 * @param  {Value} o A value that may or may not be an object
 * @return {Boolean}   A bool.  true if o is an Object
 */
function isObject(o) {
  return o instanceof Object && o.constructor === Object;
}

/**
 * isAtom - Simple check if a value is an Atom object
 *
 * @param  {Object} a An object that may or may not be an Atom
 * @return {Boolean} true if a is an Atom
 */
function isAtom(a) {
  return a instanceof Atom && a.constructor === Atom;
}



/**
 * parseCodecs - Parses an AtomTree for codec information from any audio and/or video tracks
 * Video:
 *  We only support avc1 atoms at this time.  This respects proper profile, level parsing.
 *
 * Audio:
 *  I've only tested this with AAC streams.
 *  I pieced together ESDS generation from old specs and reverse engineering.
 *  Requirements in the HLS spec are fairly slim as of this writing so this *should* cover
 *  most use cases (AAC-LC, HE-AAC, *maybe* mp3?)
 *  I know for a fact this will work with morsel (github.com/krad/morsel)
 *
 * @param  {AtomTree} tree A tree representing the parsed contents of an mpeg file
 * @return {Array<String>} An array of codec strings (RFC6381)
 */
function parseCodecs(tree) {
  var result

  var videoScan = tree.findAtoms('avc1')
  if (videoScan && videoScan.length > 0) {
    var avc1 = videoScan[0]

    if (avc1.children && avc1.children.length > 0) {
      var profileScan = avc1.children.filter(function(e) { if (e.name == 'avcC') { return e } })
      if (profileScan && profileScan.length > 0) {
        var avcC = profileScan[0]
        if (avcC) {
          if (!result) { result = [] }

          var params = [avcC.profile,
                        avcC.profileCompatibility,
                        avcC.levelIndication].map(function(i) {
                          return ('0' + i.toString(16).toUpperCase()).slice(-2)
                        }).join('');

          var codec = "avc1." + params
          result.push(codec)
        }
      }
    }
  }

  var audioScan = tree.findAtoms('mp4a')
  if (audioScan && audioScan.length > 0) {
    var mp4a = audioScan[0]

    if (mp4a.children && mp4a.children.length > 0) {
      var audioConfScan = mp4a.children.filter(function(e) { if (e.name == 'esds') { return e } })
      if (audioConfScan && audioConfScan.length > 0) {
        var esds = audioConfScan[0]
        if (esds && esds.audioSpecificConfig) {
          if (!result)  { result = [] }
          var params = [esds.objectProfileIndication, esds.audioSpecificConfig.type].map(function(e){ return e.toString(16) }).join('.')
          var codec  = 'mp4a.' + params
          result.push(codec)
        }
      }
    }
  }

  return result
}

/**
 * parseAtoms - Method to parse an mpeg file
 *
 * @param  {Uint8Array} arraybuffer An Uint8array that represents the contents of an mpeg file
 * @return {AtomTree}               An AtomTree
 */
module.exports = function parseAtoms(arraybuffer) {
  var cursor = 0;

  var tree = new AtomTree()
  while (cursor <= arraybuffer.length) {

    var atomIdent = arraybuffer.slice(cursor, cursor+4)
    var atomName  = String.fromCharCode.apply(null, atomIdent)

    if (Object.keys(ATOMS).includes(atomName)) {
      var sizeBytes = arraybuffer.buffer.slice(cursor-4, cursor)
      var view      = new DataView(sizeBytes)
      var atomSize  = view.getUint32(0)

      var payload = arraybuffer.slice(cursor+4, (cursor+atomSize)-4)
      var atom = new Atom(atomName, cursor-4, atomSize, payload)
      tree.insert(atom)

      cursor += 4
      continue
    }

    cursor += 1
  }

  tree.codecs = parseCodecs(tree)

  return tree
}
