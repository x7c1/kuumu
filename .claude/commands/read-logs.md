# Read Three.js Layouter Example Logs

## Description
Read and analyze the Three.js layouter example application logs

## Command
```bash
jq '.[0:10]' frontend/apps/three-js-layouter-example/three-js-layouter-example.logs.json
```

## Usage
- Use this command to view the first 10 log entries from the Three.js layouter example
- To view all logs: `jq '.' frontend/apps/three-js-layouter-example/three-js-layouter-example.logs.json`
- To filter by log level: `jq '.[] | select(.level == "error")' frontend/apps/three-js-layouter-example/three-js-layouter-example.logs.json`
- To view logs from specific source: `jq '.[] | select(.source | contains("main.ts"))' frontend/apps/three-js-layouter-example/three-js-layouter-example.logs.json`
