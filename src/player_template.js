module.exports = `
<div class="progress">
    <progress id='progress-bar' min='0' max='100' value='0'></progress>
</div>

<button id="playpause" type="button" data-state="play">Play</button>
<button id="mute" type="button" data-state="mute">Mute</button>
<button id="volinc" type="button" data-state="volup">Vol+</button>
<button id="voldec" type="button" data-state="voldown">Vol-</button>
<button id='timecode' type='button' data-state='timecode'>0:00 / 0:00</button>

<span class='right-controls'>
  <button id="fs" type="button" data-state="go-fullscreen">Fullscreen</button>
</span>
`
