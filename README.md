plainview
=========

[![Build Status](https://travis-ci.org/krad/plainview.svg?branch=master)](https://travis-ci.org/krad/plainview)

plainview is a javascript library for consuming HLS playlists and mp4 files.

### Features
It has a number of components than can make it very useful.  They include:

  * HLS playlist parser
  * MP4 atom parsing (builds a tree)
  * Codec string builder (RFC6381)
  * Media Source Extension support (actual player)
  * Skinnable HTML5 player

Example
-------
```
<html>
  <head>
    <title>plainview.js - example player</title>
  </head>

  <body>
    <!-- Create a video tag with an id as you usually would -->
    <video id='player' controls poster='/0.jpg'>

      <!-- Set the source to the m3u8 file that needs to be parsed -->
      <source src="/vod.m3u8" type="application/x-mpegURL">
    </video>

    <!-- Include the plainview bundle.  See building instructions. -->
    <script src="/example/plainview.js"></script>

    <!-- When document is ready, pass the player to plainview and hit play -->
    <script type="text/javascript">
      (function() {

        var plainview = new Plainview('player')
        plainview.play(function(e){
          console.log('Example started');
        })

      })()
    </script>

	</body>
</html>
```

#### Development / Building

This is how you can checkout and build the project.

```
git clone https://www.github.com/krad/plainview.git
npm install
npm run build
```

This will create a file named `plainview.js` in `./build`
You can drop that into an html file and use the API from the browser.


Run tests
```
npm t
```

How it works
------------

Currently plainview only supports playlists with Fragmented MP4 segments.  It does *NOT* support transport stream segments at the moment.

plainview will fetch an HLS playlist, parse it's contents, and then immediately start fetching segments.  It will immediately look for an index segment (EXT-X-MAP:URI) and attempt to determine the contents of the stream (video? audio? a/v?) and their settings (h264 profile, aac-lc,he-aac/mp3 etc)


### Playlist Support


  * VOD (Video on Demand)

*COMING SOON*

  * Event playlists
  * Live playlists (Sliding window)
  * I-Frame Only playlists


### Video Support

  * h264

*COMING SOON*

  * h265
  * vp8
  * vp9

### Audio Support

  * AAC-LC
  * HE-AAC
  * MP3
