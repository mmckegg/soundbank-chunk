module.exports = getGlobalId

function getGlobalId(chunkId, localId){
  if (localId === 'meddler'){ // only one meddler at this stage :(
    return 'meddler'
  } else {
    return chunkId + '#' + localId
  }
}