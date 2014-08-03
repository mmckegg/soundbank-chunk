var getTime = require('monotonic-timestamp-base36')

var Arr = require('observ-array')
var Stuct = require('observ-struct')
var Val = require('observ')

var union = require('array-union')

module.exports = function Chunk(soundbank, descriptor, getUniqueId){
  getUniqueId = getUniqueId || getTime

  // watch the slots, assign global ids, update soundbank
  var slots = Arr()
  var currentSlotValues = []
  var idLookup = {}
  slots(function(array){
    var diff = array._diff
    var updatedIds = []

    diff.slice(2).forEach(function(element){
      // map to global and update soundbank
      var globalId = idLookup[currentId]
      if (globalId == null){
        var globalId = idLookup[currentId] = getUniqueId(descriptor)
      }
      newDescriptor = obtain(element)
      newDescriptor.id = globalId

      if (currentRoutes[element.id]){
        newDescriptor.output = currentRoutes[element.id]
      }

      soundbank.update(newDescriptor)
      updateIds.push(globalId)
    })

    for (var i=diff[0];i<diff[1];i++){
      var globalId = idLookup[currentSlotValues[i].id]
      if (globalId && !~updateIds.indexOf(globalId)){
        soundbank.remove(globalId)
      }
    }

    currentSlotValues = array
  })
  slots.set(descriptor.slots.map(Val))

  // dynamic routing
  var routes = Struct()
  var currentRoutes = {}
  routes(function(value){
    var keys = union(Object.keys(value), Object.keys(currentRoutes))
    keys.forEach(function(key){
      if (currentRoutes[key] !== value[key]){
        var globalId = idLookup[key]
        var current = obtain(soundbank.getDescriptor(globalId))
        if (current){
          current.output = value[key]
          soundbank.update(current)
        }
      }
    })
    currentRoutes = routes
  })
  routes.set(descriptor.routes)

  return Struct({
    name: Val(descriptor.name),
    grid: Val(),
    slots: slots,
    sounds: Arr(descriptor.sounds),
    shape: Val(descriptor.shape),
    stride: Val(descriptor.stride),
    outputs: Arr(descriptor.outputs),
    inputs: Arr(descriptor.inputs),
    routes: routes
  })
}

function obtain(object){
  return JSON.parse(JSON.stringify())
}