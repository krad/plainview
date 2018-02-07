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
  progress { color: #209cee }
  progress::-moz-progress-bar { background: #209cee;}
  progress::-webkit-progress-value { background: #209cee; }
  progress[aria-valuenow]:before  { background: #209cee; }
  .player-controls button:focus { outline: none; }
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
  return imageWith('iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAYAAACMRWrdAAAABGdBTUEAALGPC/xhBQAAALNJREFUaAXt2dEKhSAQRdHr/f9/rh6FmBhQYZTlkwxlx72lQtv1tN9ga08bHOJ1+2iu/2vEQwomtptIxhgrQsBSLCIiHeNYYy37hV/xd5HG312YzXusMRPrVsMWXca20NSFZKyDoYsAAggggAACCCCAAAIIIIAAAggggMBcAg4l5vJcP5oN0/WM5z7hWGPpl8cXzxWnndmTyyjXscZMLFJetc5YVTNRLsYiMlXrjFU1E+W6ARvpIC9jq9irAAAAAElFTkSuQmCC')
}

function imageTag(payload) {
  return '<img height="12" width="12" src="' + payload + '" />'
}

module.exports = {
  html: html(),
  playButton: imageTag(playButton()),
  pauseButton: imageTag(pauseButton()),
  restartButton: imageTag(restartButton()),
  fullscreenButton: imageTag(fullscreenButton())
}
