function html() {
  return `
 <div class="progress">
     <progress id='progress-bar' min='0' max='100' value='0'></progress>
 </div>

 <button id="playpause" type="button" data-state="play">Play</button>
 <button id="mute" type="button" data-state="mute">Mute</button>
 <button id='timecode' type='button' data-state='timecode'>0:00 / 0:00</button>

 <span class='right-controls'>
   <button id="fs" type="button" data-state="go-fullscreen">Fullscreen</button>
 </span>

 <style media="screen">
  .player-controls button { margin:0; padding:0; }

  .progress {
     margin: 0 !important;
     padding: 0 !important;
   }

   progress {
     color: #209cee !important;
   }

   .progress:not(:last-child) {
     margin:0 !important;
   }

   progress::-moz-progress-bar { background: #209cee !important; margin: 0 !important; padding: 0 !important; }
   progress::-webkit-progress-value { background: #209cee !important; }
   progress[aria-valuenow]:before  { background: #209cee !important; }

   #progress-bar {
     padding:0 !important;
     margin: 0 !important;
   }

   .player-controls button:focus { outline: none !important; }
   .player-controls button:active { outline: none !important; }

   button img { height:12px !important; padding:0; margin:0; }
 </style>
 `
}

function imageWith(payload) {
  return 'data:image/png;base64,' + payload
}

function playButton() {
  return imageWith('iVBORw0KGgoAAAANSUhEUgAAACIAAAA2CAYAAACiAEtPAAAABGdBTUEAALGPC/xhBQAAAihJREFUWAnNWT0sBEEUvvUXiUj0CoVGT6JSXSE6PxEqrQKVqOioJBqJRkel01GpRJyCgkKlUEgIiUQUcsH6vmWScdm9mdvbmTeTvJ2ZN+/m+/bNu9n5KcVxvAvpKEknkGCqQHpFuSQ0fh+PyEbEyGhEWKxCFkTI1BBR1T0UOr0SUsgp+SV0fd7IpBDQVc+olL2Q0VEzyp/QLzsnkwGepj6AsssZoTTEOrprtPU7IVMHNKvpFQ1jhZPJQjPov9C+CokKI2QANDUfwqC7EDImJIv2W9gMNE3GAsjG5A1G402RsUGxtPmG3TqkJRchS5BGzI5g3NMomYgIjf7Iwv4ONhNRFN1Y2CYm+dxo7p2T3jneccZs+mdBjzhOm+i/1UTI1dDU4p5AMYuheqltUHVfRIh3D5kEmSsFrueuYkTHUGUuss4wTHNKoec+iRCXy08uQ7ch7ToRn0Oj47J8CpnGUD2x4tsjxFSJWxeui4epkPSIIlRFYVHSI4pIkrf9q/mvPAByCnFyIekRBusgSfD9pYjsALus/jEk4ntoPoA5DwL7BNeTTyJBTPH86A3BE6nfGXrGR4xsAWcUJDK/vCRSwszmKr2jY+uFkasYCWKpeAxHMx6s16tFDw23ExuQfHFXUIAEscEKYsspvgnnscQaRPRYIoiDmiCOrsQP83i8uZJMOi4fhnkkiAPfII7AuRsTvRTgNcmSy1DI7FuLkSAujiogJH6VFsTl4g9YGMcldXQ1rgAAAABJRU5ErkJggg')
}

function pauseButton() {
  return imageWith('iVBORw0KGgoAAAANSUhEUgAAACIAAAAmCAYAAACh1knUAAAABGdBTUEAALGPC/xhBQAAAFxJREFUWAnt0rEKACEMRMHz/v+f1fpV2lhNuoUQwrBj7vkuZuw5Wb+9+58cfbHjkSoTIVKBZh0hUoFmHSFSgWYdIVKBZh0hUoFmHSFSgWYdIVKBZh0hUoFmHanIAg4ICEibYIZzAAAAAElFTkSuQmCC')
}

