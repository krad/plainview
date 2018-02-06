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
    playerControls.innerHTML = playerTemplate

    // Place the wrapper/controls after the video tag
    // then remove video tag and insert it into the wrapper
    videoWrapper.insertAdjacentElement('afterbegin', playerControls)
    player.insertAdjacentElement('afterend', videoWrapper)
    parentNode.removeChild(player)
    videoWrapper.insertAdjacentElement('afterbegin', player)

    // Style the video wrapper and controls wrapper
    videoWrapper.style.cssText    = 'display: block;'
    videoWrapper.style.cssText    += 'width: 100%; height:100%;'
    playerControls.style.cssText  = 'margin-top: auto; background-color: rgba(0, 0, 0, 0.3);'
    player.style.cssText          = 'width:100%; height:100%;'

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
      button.style.cssText += 'border-color: rgba(0, 0, 0, 0.3);'

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

    // Remove poster from the video tag and set as a background image on the video wrapper
    if (player.poster) {
      var posterURL = 'url(' + player.poster + ');'
      videoWrapper.style.cssText += 'background:' + posterURL
      videoWrapper.style.cssText += 'background-size: contain;'
      videoWrapper.style.cssText += 'background-repeat:no-repeat;'
      player.removeAttribute('poster')
    }

    // Wire up the controls to their respective events
    configurePlayerControls(player)
  }

}

function configurePlayerControls(player) {
  document.getElementById('playpause').addEventListener('click', function(event){
    if (event.target.dataset.state == 'play') {
      event.target.dataset.state = 'pause'
      event.target.innerHTML = 'Pause'
      player.play()
    } else {
      event.target.dataset.state = 'play'
      event.target.innerHTML = 'Play'
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

  document.getElementById('volinc').addEventListener('click', function(event){
    console.log('volinc');
  }, false)

  document.getElementById('voldec').addEventListener('click', function(event){
    console.log('voldec');
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
