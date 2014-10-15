var Observ = require('observ')
var ObservStuct = require('observ-struct')
var ObservVarhash = require('observ-varhash')
var ArrayGrid = require('array-grid')
var computedNextTick = require('./lib/computed-next-tick')
var computed = require('observ/computed')

var getGlobalIdFallback = require('./lib/get-global-id.js')
var obtainWithIds = require('./lib/obtain-with-ids.js')
var randomColor = require('./lib/random-color.js')

module.exports = Chunk

function Chunk(opts){
  // opts: soundbank (required), getGlobalId 

  var obs = ObservStuct({

    id: Observ(),
    title: Observ(),
    slots: Observ([]),
    
    shape: Observ(),
    stride: Observ(),
    triggers: Observ(),

    // alternative to specifying `slots` and `triggers` (auto assigns ID)
    // overrides `triggers`
    triggerSlots: Observ(),

    inputs: Observ([]),
    outputs: Observ([]),
    routes: ObservVarhash({}),
    flags: ObservVarhash({}),

    selectedSlotId: Observ(),

    color: Observ()
  })

  var releases = []

  var getGlobalId = opts.getGlobalId || getGlobalIdFallback
  var resolvedIds = computed([obs.id, obs.triggers, obs.shape], function(id, triggers, shape){
    if (Array.isArray(triggers)){
      if (!Array.isArray(triggers)) triggers = []
      return triggers.map(lookupGlobal)
    } else {
      var shape = shape || [1,1]
      var result = []
      var length = shape[0] * shape[1]
      for (var i=0;i<length;i++){
        result[i] = lookupGlobal(String(i))
      }
      return result
    }
  })

  var resolvedSlots = computedNextTick([obs.id, obs.slots, obs.triggerSlots, obs.routes], function(id, slots, triggerSlots, routes){
    if (!routes) routes = {}
    var result = []

    if (Array.isArray(slots)){
      for (var i=0;i<slots.length;i++){
        var slot = slots[i]
        result[i] = obtainWithIds(slot, lookupGlobal)
        if (routes[slot.id]){
          result[i].output = routes[slot.id]
        }
        result[i].output
      }
    }

    if (Array.isArray(triggerSlots)){
      for (var i=0;i<triggerSlots.length;i++){
        var id = String(i)
        if (triggerSlots[i]){
          var slot = obtainWithIds(triggerSlots[i], lookupGlobal) 
          slot.id = lookupGlobal(id)
          slot.output = routes[id] || lookupGlobal('output')
          result.push(slot)
        }
      }
    }

    return result
  })

  var usedSlots = {}
  releases.push(resolvedSlots(function(slots){
    if (obs.id() && slots){
      slots.forEach(function(descriptor){
        // naive and slow implementation, but soundbank performs deepEqual checks on update
        // hoepfully this will make things OK :/
        usedSlots[descriptor.id] = true
        opts.soundbank.update(descriptor)
      })
    }

    // clean up unused slots
    for (var id in usedSlots){
      if (usedSlots[id] === false){
        ;delete usedSlots[id]
        opts.soundbank.remove(id)
      } else {
        usedSlots[id] = false
      }
    }
  }))

  obs.grid = computed([resolvedIds, obs.shape, obs.stride], ArrayGrid)
  obs.controllerContext = computedNextTick([obs.id, obs.grid, obs.flags, obs.color, obs.selectedSlotId], function(id, grid, flags, color, selectedSlotId){
    return {
      id: id,
      grid: grid,
      flags: lookupKeys(flags),
      selectedSlotId: selectedSlotId,
      color: color || randomColor([255,255,255])
    }
  })

  obs.forceUpdate = function(){
    resolvedSlots.refresh()
  }

  obs.destroy = function(){
    releases.forEach(invoke)
    Object.keys(usedSlots).forEach(function(id){
      opts.soundbank.remove(id)
      ;delete usedSlots[id]
    })
  }

  return obs


  // scoped
  function lookupGlobal(localId){
    return getGlobalId(obs.id(), localId)
  }

  function lookupKeys(object){
    if (object instanceof Object){
      var result = {}
      for (var key in object){
        if (key in object){
          result[lookupGlobal(key)] = object[key]
        }
      }
      return result
    }
  }

}

function invoke(f){
  return f()
}

