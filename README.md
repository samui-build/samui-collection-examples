# samui-collection-examples

A collection of example NFT collections.

The collections use
the [Metaplex Token Metadata](https://developers.metaplex.com/token-metadata/token-standard#the-non-fungible-standard)
standard used on Solana.

## Requirements

You can use [sugar cli](https://github.com/metaplex-foundation/sugar) to store the collection metadata on one of the
supported storage providers.

## Usage

Move into the collection directory:

```bash
cd glassy-horizons
```

Next, you use the `sugar` cli to create a config file.

```bash
sugar config create
```

After that, up upload the assets to the selected storage provider.

```bash
sugar upload
```

The upload process will create a `cache.json` file with the assets that have been uploaded and their URIs.

Now it's time to create the collection and deploy the Candy Machine.

To create a Metaplex Core collection, you can use the [ts-sugar](https://github.com/cryptorrivem/ts-sugar) cli.

```shell
npx ts-sugar deploy
```

To create a Metaplex MPL collection, you can use the sugar cli.

```shell
sugar deploy
```

## License

The code is licensed under the [MIT License](LICENSE).

Each collection has its own license, see the README.md file in each collection for more information.