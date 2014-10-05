var Observ = require('observ')
var ObservStuct = require('observ-struct')
var ObservVarhash = require('observ-varhash')
var ArrayGrid = require('array-grid')
var computedNextTick = require('./lib/computed-next-tick')
var computed = require('observ/computed')

module.exports = Chunk

function Chunk(opts){
  // opts: soundbank (required), getGlobalId 

  var obs = ObservStuct({

    id: Observ(),
    title: Observ(),
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
  var resolvedIds = computed([obs.id, obs.triggers], function(id, triggers){
    if (!Array.isArray(triggers)) triggers = []
    return triggers.map(lookupGlobal)
  })

  var resolvedSlots = computedNextTick([obs.id, obs.slots, obs.routes], function(id, slots, routes){

    if (!routes) routes = {}
    if (!Array.isArray(slots)) slots = []

    var result = []
    for (var i=0;i<slots.length;i++){
      var slot = slots[i]
      result[i] = obtainWithIds(slot, lookupGlobal)
      if (routes[slot.id]){
        result[i].output = routes[slot.id]
      }
      result[i].output
    }
    return result
  })

  var usedSlots = {}
  releases.push(resolvedSlots(function(slots){
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

  }))

  obs.grid = computedNextTick([resolvedIds, obs.shape, obs.stride], ArrayGrid)

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

function obtainWithIds(object, lookupGlobal){
  object = object || {}
  return JSON.parse(JSON.stringify(object, function(key, value){
    if (key === 'id' || key === 'from' || key === 'output'){
      if (Array.isArray(value)){
        return value.map(lookupGlobal)
      } else if ((typeof value === 'string' && value) || typeof value === 'number'){
        return lookupGlobal(value)
      }
    }
    return value
  }))
}

function invoke(f){
  return f()
}

function getGlobalIdFallback(chunkId, localId){
    if (localId === 'meddler'){ // only one meddler at this stage :(
      return 'meddler'
    } else {
      return chunkId + '#' + localId
    }
}