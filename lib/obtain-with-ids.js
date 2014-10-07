module.exports = obtainWithIds

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
