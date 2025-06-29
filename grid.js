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
  }
}

function calculateFillWidth (areaWidth, areaHeight, minRowHeight, minColWidth, count, maxRows, maxCols) {
  // Find the minimum number of rows needed
  let bestCols = Math.ceil(count / maxRows)
  let bestRows = Math.ceil(count / bestCols)

  // Ensure we don't exceed constraints
  if (bestCols > maxCols) {
    bestCols = maxCols
    bestRows = Math.ceil(count / bestCols)
  }

  bestCols = bestCols - Math.floor((bestCols * bestRows - count) / bestRows)

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

function anything () {
  const args = arrayfromargs(arguments)

  if (args.length === 5) {
    const { cols, rows, item_h, item_w } =
      args[0] > (args[1] * (args[3] / args[2]) / 2)
        ? calculateGridLayout(args[0], args[1], args[2], args[3], args[4], 'maximize')
        : calculateGridLayout(args[0], args[1], args[2], args[3], args[4], 'fill-width')

    outlet(0, [cols, rows, item_w, item_h])
  }
}
