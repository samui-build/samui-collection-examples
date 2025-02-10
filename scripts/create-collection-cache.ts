import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function generateCollectionCache(collectionPath: string) {
  const assetCacheJson = join(collectionPath, 'cache.json')
  const assetPath = join(collectionPath, 'assets')
  if (existsSync(assetCacheJson)) {
    console.log(` => Skipping cache generation, file already exists: ${assetCacheJson}`)
    const assetCache = JSON.parse(await readFile(assetCacheJson, 'utf-8'))
    return { assetCacheJson, assetCache }
  }
  const files = await readdir(assetPath)
  const collectionJson = JSON.parse(await readFile(join(assetPath, 'collection.json'), 'utf-8'))

  const items: Record<string, any> = {
    '-1': {
      name: collectionJson.name,
      image_link: collectionJson.image,
      metadata_link: collectionJson.image.replace('png', 'json'),
    },
  }

  for (const file of files) {
    const match = file.match(/^(\d+)\.json$/)
    if (!match) continue

    const index = match[1]
    const assetJson = JSON.parse(await readFile(join(assetPath, file), 'utf-8'))
    items[index] = {
      name: assetJson.name,
      image_link: assetJson.image,
      metadata_link: assetJson.image.replace('png', 'json'),
    }
  }

  const assetCache = {
    program: { candyMachine: '', candyGuard: '', candyMachineCreator: '', collectionMint: '' },
    items,
  }
  await writeFile(assetCacheJson, JSON.stringify(assetCache, null, 2))
  console.log(` => Cache generated: ${assetCacheJson}`)

  return { assetCacheJson, assetCache }
}
