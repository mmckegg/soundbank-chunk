var test = require('tape')
var Chunk = require('../')
var LoopGrid = require('loop-grid')
var Ditty = require('ditty')
var FakeSoundbank = require('./lib/fake-soundbank.js')

test('test chunk', function(t){
  var soundbank = FakeSoundbank()
  var context = { soundbank: soundbank }
  var drums = Chunk(context)

  drums.set({
    id: 'drums',
    shape: [2, 2], // 2 across, 2 down
    slots: [ // the soundbank slots (IDs relative to this chunk)
      {id: 'kick', sources: [{node: 'sample', url: 'kick.wav'}], output: 'post'},
      {id: 'snare', sources: [{node: 'sample', url: 'snare.wav'}], output: 'post'},
      {id: 'hihat', sources: [{node: 'sample', url: 'hihat.wav'}], output: 'post'},
      {id: 'openhat', sources: [{node: 'sample', url: 'openhat.wav'}], output: 'post'},
      {id: 'post', processors: [{node: 'overdrive'}]}
    ],
    triggers: ['kick', 'snare', 'hihat', 'openhat'], // what to put on grid
    outputs: ['post'], // expose outputs to other chunks
  })

  // fake nextTick
  drums.forceUpdate()

  t.same(soundbank.getDescriptors(), [
    {id: 'drums#kick', sources: [{node: 'sample', url: 'kick.wav'}], output: 'drums#post'},
    {id: 'drums#snare', sources: [{node: 'sample', url: 'snare.wav'}], output: 'drums#post'},
    {id: 'drums#hihat', sources: [{node: 'sample', url: 'hihat.wav'}], output: 'drums#post'},
    {id: 'drums#openhat', sources: [{node: 'sample', url: 'openhat.wav'}], output: 'drums#post'},
    {id: 'drums#post', processors: [{node: 'overdrive'}]}
  ])

  // update existing slot
  //var snare = drums.slots.get(1)
  //snare.set({id: 'snare', sources: [{node: 'sample', url: 'snare2.wav'}], output: 'post'})
  //t.same(soundbank.getDescriptor('drums#snare'), {id: 'drums#snare', sources: [{node: 'sample', url: 'snare2.wav'}], output: 'drums#post'})

  //t.same(drums.getDescriptor(), { 
  //  id: 'drums',
  //  title: null,
  //  slots: 
  //   [ { id: 'kick', sources: [{node: 'sample', url: 'kick.wav'}], output: 'post' },
  //     { id: 'snare', sources: [{node: 'sample', url: 'snare2.wav'}], output: 'post' },
  //     { id: 'hihat', sources: [{node: 'sample', url: 'hihat.wav'}], output: 'post' },
  //     { id: 'openhat', sources: [{node: 'sample', url: 'openhat.wav'}], output: 'post' },
  //     { id: 'post', processors: [{node: 'overdrive'}] } ],
  //  triggers: [ 'kick', 'snare', 'hihat', 'openhat' ],
  //  shape: [ 2, 2 ],
  //  stride: [ 1, 2 ],
  //  inputs: [],
  //  outputs: [ 'post' ],
  //  routes: {} 
  //})

  var grid = drums.grid()

  t.equal(grid.get(0, 1), 'drums#snare')
  t.equal(grid.get(1, 0), 'drums#hihat')
  t.equal(grid.get(1, 1), 'drums#openhat')

  // test routing
  drums.routes.put('post', 'master')
  drums.forceUpdate() // fake nextTick

  t.same(soundbank.getDescriptor('drums#post').output, 'master')

  drums.destroy()
  t.same(soundbank.getDescriptors(), [])

  t.end()
})

//test('with loop-grid', function(t){
//  var soundbank = FakeSoundbank()
//  var player = Ditty()
//
//  var loopGrid = LoopGrid({
//    shape: [8,8],
//    player: player
//  })
//
//  var drums = Chunk(context)
//
//  drums.set({
//    id: 'drums',
//    shape: [2, 2], // 2 across, 2 down
//    slots: [ // the soundbank slots (IDs relative to this chunk)
//      {id: 'kick', sources: [{node: 'sample', url: 'kick.wav'}], output: 'post'},
//      {id: 'snare', sources: [{node: 'sample', url: 'snare.wav'}], output: 'post'},
//      {id: 'hihat', sources: [{node: 'sample', url: 'hihat.wav'}], output: 'post'},
//      {id: 'openhat', sources: [{node: 'sample', url: 'openhat.wav'}], output: 'post'},
//      {id: 'post', processors: [{node: 'overdrive'}]}
//    ],
//    triggers: ['kick', 'snare', 'hihat', 'openhat'], // what to put on grid
//    outputs: ['post'], // expose outputs to other chunks
//  })
//
//  loopGrid.add(drums, 1, 2)
//
//  // fake a nextTick
//  loopGrid.grid.refresh()
//
//  var grid = loopGrid.grid()
//  t.equal(grid.get(1,2), 'drums#kick')
//  t.equal(grid.get(2,2), 'drums#snare')
//  t.equal(grid.get(1,3), 'drums#hihat')
//  t.equal(grid.get(2,3), 'drums#openhat')
//
//  t.same(loopGrid.chunkIds(), ['drums'])
//
//  loopGrid.remove(drums.id())
//
//  t.same(loopGrid.chunkIds(), [])
//
//  // fake a nextTick
//  loopGrid.grid.refresh()
//
//  var grid = loopGrid.grid()
//  t.equal(grid.get(1,2), undefined)
//  t.equal(grid.get(2,2), undefined)
//
//  t.end()
//})

