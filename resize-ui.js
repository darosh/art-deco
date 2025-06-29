// based on https://11olsen.de/max-msp-externals/download/8-max-msp-examples/24-moveable_ui
//resize window together with the jsui - 11olsen.de

autowatch = 1

let a = 56 + 1
let b = 36 - 1
let c = 4096
let d = 4096
let last_x = 0
let last_y = 0
let do_constrain = 1
let pres

// MOUSE EVENTS ************************************************

function onclick (x, y, but, cmd, shift, capslock, option, ctrl) {
  last_x = x
  last_y = y

  pres = this.patcher.getattr('presentation')// doesn't matter, we move on both views
}

function ondrag (x, y, but, cmd, shift, capslock, option, ctrl) {
  let dx2 = x - last_x
  let dy2 = y - last_y

  // patching view
  if ((dx2 || dy2) && (do_constrain == 1)) {
    let min_X = 0
    let min_Y = 0
    let max_X = 0
    let max_Y = 0

      //first our box
      pos = box.rect

      if ((pos[0] + dx2) < a) // X
      {
        min_X = (pos[0] + dx2) - a
      }
      if ((pos[1] + dy2) < b) // Y
      {
        min_Y = (pos[1] + dy2) - b
      }
      if (pos[2] + dx2 > c) {
        max_X = c - (pos[2] + dx2)
      }
      if ((pos[3] + dy2) > d) {
        max_Y = d - (pos[3] + dy2)
      }

      dx2 -= min_X
      dy2 -= min_Y

      if (!min_X && max_X) {
        dx2 = (dx2 + max_X)
      }

      if (!min_Y && max_Y) {
        dy2 = (dy2 + max_Y)
      }

      pos = box.rect
      pos[0] += dx2
      pos[1] += dy2
      pos[2] += dx2
      pos[3] += dy2
      box.rect = pos

      // ################### presentation ###############

      boxpos = box.getattr('presentation_rect')
      boxpos[0] += dx2
      boxpos[1] += dy2
      box.setattr('presentation_rect', boxpos)

      // move all objects that have been given as args
      for (let i = 1; i < jsarguments.length; i++) {
        const [n, a, b] = jsarguments[i].split(':')

        obj = this.patcher.getnamed(n)
        obj_pos = null
        obj_pos = obj.getattr('presentation_rect')

        if (obj_pos == null) // for bpatchers
        {
          obj_pos = obj.rect
          obj_pos[0] += dx2
          obj_pos[1] += dy2
          this.patcher.message('script', 'sendbox', n, 'presentation_position', obj_pos)
        } else {
          obj_pos[a] += dx2
          obj_pos[b] += dy2
          obj.setattr('presentation_rect', obj_pos)
        }
      }
  }

  nowsize = this.patcher.wind.size
  nowsize[0] += dx2
  nowsize[1] += dy2
  this.patcher.wind.size = nowsize
}

function onresize (w, h) {
  refresh()
}

onclick.local = 1 //private.
ondrag.local = 1 //private.
onresize.local = 1 //private
