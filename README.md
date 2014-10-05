soundbank-chunk
===

A group of triggerable [sound descriptors](https://github.com/mmckegg/audio-slot) to be positioned on a [loop-grid](https://github.com/mmckegg/loop-grid) and played with [soundbank](https://github.com/mmckegg/soundbank).

Implements [observ](https://github.com/raynos/observ) for easy data-binding to your views.

## Install via [npm](https://npmjs.org/package/loop-grid)

```bash
$ npm install loop-grid
```

## API

```js
var Chunk = require('soundbank-chunk')
```

### `var chunk = Chunk(opts)`

**`opts`**
  - `soundbank`: (required) Specify the instance of [`soundbank`](https://github.com/mmckegg/soundbank) you wish to wrap. This chunk will be immediately added to the soundbank, with the IDs by default namespaced with the chunk id.
  - `getGlobalId`: Override the internal id resolver with `function(chunkId, soundId)`.

Returns an observable/bindable chunk.

```js

// set up a soundbank
var audioContext = new AudioContext() // web audio api
var Soundbank = require('soundbank')
audioContext.sources = {
  sample: require('soundbank-sample')
}
audioContext.processors = {
  overdrive: require('soundbank-overdrive')
}
audioContext.loadSample = function(src, cb){
  // callback with AudioBuffer resolved from src
}
var soundbank = Soundbank(audioContext)

// create instance wrapping soundbank above
var chunk = Chunk(soundbank, {
  id: 'drums',
  slots: [ // slots to get added to soundbank (namespaced by chunk.id or getUniqueId())
    {id: 'kick', sources: [{node: 'sample', url: 'kick.wav'}], output: 'post'},
    {id: 'snare', sources: [{node: 'sample', url: 'snare.wav'}], output: 'post'},
    {id: 'hihat', sources: [{node: 'sample', url: 'hihat.wav'}], output: 'post'},
    {id: 'openhat', sources: [{node: 'sample', url: 'openhat.wav'}], output: 'post'},
    {id: 'post', processors: [{node: 'overdrive'}]}
  ],
  shape: [2, 2], // 2 across, 2 down
  sounds: ['kick', 'snare', 'hihat', 'openhat'], // what to put on grid
  outputs: ['post'], // expose outputs to other chunks
})

// put this chunk on a launchpad
var launchpad = require('loop-launchpad')(
  midi: MidiStream('Launchpad Mini'),
  player: player, 
  recorder: recorder
)

launchpad.add(chunk, 0, 0) // place starting at top-left corner
```

### `chunk.set(descriptor)`

Update all properties to reflect the new descriptor.

### `chunk()`

Returns the current descriptor value as `set`.

### chunk(function callback(descriptor){ ... })

The `callback` is called with the new `descriptor` value on every change.

### `chunk.grid` Observ(ArrayGrid)

Get the resolved trigger IDs mapped to an ArrayGrid using `shape` and `stride` values.

Returns an ArrayGrid wrapped by an Observ instance that notifies on change.

## Observable Properties

### `chunk.title` (Observ)

A display title for this chunk.

### `chunk.slots` ([ObservArray](https://github.com/raynos/observ-array))

The soundbank slot descriptors used by this chunk. Update sounds by modifying this array.

### `chunk.triggers` (ObservArray)

The slot ids to include on the grid. They will be shaped by `chunk.shape` and `chunk.stride`.

### `chunk.shape` (Observ)

### `chunk.stride` (Observ)

### `chunk.routes` ([ObservVarhash](https://github.com/nrw/observ-varhash))

Route the output from slots in this chunk to IDs in other chunks.

### `chunk.inputs` (Observ)

List of slot ids to accept input routing from chunks.

### `chunk.outputs` (Observ)

List of slot ids to suggest output routing to other chunks.