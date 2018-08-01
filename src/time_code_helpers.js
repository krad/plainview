export const pad = (number, size) => {
  var s = String(parseInt(number))
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
}

export const convertSeconds = (seconds) => {
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

export const makeTimeCode = (seconds) => {
  var c = convertSeconds(seconds)
  var timeComponents
  if (c.h <= 0) { timeComponents = [c.m, c.s] }
  else { timeComponents = [c.h, c.m, c.s] }

  return timeComponents.map(function(t){ return pad(t, 2) }).join(':')
}

export const makeDurationCounter = (current, overall) => {
  var timeComponents = [makeTimeCode(current), makeTimeCode(overall)]
  var displayTime    = timeComponents.join(' / ')
  return displayTime
}

export const percentageComplete = (currentTime, duration) => {
    const percentage = Math.floor((100 / duration) * currentTime)
    return percentage
}
