var plainview = require('./plainview')

var player = new plainview.Plainview('player')

player.play(function(e){
  console.log('started playing');
})

document.wut = player
