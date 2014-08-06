var test = require('tape')
var Chunk = require('../')
var LoopGrid = require('loop-grid')
var Ditty = require('ditty')

test(function(t){
  var soundbank = FakeSoundbank()

  var drums = Chunk(soundbank, {
    id: 'drums',
    shape: [2, 2], // 2 across, 2 down
    slots: [ // the soundbank slots (IDs relative to this chunk)
      {id: 'kick', sources: [{node: 'sample', url: 'kick.wav'}], output: 'post'},
      {id: 'snare', sources: [{node: 'sample', url: 'snare.wav'}], output: 'post'},
      {id: 'hihat', sources: [{node: 'sample', url: 'hihat.wav'}], output: 'post'},
      {id: 'openhat', sources: [{node: 'sample', url: 'openhat.wav'}], output: 'post'},
      {id: 'post', processors: [{node: 'overdrive'}]}
    ],
    sounds: ['kick', 'snare', 'hihat', 'openhat'], // what to put on grid
    outputs: ['post'], // expose outputs to other chunks
  })

  t.same(soundbank.getDescriptors(), [
    {id: 'drums/kick', sources: [{node: 'sample', url: 'kick.wav'}], output: 'post'},
    {id: 'drums/snare', sources: [{node: 'sample', url: 'snare.wav'}], output: 'post'},
    {id: 'drums/hihat', sources: [{node: 'sample', url: 'hihat.wav'}], output: 'post'},
    {id: 'drums/openhat', sources: [{node: 'sample', url: 'openhat.wav'}], output: 'post'},
    {id: 'drums/post', processors: [{node: 'overdrive'}]}
  ])

  // update existing slot
  var snare = drums.slots.get(1)
  snare.set({id: 'snare', sources: [{node: 'sample', url: 'snare2.wav'}], output: 'post'})
  t.same(soundbank.getDescriptor('drums/snare'), {id: 'drums/snare', sources: [{node: 'sample', url: 'snare2.wav'}], output: 'post'})

  t.same(drums.getDescriptor(), { 
    id: 'drums',
    title: null,
    slots: 
     [ { id: 'kick', sources: [{node: 'sample', url: 'kick.wav'}], output: 'post' },
       { id: 'snare', sources: [{node: 'sample', url: 'snare2.wav'}], output: 'post' },
       { id: 'hihat', sources: [{node: 'sample', url: 'hihat.wav'}], output: 'post' },
       { id: 'openhat', sources: [{node: 'sample', url: 'openhat.wav'}], output: 'post' },
       { id: 'post', processors: [{node: 'overdrive'}] } ],
    sounds: [ 'kick', 'snare', 'hihat', 'openhat' ],
    shape: [ 2, 2 ],
    stride: [ 1, 2 ],
    inputs: [],
    outputs: [ 'post' ],
    routes: {} 
  })

  var grid = drums.grid()
  t.equal(grid.get(1, 0), 'drums/snare')
  t.equal(grid.get(0, 1), 'drums/hihat')
  t.equal(grid.get(1, 1), 'drums/openhat')

  // test routing
  drums.routes.put('post', 'master')
  t.same(soundbank.getDescriptor('drums/post').output, 'master')

  drums.destroy()
  t.same(soundbank.getDescriptors(), [])

  t.end()
})

test('with loop-grid', function(t){
  var soundbank = FakeSoundbank()
  var player = Ditty()

  var loopGrid = LoopGrid({
    shape: [8,8],
    player: player
  })

  var drums = Chunk(soundbank, {
    id: 'drums',
    shape: [2, 2], // 2 across, 2 down
    slots: [ // the soundbank slots (IDs relative to this chunk)
      {id: 'kick', sources: [{node: 'sample', url: 'kick.wav'}], output: 'post'},
      {id: 'snare', sources: [{node: 'sample', url: 'snare.wav'}], output: 'post'},
      {id: 'hihat', sources: [{node: 'sample', url: 'hihat.wav'}], output: 'post'},
      {id: 'openhat', sources: [{node: 'sample', url: 'openhat.wav'}], output: 'post'},
      {id: 'post', processors: [{node: 'overdrive'}]}
    ],
    sounds: ['kick', 'snare', 'hihat', 'openhat'], // what to put on grid
    outputs: ['post'], // expose outputs to other chunks
  })

  loopGrid.add(drums, 1, 2)

  // fake a nextTick
  loopGrid.forceRefresh()

  var grid = loopGrid.grid()
  t.equal(grid.get(1,2), 'drums/kick')
  t.equal(grid.get(2,2), 'drums/snare')
  t.equal(grid.get(1,3), 'drums/hihat')
  t.equal(grid.get(2,3), 'drums/openhat')

  t.same(loopGrid.chunkIds(), ['drums'])

  loopGrid.remove(drums.id())

  t.same(loopGrid.chunkIds(), [])

  // fake a nextTick
  loopGrid.forceRefresh()

  var grid = loopGrid.grid()
  t.equal(grid.get(1,2), undefined)
  t.equal(grid.get(2,2), undefined)

  t.end()
})

function FakeSoundbank(){
  var descriptors = {}
  return {
    getDescriptor: function(id){
      return descriptors[id] || {id: String(id)}
    },
    getDescriptors: function(id){
      return Object.keys(descriptors).map(function(id){
        return descriptors[id]
      })
    },
    update: function(descriptor){
      descriptors[descriptor.id] = descriptor
    },
    remove: function(id){
      ;delete descriptors[id]
    }
  }
}