import { existsSync } from 'node:fs'
import { generateCollectionCache } from './create-collection-cache'

// Get the path from the first argument
const collectionPath = process.argv[2]

// Check if the path is valid
if (!collectionPath) {
  console.error('Please provide a path to the collection')
  process.exit(1)
}

// Check if the path exists
if (!existsSync(collectionPath)) {
  console.error(`The path ${collectionPath} does not exist`)
  process.exit(1)
}

const assetsPath = `${collectionPath}/assets`
const collectionJsonPath = `${assetsPath}/collection.json`

if (!existsSync(collectionJsonPath)) {
  console.error(`Expected collection.json at ${collectionJsonPath}`)
  process.exit(1)
}

console.log(` => Initialize collection`)
console.log(`    - Collection path: ${collectionPath}`)
console.log(`    - Assets path: ${assetsPath}`)
console.log(`    - Collection.json path: ${collectionJsonPath}`)

const cache = await generateCollectionCache(collectionPath)

console.log(`    - Cache file: ${cache?.assetCacheJson}`)
