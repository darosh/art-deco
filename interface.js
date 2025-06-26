const VERSION = 13

var articulationsData = {}

var instrumentNames = []
var articulationNames = []

var restoreInstrument = 0

var currentInstrument = ''
var currentArticulation = ''
var currentArticulations = []
// var currentDelayCompensation = 0

var maxDelay = 0

outlets = 7

let outlet_cursor = 0

const KEY_SWITCH = outlet_cursor++
const DELAY = outlet_cursor++
const INSTRUMENT_RANGE = outlet_cursor++
const ARTICULATION_RANGE = outlet_cursor++
const ARTICULATION_COUNT = outlet_cursor++
const MAX_DELAY = outlet_cursor++
const INSTRUMENT_NAME = outlet_cursor++

// post('interface.js version: ' + VERSION + '\n')

/**
 * PUBLIC
 */

function bang () {
  // post('Articulation controller loaded\n')

  const dict = new Dict('shared_js_data')

  if (dict.contains("instrumentNames")) {
    // post('Reusing TSV\n')
    instrumentNames = dict.get('instrumentNames')
    articulationsData = dict.get('articulationsData')
    maxDelay = dict.get('maxDelay')
    // post('Reused instruments: ' + JSON.stringify(instrumentNames) + '\n')
    // post('Reused data: ' + JSON.stringify(articulationsData) + '\n')

  } else {
    // post('Loading TSV\n')
    const tsv = parseTSVData()
    instrumentNames = tsv.instrumentNames
    articulationsData = tsv.articulationsData
    maxDelay = tsv.maxDelay
    dict.set('instrumentNames', instrumentNames)
    dict.set('articulationsData', articulationsData)
    dict.set('maxDelay', maxDelay)
    articulationsData = dict.get('articulationsData')
  }

  updateInstrumentMenu()

  if (!currentInstrument) {
    if (restoreInstrument && instrumentNames.includes(restoreInstrument)) {
      currentInstrument = restoreInstrument
      // post('Restoring instrument: ' + currentInstrument + '\n')
      outlet(INSTRUMENT_NAME, [restoreInstrument])
    }

    // else {
    //   currentInstrument = instrumentsList[0]
    //   // post('Forcing first instrument: ' + currentInstrument + '\n')
    // }

    // loadArticulations(currentInstrument)
    // setArticulation(0)
  }
  outlet(MAX_DELAY, [maxDelay])
}

function setInstrument (instrument) {
  if (instrument === 'N/A' || instrument === '_') {
    // post('Ignoring instrument: ' + instrument + '\n')

    return
  }

  if (!articulationsData.contains(instrument)) {
    restoreInstrument = instrument
    // post('Missing instrument: ' + instrument + '\n')

    return
  }

  // post('Setting instrument: ' + instrument + '\n')
  currentInstrument = instrument
  loadArticulations(instrument)

  outlet(DELAY, currentArticulations.map(a => Math.abs(getDelayCompensation(currentInstrument, a))))
  outlet(KEY_SWITCH, currentArticulations.map(a => getKeySwitch(a)))
}

function setArticulation (articulationIndex) {
  // post('Setting articulation index: ' + articulationIndex + '\n')
  const articulationName = currentArticulations[articulationIndex]

  setArticulationByName(articulationName)
}

function reload () {
  instrumentNames = []
  articulationsData = []
  bang()
}

/**
 * PRIVATE
 */

function loadArticulations (instrument) {
  // post('Loading articulations\n')

  const filterLegato = this.patcher.getnamed('Legato').getvalueof() && 'Legato'
  const filterLong = this.patcher.getnamed('Long').getvalueof() && 'Long'
  const filterShort = this.patcher.getnamed('Short').getvalueof() && 'Short'
  const filterOrnament = this.patcher.getnamed('Ornament').getvalueof() && 'Ornament'
  const filterTechnique = this.patcher.getnamed('Technique').getvalueof() && 'Technique'

  currentArticulations = getAvailableArticulations(instrument,
    filterLegato,
    filterLong,
    filterShort,
    filterOrnament,
    filterTechnique)

  updateArticulationMenu()
}

function updateInstrumentMenu () {
  if (instrumentNames.length > 0) {
    // post('Updated INSTRUMENT_RANGE\n')
    outlet(INSTRUMENT_RANGE, ...instrumentNames)
  }
}

function updateArticulationMenu () {
  if (currentArticulations.length > 0) {
    // post('Updated ARTICULATION_RANGE\n')
    // post('Updated ARTICULATION_COUNT\n')
    outlet(ARTICULATION_RANGE, ...currentArticulations)
    outlet(ARTICULATION_COUNT, currentArticulations.length)
  }
}

function setArticulationByName (articulation) {
  currentArticulation = articulation
  // post('Setting articulation: ' + articulation + '\n')

  if (!currentInstrument) {
    // post('Warning: No instrument selected\n')

    return
  }

  // const delay = getDelayCompensation(currentInstrument, articulation)

  // if (delay !== null && delay !== undefined) {
  //   currentDelayCompensation = delay
  // post('Updated DELAY\n')
  // outlet(DELAY, Math.abs(delay))
  // }

  // const keySwitch = getKeySwitch(articulation)

  // if (keySwitch !== null && keySwitch !== undefined) {
  // post('Updated KEY_SWITCH\n')
  // outlet(KEY_SWITCH, keySwitch)
  // }
}

function readFile (filePath) {
  // post('Reding file: ' + filePath + '\n')

  var f = new File(filePath, 'read')

  if (f.isopen) {
    var content = ''

    while (f.position < f.eof) {
      content += f.readstring(1024) // Read in chunks
    }

    f.close()
  } else {
    // post('Could not open file at: ' + filePath + '\n')
    return false
  }

  return content
}

