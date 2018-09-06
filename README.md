plainview
=========

[![Build Status](https://travis-ci.org/krad/plainview.svg?branch=master)](https://travis-ci.org/krad/plainview)

plainview is a no frills HTML5 video player for HLS content.

It is designed to behave like a standard video/audio tag (Hence the name 'plain view').

It relies on the slugline library for consuming playlists and parsing their media segments.  plainview isn't quite a polyfill, but if you squint it may resemble one.

Customizing plainview is incredibly easy.
It provides a number of functions for controlling playback and a number of events to hook into.  This lends itself to it being useful in a number of environments.  If you just need a vanilla plugin, it will work.  If you're using react, it will also work.

Here is a react component demonstrating how you can skin the player: ** COMING SOON **

Here is a vanilla example showing how plainview can play different types of HLS playlists:  ** COMING SOON **


Testing
=======

plainview uses `tape`, `tap-spec` `browserify`, `babelify`, and `testling` to run a suite of in browser tests.

`tape`, `tap-spec`, and `babelify` are the only libraries packaged as development dependencies.  The other tools need to be available on the system.

To setup an environment for testing, run the following:
```
npm install
npm install browserify testling -g
```

After the above commands have successfully completed you can then run:
```
npm t
```
