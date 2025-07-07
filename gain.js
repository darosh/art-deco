outlets = 9

let outlet_cursor = 0

const OUT_CC = outlet_cursor++
const OUT_NOTE = outlet_cursor++
const OUT_RESET = outlet_cursor++
const OUT_READ = outlet_cursor++
const OUT_INFO = outlet_cursor++
const OUT_SHOW = outlet_cursor++
const OUT_SLIDE = outlet_cursor++
const OUT_MAX = outlet_cursor++
const OUT_MIN = outlet_cursor++

const CC_MIX = 22
const CC_MOD = 1
const CC_GLOBAL = 7

const PAUSE = 25
const NOTE_TIME = 2000

let measured = []

function play (note) {
  outlet(OUT_RESET, 1)

  new Task(() => outlet(OUT_CC, [1, CC_MIX])).schedule(0)
  new Task(() => outlet(OUT_CC, [80, CC_GLOBAL])).schedule(PAUSE)
  new Task(() => outlet(OUT_CC, [127, CC_MIX])).schedule(PAUSE * 2)
  new Task(() => outlet(OUT_CC, [100, CC_MOD])).schedule(PAUSE * 3)
  new Task(() => outlet(OUT_NOTE, [note, 100])).schedule(PAUSE * 4)
  new Task(() => outlet(OUT_READ, 1)).schedule(PAUSE * 4 + NOTE_TIME + PAUSE)
}

function reset () {
  measured = []
  outlet(OUT_MAX, -70)
  outlet(OUT_MIN, -70)
  outlet(OUT_SHOW, 1)
  outlet(OUT_INFO, measured.map(x => x.toFixed(1)).join(', '))
}

function done () {
  reset()
  outlet(OUT_CC, [128, CC_GLOBAL])
}

function next (dB) {
  // post('Measured dB: ' + dB + '\n')

  if (dB === -70) {
    outlet(OUT_SHOW, 1)
    return
  }

  measured.push(dB)
  const max = Math.max(...measured)
  // const min = Math.min(...measured.filter(x => x > (max - 36)))
  const min = Math.min(...measured)
  const cor = min - dB
  const val = Math.round(fromDb(cor)) || 1

  // post('Max dB: ' + max + '\n')
  // post('Correction dB: ' + cor + '\n')
  // post('Correction value: ' + val + '\n')

  outlet(OUT_CC, [val, CC_MIX])
  outlet(OUT_INFO, [...measured.map(x => x.toFixed(1)).reverse().slice(0, 10)].join(', ') 
    + (measured.length > 10 ? ', ...' : ''))
  outlet(OUT_SLIDE, val)
  outlet(OUT_MAX, max)
  outlet(OUT_MIN, min)

  new Task(() => outlet(OUT_SHOW, 1)).schedule(PAUSE)
}

function toDb (value) {
  return 20 * Math.log10(value / 127)
}

function fromDb (dB) {
  return 127 * Math.pow(10, (dB / 20))
}
