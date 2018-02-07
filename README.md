plainview
=========

[![Build Status](https://travis-ci.org/krad/plainview.svg?branch=master)](https://travis-ci.org/krad/plainview)

plainview is a javascript framework for consuming HLS playlists and mp4 files.

It has a number of components than can make it very useful.  They include:

  * HLS playlist parser
  * MP4 atom parsing (builds a tree)
  * Codec string builder (RFC6381)
  * Media Source Extension support (actual player)
  * Skinnable HTML5 player

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
