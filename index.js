var ArrayGrid = require('array-grid')
var ObservArray = require('observ-array')
var ObservStuct = require('observ-struct')
var ObservVarhash = require('observ-varhash')
var Observ = require('observ')

var union = require('array-union')

module.exports = function Chunk(soundbank, descriptor, getGlobalId){

  descriptor.shape = descriptor.shape || [8, 1]
  descriptor.stride = descriptor.stride || [1, descriptor.shape[0]]

  var releases = []
  var currentRoutes = {}

  var self = ObservStuct({
    id: Observ(descriptor.id),
    title: Observ(descriptor.title),
    slots: ObservArray([]),
    sounds: ObservArray(descriptor.sounds || []),
    shape: Observ(descriptor.shape),
    stride: Observ(descriptor.stride),
    outputs: ObservArray(descriptor.outputs || []),
    inputs: ObservArray(descriptor.inputs || []),
    routes: ObservVarhash({}),
    grid: Observ() // auto generated
  })

  getGlobalId = getGlobalId || function(chunkId, localId){
    return chunkId + '#' + localId
  }

  // watch the slots, assign global ids, update soundbank
  var currentSlotValues = []
  releases.push(self.slots(function(array){
    var diff = array._diff
    var updateIds = []
    var updateItems = array
    var oldItems = currentSlotValues

    if (diff){
      updateItems = diff.slice(2)
      oldItems = currentSlotValues.slice(diff[0], diff[0]+diff[1])
    }

    updateItems.forEach(function(element){
      // map to global and update soundbank
      var globalId = getGlobalId(self.id(), element.id)
      newDescriptor = obtain(element)
      newDescriptor.id = globalId

      if (newDescriptor.output){
        newDescriptor.output = getGlobalId(self.id(), newDescriptor.output)
      }

      if (newDescriptor.from){
        newDescriptor.from = getGlobalId(self.id(), newDescriptor.from)
      }

      if (currentRoutes[element.id]){
        newDescriptor.output = currentRoutes[element.id]
      }

      soundbank.update(newDescriptor)
      updateIds.push(globalId)
    })

    oldItems.forEach(function(element){
      var globalId = getGlobalId(self.id(), element.id)
      if (globalId != null && !~updateIds.indexOf(globalId)){
        soundbank.remove(globalId)
      }
    })

    currentSlotValues = array
  }))

  if (Array.isArray(descriptor.slots)){
    descriptor.slots.forEach(function(d){
      self.slots.push(Observ(d))
    })
  }

  self.shape(refreshGrid)
  self.stride(refreshGrid)
  self.sounds(refreshGrid)

  // dynamic routing
  self.routes(function(value){
    var keys = union(Object.keys(value), Object.keys(currentRoutes))
    keys.forEach(function(key){
      if (currentRoutes[key] !== value[key]){
        var current = obtain(soundbank.getDescriptor(getGlobalId(self.id(), key)))
        if (current){
          current.output = value[key]
          soundbank.update(current)
        }
      }
    })
    currentRoutes = value
  })
  self.routes.set(descriptor.routes || {})

  self.getDescriptor = function(){
    return {
      id: self.id(),
      title: self.title(),
      slots: self.slots(),
      sounds: self.sounds(),
      shape: self.shape(),
      stride: self.stride(),
      inputs: self.inputs(),
      outputs: self.outputs(),
      routes: self.routes()
    }
  }

  self.destroy = function(){
    releases.forEach(invoke)
    releases = []
    currentSlotValues.forEach(function(element){
      var globalId = getGlobalId(self.id(), element.id)
      if (globalId != null){
        soundbank.remove(globalId)
      }
    })
    currentSlotValues = []
  }

  refreshGrid()
  return self


  ///

  function lookupGlobal(localId){
    return getGlobalId(self.id(), localId)
  }

  function refreshGrid(){
    var result = ArrayGrid(self.sounds().map(lookupGlobal), self.shape(), self.stride())
    self.grid.set(result)
  }
}

function obtain(object){
  if (object != null){
    //if (typeof object === 'function'){
    //  object = object()
    //}
    return JSON.parse(JSON.stringify(object))
  } else {
    return null
  }
}

function invoke(func){
  return func()
}