function restartButton() {
  return imageWith('iVBORw0KGgoAAAANSUhEUgAAACgAAAApCAYAAABHomvIAAAABGdBTUEAALGPC/xhBQAAA5RJREFUWAnNmUtIFWEUx71WapbeUulF5UIyJAwligJzUS2KaFNELwtXtWkVREQtdNdrIUEPCtq0bRGFRFCQJvRYtFCiJ12oNHxURlFm1O135nrvzJ17ZuaOc+XOgd+db853zvn+zsw3j8+CAgeLx+P1sMOhO/9uxJ2HX7DOSw0x06AYZsFM2ffKCdQ/MchXtmLDUGMtyH4J7IQbEAPNvuN8CVdgCxRZawRqU+wAWO01O5WwEq7CKPi1byRcg+pA4iSZIg+V0XvwyWkPamMUOANzJiWUxDoXBa9c+vx2DZLQ5CWyUAk4qPiSrtpkIwfbedS4j8hWt1oRayfBxewPQIXV79Iep+8JdMF7GAKZDItgMWyERvCy9kgk0uYVJNfeXsjG/hEks7Pcqygx1XASZJK42X6vWiLwgVsFW5/cRrI5Osa4xFbBRVsN667cc1c7iqSz1hqdZbufuCWORZUO4ltAZrJmH3GWKWnGreWslpGFr48Yz1NtHZT4JpAjplm7NdZoE1UEQ1q0h+8t/XLzdT41GaMlHOTIkdRMLh2Z4abh2KVF2nwyMZ7DJdgDMlMDGTUugGYdaYWJuKdE/cX3DDpgO1SlJeVgh5oVoD02R/AnXjho1IAcnXF4BKdhK0RzoMGzBOOcAM2ajWR6GmATlHpWm4IAxp0Pcrbsdm4KhptcSZTJmbNbr1TTnsWTGyVY1h0lfan4wiIwpgiMckhLwyJQXlA0WxAWgaOaOnzRsAhMf3KYakfCInChqSnVitMaDIvAupQss/GZl9jxsAjcZupKtd5IK+8CuZXId87ylCyz0Wk289hC4GX7I2Rivz6PshJDI2QZ/FEEvguDuEKE3VXEietoGASechD3AX9JUuD0ZEO2dKxgk3gPs3Yk2n1M+55Mt38P4xwm65hDZhvjjKl9JJZBDDSTd7ZAh558WaZzW995LDGquKSTgGbQLlzchnXyK0fal5GzHp4aFfSfAdzZfecQ2KrXSHnlaF6HzSDLJarRNxtkHfE2uJl8J6/ViqStzVgDSDjCvrx2O8ZMxP9gK+sz/fAJ5LpOrs2soe34B9An9hP2cd3dNPb8/CByNzitAtAV2GQlYZUfTRmxFGiE3sBSMgt048rumstQZXNQSFYe5PPwCwQ1WU6emv8eULgcjsML8GMyqbrgEMyw/f2uu14TwDGZgRro3ACyLiMP9kqYC79BJox8Z8i2G24xCYbZ+rb/z4ZZzG9hq34AAAAASUVORK5CYII=')
}

function fullscreenButton() {
  return imageWith('iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABGdBTUEAALGPC/xhBQAAAQlJREFUaAXtmjEKAjEQRROxsBIExcrG0qN4Fc9l5Rm8gngFsbGxFOx00n4TlpiVWeGlm0lm5+/7hF02G15t4xh6HCbl/K2cUY86XC/FjbjizzQfZ3IptS3kNX3XRGO8s/ppxzVmNr/XNTFtro9kjFFzQ4lN7tK03FQPe0SJeMc44u2A9scRJeId44i3A9ofR5SId5zetQ7eIir7P/9Qc+UtshwCEIAABCAAAQhAAAIQgAAEIBDSscJVOdipwkpzQ4lN78K0nFQP5yNKxDvmA523A9ofR5SId4wj3g5o/+wPA/bQ2ejCQvywh+elMFedtr5rK5p0FM6z81bcMvg7KEu1Iclmb4D3k9I3l5EbOnwhcKkAAAAASUVORK5CYII=')
}

function colorBars() {
  return imageWith('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')
}

function imageTag(payload, width, height, alt) {
  var w = 12
  var h = 12
  if (width) { w = width }
  if (height) { h = height }

  var imgStr = '<img width="'
  imgStr += w
  imgStr += '" height="'
  imgStr += h
  imgStr += '" src="'
  imgStr += payload
  imgStr += '"'

  if (alt) { imgStr += 'alt="' + alt + '"' }

  imgStr += ' />'

  return imgStr
}

module.exports = {
  html: html(),
  playButton: imageTag(playButton()),
  pauseButton: imageTag(pauseButton()),
  restartButton: imageTag(restartButton()),
  fullscreenButton: function(w, h, alt) { return imageTag(fullscreenButton(), w, h, alt) },
  colorBars: colorBars(),
}
