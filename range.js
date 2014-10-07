var Observ = require('observ')
var ObservStuct = require('observ-struct')
var ObservVarhash = require('observ-varhash')
var ArrayGrid = require('array-grid')
var computedNextTick = require('./lib/computed-next-tick')
var computed = require('observ/computed')

var getGlobalIdFallback = require('./lib/get-global-id.js')
var obtainWithIds = require('./lib/obtain-with-ids.js')

module.exports = RangeChunk

function RangeChunk(opts){
  // opts: soundbank (required), getGlobalId 

  var obs = ObservStuct({

    id: Observ(),
    title: Observ(),
    scale: Observ(),
    offset: Observ(),

    triggerSlot: Observ(),
    slots: Observ([]),
    
    shape: Observ(),
    stride: Observ(),
    triggers: Observ([]),

    inputs: Observ([]),
    outputs: Observ([]),
    routes: ObservVarhash({}),
    flags: ObservVarhash({})
  })

  var releases = []

  var getGlobalId = opts.getGlobalId || getGlobalIdFallback
  var resolvedIds = computed([obs.id, obs.shape], function(id, shape){
    var result = []
    shape = shape || [1, 1]
    var length = (shape[0] || 1) * (shape[1] || 1)
    for (var i=0;i<length;i++){
      result.push(lookupGlobal(String(i)))
    }
    return result
  })

  var resolvedSlots = computedNextTick([
    obs.id, obs.slots, obs.routes, obs.scale, obs.offset, obs.triggerSlot, obs.shape
  ], function(id, slots, routes, scale, offset, triggerSlot, shape){
    if (!routes) routes = {}
    if (!Array.isArray(slots)) slots = []

    shape = shape || [1, 1]
    offset = offset || 0

    var result = []
    for (var i=0;i<slots.length;i++){
      var slot = slots[i]
      result[i] = obtainWithIds(slot, lookupGlobal)
      if (routes[slot.id]){
        result[i].output = routes[slot.id]
      }
      result[i].output
    }

    var length = (shape[0] || 1) * (shape[1] || 1)
    for (var i=0;i<length;i++){
      var slot = obtainWithIds(triggerSlot, lookupGlobal)
      slot.id = lookupGlobal(String(i))
      if (routes[String(i)]){
        slot.output = routes[String(i)]
      }
      slot.offset = i + offset
      result.push(slot)
    }

    return result
  })

  var usedSlots = {}
  releases.push(resolvedSlots(function(slots){
    if (obs.id()){
      slots.forEach(function(descriptor){
        // naive and slow implementation, but soundbank performs deepEqual checks on update
        // hoepfully this will make things OK :/
        usedSlots[descriptor.id] = true
        opts.soundbank.update(descriptor)
      })

      // clean up unused slots
      for (var id in usedSlots){
        if (usedSlots[id] === false){
          ;delete usedSlots[id]
          opts.soundbank.remove(id)
        } else {
          usedSlots[id] = false
        }
      }
    }
  }))

  obs.grid = computed([resolvedIds, obs.shape, obs.stride], ArrayGrid)
  obs.controllerContext = ObservStuct({
    id: obs.id,
    grid: obs.grid,
    flags: obs.flags
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

}

function invoke(f){
  return f()
}