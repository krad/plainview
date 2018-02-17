var playerTemplate  = require('./player_template')
var timeCodeHelpers = require('./time_code_helpers')

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

// Remove native controls
const removePlayerControls = (player) => {
  player.controls = false
}

const wrapVideoWithPlayerControls = (player) => {
  // Insert HTML for our controls
  var parentNode     = player.parentNode
  var videoWrapper   = document.createElement('div')
  var playerControls = document.createElement('div')
  videoWrapper.setAttribute('class', 'player-wrapper')
  playerControls.setAttribute('class', 'player-controls')
  playerControls.innerHTML = playerTemplate.html

  // Place the wrapper/controls after the video tag
  // then remove video tag and insert it into the wrapper
  videoWrapper.insertAdjacentElement('afterbegin', playerControls)
  player.insertAdjacentElement('afterend', videoWrapper)
  parentNode.removeChild(player)
  videoWrapper.insertAdjacentElement('afterbegin', player)

  // Style the video wrapper and controls wrapper
  videoWrapper.style.cssText    += 'position: relative !important;'
  playerControls.style.cssText  =  'position: absolute; bottom:0 !important;'
  playerControls.style.cssText  += 'width:100% !important;'
  playerControls.style.cssText  += 'height:48px !important;'
  playerControls.style.cssText  += 'margin:0 !important;'
  playerControls.style.cssText  += 'padding:0 !important;'
  playerControls.style.cssText  +=  'background-color: rgba(0, 0, 0, 0.5) !important;'

  return [videoWrapper, playerControls]
}

const stylePlayer = (player) => {
  player.style.cssText     =  'width: 100% !important;'
  player.style.cssText     += 'height: auto !important;'
  player.style.cssText     += 'background:#000 !important;'
  player.style.cssText     += 'display: block !important;'
}

const styleProgressBar = (videoWrapper) => {
  // Style the progress bar
  var progressWrapper = videoWrapper.querySelector('.progress')
  var progressBar     = progressWrapper.querySelector('progress')
  progressWrapper.style.cssText = 'width:100% !important;';
  progressWrapper.style.cssText += 'height:2px !important;'
  progressWrapper.style.cssText += 'margin:0 !important;'
  progressWrapper.style.cssText += 'padding:0 !important;'
  progressBar.style.cssText     = 'height: 2px !important; width:100% !important;'
  progressBar.style.cssText     += 'appearance: none; -webkit-appearance: none;'
  progressBar.style.cssText     += 'color: #209cee !important;'
  progressBar.style.cssText     += 'margin: 0 !important; padding: 0 !important;'
  progressBar.style.cssText     += 'background-color: #EAF6FD !important;'

  return progressWrapper
}

const styleButtons = (playerControls) => {
  var buttons = playerControls.querySelectorAll('button')
  var timecode
  for (var i = 0; i < buttons.length; i++) {
    var button = buttons[i]
    button.style.cssText = 'padding: 16px !important;'
    button.style.cssText += 'background: rgba(0, 0, 0, 0.0) !important;'
    button.style.cssText += 'color:#fff !important;'
    button.style.cssText += 'border-color: rgba(0, 0, 0, 0.5) !important;'
    button.style.cssText += 'border-style: solid !important;'
    //button.style.cssText += 'height: 45px !important;'

    if (button.id == 'playpause') {
      button.innerHTML = playerTemplate.playButton
    }

    if (button.id == 'fs') {
      button.innerHTML = playerTemplate.fullscreenButton(13, 13, 'Fullscreen')
    }

    if (button.id == 'timecode') {
      timecode = button
    }

    if (i == buttons.length - 1) {
      button.style.cssText += 'border-width: 0px 0px 0px 1px !important;'
    } else {
      button.style.cssText += 'border-width: 0px 1px 0px 0px !important;'
    }
  }
  return timecode
}

const styleRightControls = (playerControls) => {
  var rightControls = playerControls.querySelector('.right-controls')
  rightControls.style.cssText = 'float: right;'
}

class Skinner {
  constructor(player) {
    this.player = player
  }

  skin() {
    removePlayerControls(this.player)
    const wrappers = wrapVideoWithPlayerControls(this.player)
    stylePlayer(this.player)

    this.progressBar = styleProgressBar(wrappers[0])
    this.timecode    = styleButtons(wrappers[1])
    styleRightControls(wrappers[1])
  }
}

module.exports = Skinner
