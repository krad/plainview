var plainview = require('./plainview')

var player = new plainview('player')

player.play(function(e){
  console.log('example.js play callback');
})

document.wut = player
