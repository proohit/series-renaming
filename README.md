# series-renaming

A simple npm tool to rename video files inside a folder to a schema. Useful for e.g. a self maintained media library

## Usage

### Local

Edit `config.json` and change `inputFolder` and `outputFolder` accordingly.

```bash
node index.js --config-file=./config.json --logs-folder=./logs
```

Example usage:

```bash
node index.js --config-file=./config.json --logs-folder=./logs
```

with `config.json`

```json
{
  "inputFolder": "./sample-files",
  "outputFolder": "./output"
}
```

### Docker

Leave inputFolder and outputFolder in `config.json` as is, but mount the folders to the docker container.

```bash
docker run -it --rm -v /path/to/input:/inputFolder -v /path/to/output:/outputFolder series-renaming
```

### Configuration

```json
{
  "inputFolder": "string",
  "outputFolder": "string",
  //controls if seasons should be extracted and included in the output file name
  "disableSeasons": "boolean"
}
```
