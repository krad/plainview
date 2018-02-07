var playerTemplate  = require('./player_template')

function skinPlayer(skinner, player) {
  if (player) {
    // Remove native controls
    player.controls = false

    // Insert HTML for our controls
    var parentNode     = player.parentNode
    var videoWrapper   = document.createElement('div')
    var playerControls = document.createElement('div')
    videoWrapper.setAttribute('class', 'player-wrapper')
    playerControls.setAttribute('class', 'player-controls')
    playerControls.innerHTML = playerTemplate.html

    videoWrapper.addEventListener('mouseenter', function(e){
      unfade(playerControls)
    })

    videoWrapper.addEventListener('mouseleave', function(e){
      fade(playerControls)
    })

    // Place the wrapper/controls after the video tag
    // then remove video tag and insert it into the wrapper
    videoWrapper.insertAdjacentElement('afterbegin', playerControls)
    player.insertAdjacentElement('afterend', videoWrapper)
    parentNode.removeChild(player)
    videoWrapper.insertAdjacentElement('afterbegin', player)

    // Style the video wrapper and controls wrapper
    // videoWrapper.style.cssText    = 'position: relative;'
    videoWrapper.style.cssText    += 'display: flex; justify-content: flex-end;  flex-direction: column;'
    playerControls.style.cssText  = 'background-color: rgba(0, 0, 0, 0.3);'
    player.style.cssText          = 'width:100% !important; height: auto !important; background:#000;'

    // Style the progress bar
    // pale (Alice blue) EAF6FD
    // done blue 209cee
    var progressWrapper = videoWrapper.querySelector('.progress')
    var progressBar = progressWrapper.querySelector('progress')
    progressWrapper.style.cssText = 'width:100%;';
    progressBar.style.cssText     = 'height: 3px; width:100%; appearance: none; -webkit-appearance: none;'
    progressBar.style.cssText     += 'color: #209cee;'
    progressBar.style.cssText     += 'background-color: #EAF6FD;'

    skinner.progressBar = progressBar

    var buttons = playerControls.querySelectorAll('button')
    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i]
      button.style.cssText = 'padding: 16px;'
      button.style.cssText += 'background:none;'
      button.style.cssText += 'color:#fff;'
      button.style.cssText += 'border-color: rgba(0, 0, 0, 0.5);'

      if (button.id == 'playpause') {
        button.innerHTML = playerTemplate.playButton
      }

      if (button.id == 'fs') {
        button.innerHTML = playerTemplate.fullscreenButton
      }

      if (button.id == 'timecode') {
        skinner.timecode = button
      }

      if (i == buttons.length - 1) {
        button.style.cssText += 'border-top:0px; border-bottom:0px; border-left:1px, border-right:0px;'
      } else {
        button.style.cssText += 'border-top:0; border-bottom:0; border-left:0;'
      }
    }

    var rightControls = playerControls.querySelector('.right-controls')
    rightControls.style.cssText = 'float: right;'

    // Wire up the controls to their respective events
    configurePlayerControls(player)
  }

}

function fade(element) {
  var opacity = 1
  var timer = setInterval(function(){
    if (opacity <= 0.1) {
      clearInterval(timer)
      element.style.display = 'none'
    }
    element.style.opacity = opacity
    element.style.filter = 'alpha(opacity=' + opacity * 100 + ")"
    opacity -= opacity * 0.1
  }, 50)
}

function unfade(element) {
  var opacity = 0.1
  element.style.display = 'block'
  var timer = setInterval(function(){
    if (opacity >= 1) {
      clearInterval(timer)
    }
    element.style.opacity = opacity
    element.style.filter = 'alpha(opacity=' + opacity * 100 + ')'
    opacity += opacity * 0.1
  })
}

function configurePlayerControls(player) {
  var playpause = document.getElementById('playpause')
  document.getElementById('playpause').addEventListener('click', function(event){
    if (playpause.dataset.state == 'play') {
      playpause.dataset.state = 'pause'
      playpause.innerHTML     = playerTemplate.pauseButton
      player.play()
    } else {
      playpause.dataset.state = 'play'
      playpause.innerHTML     = playerTemplate.playButton
      player.pause()
    }
  }, false)

  document.getElementById('mute').addEventListener('click', function(event){
    if (event.target.dataset.state == 'mute') {
      event.target.dataset.state = 'unmute'
      event.target.innerHTML = 'Unmute'
      player.muted = true
    } else {
      event.target.dataset.state = 'mute'
      event.target.innerHTML = 'Mute'
      player.muted = false
    }
  }, false)

  document.getElementById('fs').addEventListener('click', function(event){
    if (player.requestFullscreen) {
      player.requestFullscreen();
    } else if (player.mozRequestFullScreen) {
      player.mozRequestFullScreen(); // Firefox
    } else if (player.webkitRequestFullscreen) {
      player.webkitRequestFullscreen(); // Chrome and Safari
    }
  }, false)

}

function updateProgressBar(skinner, player, event) {
  if (skinner.parsedPlaylist) {
    var duration = skinner.parsedPlaylist.info.duration
    updateDisplayTime(skinner.timecode,
                      player.currentTime,
                      duration)

    var percentage = Math.floor((100 / duration) * player.currentTime)
    skinner.progressBar.value = percentage
  }
}

function pad(number, size) {
  var s = String(parseInt(number))
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
}

function convertSeconds(seconds) {
  var d, h, m, s;
  s = seconds
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;
  return { d: d, h: h, m: m, s: s };
}

function makeTimeCode(seconds) {
  var c = convertSeconds(seconds)
  var timeComponents
  if (c.h <= 0) { timeComponents = [c.m, c.s] }
  else { timeComponents = [c.h, c.m, c.s] }

  return timeComponents.map(function(t){ return pad(t, 2) }).join(':')
}

function updateDisplayTime(timecode, currentTime, duration) {
  var timeComponents = [makeTimeCode(currentTime), makeTimeCode(duration)]
  var displayTime    = timeComponents.join(' / ')
  timecode.innerHTML = displayTime
}

function Skinner(playerID) {
  this.playerID = playerID
  this.player   = document.getElementById(playerID)
  skinPlayer(this, this.player)
}

Skinner.prototype.update = function(event) {
  if (event.type == 'timeupdate') {
    updateProgressBar(this, this.player, event)
  }
}

Skinner.prototype.addPlaylist = function(parsedPlaylist) {
  if (parsedPlaylist) {

    this.parsedPlaylist = parsedPlaylist
    if (this.timecode) {
      updateDisplayTime(this.timecode,
                        this.player.currentTime,
                        this.parsedPlaylist.info.duration)
    }
  }
}

module.exports = Skinner
