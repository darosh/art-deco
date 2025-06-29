function calculateGridLayout (areaWidth, areaHeight, minRowHeight, minColWidth, count, fillMode = 'optimal') {
  // Handle edge cases
  if (count <= 0) {
    return { cols: 0, rows: 0, item_w: 0, item_h: 0 }
  }

  if (count === 1) {
    return {
      cols: 1,
      rows: 1,
      item_w: areaWidth,
      item_h: areaHeight
    }
  }

  // Check if we can only fit one row (height constraint)
  const maxRows = Math.floor(areaHeight / minRowHeight)
  // post('maxRows: ' + maxRows + '\n')
  if (maxRows <= 1) {
    return {
      cols: count,
      rows: 1,
      item_w: areaWidth / count,
      item_h: areaHeight
    }
  }

  // Check if we can only fit one column (width constraint)
  const maxCols = Math.floor(areaWidth / minColWidth)
  // post('maxCols: ' + maxCols + '\n')
  if (maxCols <= 1) {
    return {
      cols: 1,
      rows: count,
      item_w: areaWidth,
      item_h: areaHeight / count
    }
  }

  // Handle different fill modes
  if (fillMode === 'fill-width') {
    return calculateFillWidth(areaWidth, areaHeight, minRowHeight, minColWidth, count, maxRows, maxCols)
  } else if (fillMode === 'maximize') {
    return calculateMaximize(areaWidth, areaHeight, minRowHeight, minColWidth, count, maxRows, maxCols)
  } else if (fillMode === 'balanced') {
    return calculateBalanced(areaWidth, areaHeight, minRowHeight, minColWidth, count, maxRows, maxCols)
  }

  // Default: optimal (square-like) layout
  return calculateOptimal(areaWidth, areaHeight, minRowHeight, minColWidth, count, maxRows, maxCols)
}

function calculateOptimal (areaWidth, areaHeight, minRowHeight, minColWidth, count, maxRows, maxCols) {
  let bestCols = 1
  let bestRows = count
  let bestRatio = Infinity

  // Try different column counts
  for (let cols = 1; cols <= Math.min(count, maxCols); cols++) {
    const rows = Math.ceil(count / cols)

    // Check if this configuration fits
    if (rows > maxRows) continue

    const itemWidth = areaWidth / cols
    const itemHeight = areaHeight / rows

    // Check minimum constraints
    if (itemWidth < minColWidth || itemHeight < minRowHeight) continue

    // Calculate aspect ratio difference from square (1:1)
    const aspectRatio = itemWidth / itemHeight
    const ratioScore = Math.abs(aspectRatio - 1)

    // Prefer configurations closer to square items
    if (ratioScore < bestRatio) {
      bestRatio = ratioScore
      bestCols = cols
      bestRows = rows
    }
  }

  return {
    cols: bestCols,
    rows: bestRows,
    item_w: areaWidth / bestCols,
    item_h: areaHeight / bestRows
  }
}

function calculateFillWidth (areaWidth, areaHeight, minRowHeight, minColWidth, count, maxRows, maxCols) {
  // Find the minimum number of rows needed
  let bestCols = Math.ceil(count / maxRows)
  let bestRows = Math.ceil(count / bestCols)

  // post('bestCols: ' + bestCols + '\n')
  // post('bestRows: ' + bestRows + '\n')

  // Ensure we don't exceed constraints
  if (bestCols > maxCols) {
    bestCols = maxCols
    bestRows = Math.ceil(count / bestCols)

    // post('bestCols: ' + bestCols + '\n')
    // post('bestRows: ' + bestRows + '\n')
  }

  bestCols = bestCols - Math.floor((bestCols * bestRows - count) / bestRows)

  // if (maxRows < maxCols) {
  //   bestCols = Math.min(maxCols, count)
  //   bestRows = Math.ceil(count / bestCols)
  //
  //   post('bestCols: '+ bestCols + '\n')
  //   post('bestRows: '+ bestRows + '\n')
  // }

  return {
    cols: bestCols,
    rows: bestRows,
    item_w: areaWidth / bestCols, // Always use full width
    item_h: areaHeight / bestRows
  }
}

function calculateMaximize (areaWidth, areaHeight, minRowHeight, minColWidth, count, maxRows, maxCols) {
  // Try to fit as many columns as possible while respecting minimums
  let bestCols = Math.min(count, maxCols)
  let bestRows = Math.ceil(count / bestCols)

  // If rows exceed limit, reduce columns
  if (bestRows > maxRows) {
    bestRows = maxRows
    bestCols = Math.ceil(count / bestRows)
  }

  bestCols = bestCols - Math.floor((bestCols * bestRows - count) / bestRows)

  return {
    cols: bestCols,
    rows: bestRows,
    item_w: areaWidth / bestCols,
    item_h: areaHeight / bestRows
  }
}

function calculateBalanced (areaWidth, areaHeight, minRowHeight, minColWidth, count, maxRows, maxCols) {
  // Find the configuration that best utilizes both width and height
  let bestCols = 1
  let bestRows = count
  let bestUtilization = 0

  for (let cols = 1; cols <= Math.min(count, maxCols); cols++) {
    const rows = Math.ceil(count / cols)

    if (rows > maxRows) continue

    const itemWidth = areaWidth / cols
    const itemHeight = areaHeight / rows

    // Check minimum constraints
    if (itemWidth < minColWidth || itemHeight < minRowHeight) continue

    // Calculate space utilization (what percentage of total area is used)
    const usedWidth = cols * itemWidth
    const usedHeight = rows * itemHeight
    const utilization = (usedWidth * usedHeight) / (areaWidth * areaHeight)

    // Also consider aspect ratio - prefer items that aren't too extreme
    const aspectRatio = itemWidth / itemHeight
    const aspectPenalty = aspectRatio > 4 || aspectRatio < 0.25 ? 0.5 : 1 // Penalize very wide or very tall items

    const score = utilization * aspectPenalty

    if (score > bestUtilization) {
      bestUtilization = score
      bestCols = cols
      bestRows = rows
    }
  }

  bestCols = bestCols - Math.floor((bestCols * bestRows - count) / bestRows)

  return {
    cols: bestCols,
    rows: bestRows,
    item_w: areaWidth / bestCols,
    item_h: areaHeight / bestRows
  }
}

function anything () {
  const args = arrayfromargs(arguments)

  log('args:', args)

  if (args.length === 5) {
    // const { cols, rows, item_h, item_w } = calculateGridLayout(args[0], args[1], args[2], args[3], args[4])
    // const { cols, rows, item_h, item_w } = calculateGridLayout(args[0], args[1], args[2], args[3], args[4], 'maximize')
    // const { cols, rows, item_h, item_w } = calculateGridLayout(args[0], args[1], args[2], args[3], args[4], 'balanced')

    const { cols, rows, item_h, item_w } =
      args[0] > (args[1] * (args[3] / args[2]) / 2)
      ? calculateGridLayout(args[0], args[1], args[2], args[3], args[4], 'maximize')
      : calculateGridLayout(args[0], args[1], args[2], args[3], args[4], 'fill-width')

    // post(JSON.stringify({ cols, rows, item_h, item_w }) + '\n')
    outlet(0, [cols, rows, item_w, item_h])
  }
}

function log(...msg) {
  // post(msg.map(m => typeof m === 'object' ? JSON.stringify(m, null, 2) : m ).join(' ') + '\n')
}
