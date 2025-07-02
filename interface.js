let articulationsData = {}

let instrumentNames = []
let instrumentTables = []
let articulationNames = []

let restoreInstrument = 0

let currentInstrument = ''
let currentArticulation = ''
let currentArticulations = []
let currentCategories = []

let maxDelay = 0

outlets = 8

let outlet_cursor = 0

const KEY_SWITCH = outlet_cursor++
const DELAY = outlet_cursor++
const INSTRUMENT_RANGE = outlet_cursor++
const ARTICULATION_RANGE = outlet_cursor++
const ARTICULATION_COUNT = outlet_cursor++
const MAX_DELAY = outlet_cursor++
const INSTRUMENT_NAME = outlet_cursor++
const ARTICULATION_CATEGORIES = outlet_cursor++

const CATEGORIES = {
  Legato: 'Play',
  Long: 'Control On Variant',
  Short: 'LCD Handle',
  Ornament: 'Slider Range Value Variant 2',
  Technique: 'Text / Icon On (Inactive)'
}

/**
 * PUBLIC
 */

function bang (reload) {
  // post('Articulation controller loaded\n')

  const dict = new Dict('shared_js_data')

  if (dict.contains('instrumentNames') && !reload) {
    // post('Reusing TSV\n')
    instrumentNames = dict.get('instrumentNames')
    articulationsData = dict.get('articulationsData')
    maxDelay = dict.get('maxDelay')
    instrumentTables = dict.get('instrumentTables')
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
    dict.set('instrumentTables', tsv.instrumentTables)
    articulationsData = dict.get('articulationsData')
    instrumentTables = dict.get('instrumentTables')
  }

  updateInstrumentMenu()

  if (!currentInstrument) {
    if (restoreInstrument && instrumentNames.includes(restoreInstrument)) {
      currentInstrument = restoreInstrument
      // post('Restoring instrument: ' + currentInstrument + '\n')
      outlet(INSTRUMENT_NAME, [restoreInstrument])
    }
  }

  if (reload && currentArticulations) {
    outlet(DELAY, currentArticulations.map(a => Math.abs(getDelayCompensation(currentInstrument, a))))
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
  bang(true)
}

function delayEdit (value) {
  articulationsData.replace(`${currentInstrument}::${currentArticulation}::delay`, Math.round(-value))
}

function delaySave () {
  // post('delaySave' + '\n')
  const lines = []
  let index = 0

  for (const table of instrumentTables) {
    if (index > 0) {
      lines.push('')
    }

    lines.push('\t' + articulationsData.get(table[0]).getkeys().map(x => x.startsWith('#') ? '' : x).join('\t'))
    lines.push('\t' + articulationsData.get(table[0]).getkeys().map(k => articulationsData.get(table[0]).get(k).get('category')).join('\t'))

    for (const ins of table) {
      const delays = articulationsData.get(ins).getkeys().map(k => {
        const o = articulationsData.get(ins).get(k)
        const d = o.get('delay')
        const s = o.get('shiftKey')

        return s ? ('x' + s) : d === null ? 'x' : d
      })

      lines.push(ins + '\t' + delays.join('\t'))
    }

    index++
  }

  // post(lines.join('\n'))

  const devicePath = this.patcher.filepath
  const filePath = devicePath?.replace(/\/[^/]+\.amxd$/, '') + '/articulations.tsv'

  saveFile(filePath, lines)
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

  const [a, c] = getAvailableArticulations(instrument,
    filterLegato,
    filterLong,
    filterShort,
    filterOrnament,
    filterTechnique)

  currentArticulations = a
  currentCategories = c

  updateArticulationMenu()
}

function updateInstrumentMenu () {
  if (instrumentNames.length > 0) {
    // post('Updated INSTRUMENT_RANGE\n')
    outlet(INSTRUMENT_RANGE, ...instrumentNames)
  }
}

function updateArticulationMenu () {
  const colors = currentCategories.map(cat => CATEGORIES[cat])
  // post('Updated ARTICULATION_RANGE\n')
  // post('Updated ARTICULATION_COUNT\n')
  // post('Updated ARTICULATION_CATEGORIES: \n' + JSON.stringify(currentCategories) + '\n' + JSON.stringify(colors) + '\n')
  outlet(ARTICULATION_CATEGORIES, ...colors)
  outlet(ARTICULATION_RANGE, ...currentArticulations)
  outlet(ARTICULATION_COUNT, currentArticulations.length)
}

function setArticulationByName (articulation) {
  currentArticulation = articulation
  // post('Setting articulation: ' + articulation + '\n')

  if (!currentInstrument) {
    // post('Warning: No instrument selected\n')
    return
  }
}

function saveFile (filePath, lines) {
  const f = new File(filePath, 'write')

  if (f.isopen) {
    for (const l of lines) {
      f.writeline(l)
    }

    f.close()
  } else {
    // post('Could not open file at: ' + filePath + '\n')
    return false
  }
}

function readFile (filePath) {
  // post('Reading file: ' + filePath + '\n')

  const f = new File(filePath, 'read')

  if (f.isopen) {
    let content = ''

    while (f.position < f.eof) {
      content += f.readstring(1024) // Read in chunks
    }

    f.close()
    return content
  } else {
    // post('Could not open file at: ' + filePath + '\n')
    return false
  }
}

// Parse the TSV data
function parseTSVData () {
  const instrumentNames = []
  const articulationsData = {}
  const instrumentTables = []
  let maxDelay = 0

  const devicePath = this.patcher.filepath
  let tsvData

  if (!devicePath) {
    // post('Device path not found.\n')
  }

  let filePath = devicePath?.replace(/\/[^/]+\.amxd$/, '') + '/articulations.tsv'

  if (filePath) {
    tsvData = readFile(filePath)

    if (tsvData === false) {
      filePath = devicePath?.replace(/\/[^/]+\.amxd$/, '').replace(/\/[^/]+$/, '') + '/articulations.tsv'
      tsvData = readFile(filePath)
    }
  }

  tsvData = tsvData || `\tLegato\tLong\tLong CS\tLong Flaut\tSpiccato\tStaccato\tPizzicato\tCol Legno\tTremolo\tTrill M2\tTrill m2\tLong Sul Tasto\tLong Harmonics\tShort Harmonics\tBartok\tLong Marcato\tMarcato\tTremolo Sul Pont\tTremolo CS\tLong Sul Pont\tSpiccato CS
\tLegato\tLong\tLong\tLong\tShort\tShort\tShort\tTechnique\tOrnament\tOrnament\tOrnament\tTechnique\tTechnique\tTechnique\tShort\tLong\tShort\tOrnament\tOrnament\tTechnique\tShort
Example 1\t-70\t-100\t-90\t-120\t-30\t-50\t-20\t-50\t-40\t-40\t-40\t-140\t0\t0\t-20\tx\t-110\tx\tx\tx\tx
Example 2\t-80\t-100\t-90\t-120\t-50\t-50\t-40\t-50\t-30\t-30\t-30\t-100\t0\t0\t-60\t-100\tx\t-50\t-70\t-100\t-80`

  const lines = tsvData.split('\n')
  let current_articulations = null
  let current_categories = null
  let current_table = 0

  for (let cursor = 0; cursor < lines.length; cursor++) {
    const line = lines[cursor]

    if (!lines[cursor].trim()) {
      current_articulations = null
      current_categories = null
    } else if (!current_articulations) {
      current_articulations = line.split('\t').slice(1)
      current_table++
    } else if (!current_categories) {
      current_categories = line.split('\t').slice(1)
    } else {
      const cells = line.split('\t')
      const instrument = cells[0]
      const delays = cells.slice(1)

      instrumentNames.push(instrument)
      articulationsData[instrument] = {}

      instrumentTables[current_table - 1] = instrumentTables[current_table - 1] || []
      instrumentTables[current_table - 1].push(instrument)

      for (let j = 0; j < current_articulations.length; j++) {
        if (!current_articulations[j] && !current_articulations[j + 1]) {
          break
        }

        const delay = (delays[j] === 'x' || delays[j] === 'xx' || ((typeof delays[j] === 'string') && (delays[j][0] === 'x')))
          ? null
          : parseInt(delays[j])

        maxDelay = Math.max(Math.abs(delay || 0), maxDelay)

        const shiftKey = /x\d+/.test(delays[j])
          ? Number.parseInt(delays[j].slice(1))
          : (delays[j] === 'xx') ? 1 : 0

        const articulation = current_articulations[j] || ('#' + j)

        articulationsData[instrument][articulation] = {
          delay,
          category: current_categories[j],
          shiftKey
        }
      }
    }
  }

  // post('Parsed ' + JSON.stringify(articulationsData, null, 2) + '\n')
  // post('Parsed ' + instrumentsList.length + ' instruments\n')
  // post('Max delay: ' + maxDelay + '\n')

  return {
    maxDelay,
    instrumentNames,
    articulationsData,
    instrumentTables
  }
}

function getAvailableArticulations (instrument,
                                    filterLegato,
                                    filterLong,
                                    filterShort,
                                    filterOrnament,
                                    filterTechnique) {
  const available = []
  const categories = []
  articulationNames = []

  const cats = [filterLegato, filterLong, filterShort, filterOrnament, filterTechnique]

  if (articulationsData.contains(instrument)) {
    const ins = articulationsData.get(instrument)

    for (const art of ins.getkeys()) {
      if (ins.contains(art) &&
        cats.includes(ins.get(art).get('category')) &&
        ins.get(art).get('delay') !== null) {
        available.push(art)
        categories.push(ins.get(art).get('category'))
      }

      if (ins.contains(art) && ins.get(art).get('shiftKey')) {
        for (let i = 0; i < ins.get(art).get('shiftKey'); i++) {
          articulationNames.push(null)
        }
      }

      if (ins.contains(art) && (ins.get(art).get('delay') !== null)) {
        articulationNames.push(art)
      }
    }
  }

  return [available, categories]
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
