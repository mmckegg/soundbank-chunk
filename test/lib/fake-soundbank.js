module.exports = FakeSoundbank

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