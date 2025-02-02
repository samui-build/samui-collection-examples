import { readdir, readFile, writeFile } from 'node:fs/promises'
import { $ } from 'zx'

const collections = ['glassy-horizons', 'numbers']

async function getCollectionContext(collectionId: string) {
  const collectionAssetsPath = `./${collectionId}/assets/`
  const collectionAssetsFiles = await readdir(collectionAssetsPath)
  const collectionFile = collectionAssetsFiles.find((f) => f === 'collection.json')
  const collectionFilePath = collectionAssetsPath + collectionFile

  if (!collectionFile) {
    throw new Error('No collection.json found')
  }

  const collectionJson = JSON.parse(await readFile(collectionAssetsPath + collectionFile, 'utf-8'))
  const assetFiles = collectionAssetsFiles.filter((f) => f.endsWith('.json') && f !== 'collection.json')

  return {
    collectionJson,
    collectionFilePath,
    assetFiles,
  }
}

const baseUrl = process.env.BASE_URL ?? `http://localhost:8080`
const outputDir = `./output/`

async function main() {
  await $`rm -rf ${outputDir}`
  await $`mkdir -p ${outputDir}`

  const collectionDetails: { id: string; name: string; description: string }[] = []

  for (const collectionId of collections) {
    const collectionUrl = `${baseUrl}/${collectionId}`
    const collectionAssetsPath = `${collectionId}/assets`
    const outputAssetsPath = `${outputDir}${collectionAssetsPath}`

    const tag = `[${collectionId}]`
    console.log(`${tag} => Generating collection`)

    await $`mkdir -p ${outputDir}${collectionId}/assets`

    const { assetFiles, collectionJson } = await getCollectionContext(collectionId)
    console.log(`${tag} => Collection Details of ${collectionJson.name}`)
    collectionDetails.push({
      id: collectionId,
      name: collectionJson.name,
      description: collectionJson.description,
    })

    // Copy the collection.png file to the output directory
    console.log(`${tag}   => Collection.png Copying...`)
    await $`cp ${collectionAssetsPath}/collection.png ${outputAssetsPath}/collection.png`

    // Write the collection.json
    console.log(`${tag} => Writing collection.json`)
    await writeFile(
      `${outputAssetsPath}/collection.json`,
      JSON.stringify(collectionJson, null, 2).replaceAll('collection.png', `${collectionUrl}/assets/collection.png`),
    )

    console.log(`${tag} => Assets...`)

    for (const file of assetFiles) {
      const fileContent = await readFile(`${collectionAssetsPath}/${file}`, 'utf-8')
      if (!fileContent) {
        console.log(`${tag}\t => Skipping ${file}`)
        continue
      }

      // Get the image file name
      const image = file.replace('json', 'png')
      // Copy the image file to the output directory
      console.log(`${tag}   => Asset ${image} Copying...`)
      await $`cp ${collectionAssetsPath}/${image} ${outputAssetsPath}/${image}`

      // Write the asset file
      console.log(`${tag}   => Asset ${file} Writing...`)
      await writeFile(
        `${outputAssetsPath}/${file.replace(baseUrl, '')}`,
        fileContent.replaceAll(image, `${collectionUrl}/assets/${image}`),
      )
    }
    // write gallery index file
    console.log(`${tag} => Writing gallery.html`)
    await writeFile(
      `${outputDir}${collectionId}/index.html`,
      createCollectionPage({
        id: collectionId,
        title: collectionJson.name,
        description: collectionJson.description,
        assets: assetFiles,
      }),
    )
  }

  console.log(` => Writing index.html`)
  await writeFile(
    `${outputDir}/index.html`,
    createHtmlPage({
      title: 'Samui Collection Examples',
      description: 'This is a collection of Samui Collection Examples.',
      collections: collectionDetails,
    }),
  )
}

main().catch((error) => {
  throw error
})

function createHtmlPage({
  collections,
  description,
  title,
}: {
  collections: { id: string; name: string; description: string }[]
  description?: string
  title?: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
      </head>
      <body>
        <h1>${title}</h1>
        <p>${description}</p>
        <div style="display: flex; flex-direction: column; gap: 24px">
          ${collections
            .map((item) =>
              createCollectionCard({
                description: item.description,
                title: item.name,
                path: item.id,
                id: '',
              }),
            )
            .join('')}
        </div>
      </body>
    </html>
  `.trim()
}

function createCollectionPage({
  description,
  id,
  assets,
  title,
}: {
  description: string
  id: string
  assets: string[]
  title: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
      </head>
      <body>
        <div style="display: flex; flex-direction: column; gap: 24px">
          ${createCollectionCard({ description, id, title, path: '.' })}
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
            ${assets.map((json) => createAssetCard({ json, path: '.' })).join('')}
          </div>
        </div>
      </body>
    </html>
  `.trim()
}

export function createCollectionCard({
  description,
  id,
  title,
  path = '.',
}: {
  description: string
  id: string
  title: string
  path: string
}) {
  return `
    <div style="display: flex; flex-direction: column; gap: 24px">        
      <div style="display: flex; align-items: center; gap: 24px;">
        <img src="${path}/assets/collection.png" alt="collection.png" style="max-height: 256px;">
        <div>
          <h1><a href="/${path}${id ? `/${id}` : ''}/">${title}</a></h1>      
          <p>${description}</p>
          <span>
            <a href="${path}/assets/collection.json">collection.json</a>
            <a href="${path}/assets/collection.png">collection.png</a>
          </span>
        </div>
    </div>
  `.trim()
}

export function createAssetCard({ json, path }: { json: string; path: string }) {
  const image = json.replace('json', 'png')
  return `
    <div style="text-align: center;">
      <img src="${`${path}/assets/` + image}" alt="${image}" style="max-height: 256px;">
      <span>
        <a href="${path}/assets/${json}">${json}</a>
        <a href="${path}/assets/${image}">${image}</a>
      </span>
    </div>
  `.trim()
}
