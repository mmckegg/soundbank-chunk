var test = require('tape')
var RangeChunk = require('../range.js')
var FakeSoundbank = require('./lib/fake-soundbank.js')

test('test range', function(t){
  var soundbank = FakeSoundbank()
  var context = { soundbank: soundbank }
  var synth = RangeChunk(context)
  synth.set({
    id: 'synth',
    shape: [2, 3],
    offset: 2,
    triggerSlot: {
      sources: [
        { node: 'oscillator' }
      ],
      output: 'post'
    },
    slots: [
      {id: 'post', processors: [{node: 'overdrive'}]}
    ]
  })

  synth.forceUpdate()

  t.same(soundbank.getDescriptors(), [
    {id: 'synth#post', processors: [{node: 'overdrive'}]},
    {id: 'synth#0', offset: 2, sources: [{ node: 'oscillator' }], output: 'synth#post'},
    {id: 'synth#1', offset: 3, sources: [{ node: 'oscillator' }], output: 'synth#post'},
    {id: 'synth#2', offset: 4, sources: [{ node: 'oscillator' }], output: 'synth#post'},
    {id: 'synth#3', offset: 5, sources: [{ node: 'oscillator' }], output: 'synth#post'},
    {id: 'synth#4', offset: 6, sources: [{ node: 'oscillator' }], output: 'synth#post'},
    {id: 'synth#5', offset: 7, sources: [{ node: 'oscillator' }], output: 'synth#post'},
  ])

  synth.shape.set([1,1])

  synth.forceUpdate()

  t.same(soundbank.getDescriptors(), [
    {id: 'synth#post', processors: [{node: 'overdrive'}]},
    {id: 'synth#0', offset: 2, sources: [{ node: 'oscillator' }], output: 'synth#post'}
  ])

  t.end()

})