// Parse the TSV data
function parseTSVData () {
  const instrumentNames = []
  const articulationsData = {}
  let maxDelay = 0

  var devicePath = this.patcher.filepath
  var tsvData

  if (!devicePath) {
    // post('Device path not found.\n')
  }

  var filePath = devicePath?.replace(/\/[^/]+\.amxd$/, '') + '/articulations.tsv'

  if (filePath) {
    tsvData = readFile(filePath)

    if (tsvData === false) {
      filePath = devicePath?.replace(/\/[^/]+\.amxd$/, '').replace(/\/[^/]+$/, '') + '/articulations.tsv'
      tsvData = readFile(filePath)
    }
  }

  tsvData = tsvData || `\tLegato\tLong\tLong CS\tLong Flaut\tSpiccato\tStaccato\tPizzicato\tCol Legno\tTremolo\tTrill M2\tTrill m2\tLong Sul Tasto\tLong Harmonics\tShort Harmonics\tBartok\tLong Marcato\tMarcato\tTremolo Sul Pont\tTremolo CS\tLong Sul Pont\tSpiccato CS
\tLegato\tLong\tLong\tLong\tShort\tShort\tShort\tTechnique\tOrnament\tOrnament\tOrnament\tTechnique\tTechnique\tTechnique\tShort\tLong\tShort\tOrnament\tOrnament\tTechnique\tShort
Violins 1 Leader\t-70\t-100\t-90\t-120\t-30\t-50\t-20\t-50\t-40\t-40\t-40\t-140\t0\t0\t-20\tx\t-110\tx\tx\tx\tx
Violins 1\t-80\t-100\t-90\t-120\t-50\t-50\t-40\t-50\t-30\t-30\t-30\t-100\t0\t0\t-60\t-100\tx\t-50\t-70\t-100\t-80
Violins 2 Leader\t-80\t-80\t-90\t-120\t-20\t-50\t-20\t-30\t-40\t-40\t-20\t-100\t0\t0\t-20\tx\t-80\tx\tx\tx\tx
Violins 2\t-120\t-100\t-100\t-120\t-30\t-50\t-40\t-40\t-40\t-30\t-30\t-100\t0\t0\t-40\t-80\tx\t-40\t-50\t-120\t-60
Violas Leader\t-80\t-80\t-90\t-120\t-30\t-50\t-30\t-50\t-40\t-20\t-30\t-100\t0\t0\t-40\tx\t-80\tx\tx\tx\tx
Violas\t-120\t-100\t-80\t-120\t-30\t-40\t-30\t-30\t-20\t-30\t-40\t-100\t0\t0\t-40\t-80\tx\t-30\t-40\t-120\t-70
Celli Leader\t-120\t-120\t-120\t-120\t-70\t-70\t-30\t-30\t-20\t-40\t-40\t-130\t0\t0\t-30\tx\t-90\tx\tx\tx\tx
Celli\t-120\t-120\t-120\t-120\t-40\t-60\t-50\t-60\t-20\t-40\t-20\t-120\t0\t0\t-50\t-100\tx\t-30\t-30\t-120\t-70`

  var lines = tsvData.split('\n')
  let current_articulations = null
  let current_categories = null

  for (var cursor = 0; cursor < lines.length; cursor++) {
    const line = lines[cursor]

    if (!lines[cursor].trim()) {
      current_articulations = null
      current_categories = null
    } else if (!current_articulations) {
      current_articulations = line.split('\t').slice(1)
    } else if (!current_categories) {
      current_categories = line.split('\t').slice(1)
    } else {
      var cells = line.split('\t')
      var instrument = cells[0]
      var delays = cells.slice(1)

      instrumentNames.push(instrument)
      articulationsData[instrument] = {}

      for (var j = 0; j < current_articulations.length; j++) {
        if (!current_articulations[j]) {
          break
        }

        const delay = (delays[j] === 'x' || delays[j] === 'xx') ? null : parseInt(delays[j])
        maxDelay = Math.max(Math.abs(delay || 0), maxDelay)

        articulationsData[instrument][current_articulations[j]] = {
          delay,
          category: current_categories[j],
          shiftKey: delays[j] === 'xx'
        }
      }
    }
  }

  // post('Parsed ' + instrumentsList.length + ' instruments\n')
  // post('Max delay: ' + maxDelay + '\n')

  return {
    maxDelay,
    instrumentNames,
    articulationsData
  }
}

function getAvailableArticulations (instrument,
                                    filterLegato,
                                    filterLong,
                                    filterShort,
                                    filterOrnament,
                                    filterTechnique) {
  const available = []
  articulationNames = []

  const cats = [filterLegato, filterLong, filterShort, filterOrnament, filterTechnique]

  if (articulationsData.contains(instrument)) {
    const ins = articulationsData.get(instrument)

    for (const art of ins.getkeys()) {
      if (ins.contains(art) &&
        cats.includes(ins.get(art).get('category')) &&
        ins.get(art).get('delay') !== null) {
        available.push(art)
      }

      if (ins.contains(art) && ins.get(art).get('shiftKey')) {
        articulationNames.push(null)
      }

      if (ins.contains(art) && (ins.get(art).get('delay') !== null)) {
        articulationNames.push(art)
      }
    }
  }

  if (available.length === 1) {
    available.push(available[0])
  } else if (available.length === 0) {
    available.push('N/A')
    available.push('N/A')
  }

  return available
}

function getDelayCompensation (instrument, articulation) {
  if (articulationsData.contains(instrument) && articulationsData.get(instrument).contains(articulation)) {
    return articulationsData.get(instrument).get(articulation).get('delay')
  }

  return null
}

function getKeySwitch (articulation) {
  return articulationNames.indexOf(articulation) || 0
}
