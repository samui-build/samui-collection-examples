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

  for (const collectionId of collections) {
    const collectionUrl = `${baseUrl}/${collectionId}`
    const collectionAssetsPath = `${collectionId}/assets`
    const outputAssetsPath = `${outputDir}${collectionAssetsPath}`
    const collectionLinks: string[] = [`./assets/collection.json`]
    const tag = `[${collectionId}]`
    console.log(`${tag} => Generating collection`)

    await $`mkdir -p ${outputDir}${collectionId}/assets`

    const { assetFiles, collectionJson } = await getCollectionContext(collectionId)

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
      collectionLinks.push(`assets/${file}`)
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
    // write collection index file
    console.log(`${tag} => Writing index.html`)
    await writeFile(
      `${outputDir}${collectionId}/index.html`,
      createHtmlPage({
        title: collectionJson.name,
        description: collectionJson.description,
        links: collectionLinks,
      }),
    )
  }

  console.log(` => Writing index.html`)
  await writeFile(
    `${outputDir}/index.html`,
    createHtmlPage({
      title: 'Samui Collection Examples',
      description: 'This is a collection of Samui Collection Examples.',
      links: collections.map((collectionId) => `${collectionId}/`),
    }),
  )
}

main().catch((error) => {
  throw error
})

function createHtmlPage({ description, links, title }: { description?: string; links: string[]; title?: string }) {
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
        <ul>
          ${links.map((item) => `<li><a href="${item}">${item.replace('./', '').replace(/\/$/, '')}</a></li>`).join('')}
        </ul>
      </body>
    </html>
  `.trim()
}
