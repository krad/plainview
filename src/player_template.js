module.exports = `
<div id="video-controls" class="controls" data-state="hidden">
      <button id="playpause" type="button" data-state="play">Play</button>
      <div class="progress">
        <progress value="0" max="100">
          <span id="progress-bar"></span>
        </progress>
      </div>
      <button id="mute" type="button" data-state="mute">Mute/Unmute</button>
      <button id="volinc" type="button" data-state="volup">Vol+</button>
      <button id="voldec" type="button" data-state="voldown">Vol-</button>
      <button id="fs" type="button" data-state="go-fullscreen">Fullscreen</button>
</div>
`
