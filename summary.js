async function parseTSVData () {
  const instrumentNames = []
  const articulationsData = {}
  let maxDelay = 0
  var filePath = './articulations.tsv'
  const tsvData = await Deno.readTextFile(filePath)

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

  console.log('Parsed ' + instrumentNames.length + ' instruments')

  const summary = Object.entries(articulationsData).reduce((acc, [ins, arts]) => {
    Object.keys(arts).map(art => {
      acc[arts[art].category] = acc[arts[art].category] || []
      if(!acc[arts[art].category].includes(art)) {
        acc[arts[art].category].push(art)
      }
    })

    return acc
  }, {})

  console.log(summary)
}

await parseTSVData()
