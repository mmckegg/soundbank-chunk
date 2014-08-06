var Chunk = require('soundbank-chunk')
var Soundbank = require('soundbank')
var DittyTrigger = require('ditty-trigger')
var Launchpad = require('loop-launchpad')
var Recorder = require('loop-recorder')

var scheduler = Bopper(audioContext)
var soundbank = Soundbank(audioContext)
var playback = DittyTrigger(soundbank)

var loop = Ditty()
var recorder = Recorder()

// loop playback / feedback
scheduler
  .pipe(loop)
  .pipe(playback)
  .pipe(recorder)

var state = ObservStruct({
  chunks: ObservArray([]),
  controllers: ObservArray([])
})

var controller = Launchpad({
  midi: MidiStream('Launchpad', 0),
  scheduler: scheduler,
  soundbank: soundbank,
  playback: playback,
  recorder: recorder, 
  loop: loop
)

state.controllers.push(controller)

// this would be stored in a library somewhere and imported on demand
var drums = getChunk({
  name: 'Drums',
  slots: [
    {id: 'kick', sources: [{node: 'sample', 'url': '3423523412.wav'}]},
    {id: 'snare', sources: [{node: 'sample', 'url': '342353256.wav'}]}
    {id: 'hihat', sources: [{node: 'sample', 'url': '342361242.wav'}]}
    {id: 'open-hihat', sources: [{node: 'sample', 'url': '23523421.wav'}]},
    {id: 'bus'},
    {id: 'sidechained' }
  ],
  sounds: ['kick', 'snare', 'hihat', 'open-hihat'],
  shape: [2, 2],
  stride: [1, 2],
  origin: [4, 4],
  inputs: ['sidechained'],
  outputs: ['bus']
  routes: {
    'bus': true // master output
  } 
})

state.chunks.push(drums)
controller.add(drums)