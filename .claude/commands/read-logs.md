# Read Three.js Layouter Example Logs

## Description
Read and analyze the Three.js layouter example application logs

## Command
```bash
head -10 frontend/apps/layouter-demo/layouter-demo.log | jq -s '.'
```

## Usage
- Use this command to view the first 10 log entries from the Three.js layouter example
- To view all logs: `cat frontend/apps/layouter-demo/layouter-demo.log | jq -s '.'`
- To filter by log level: `cat frontend/apps/layouter-demo/layouter-demo.log | jq 'select(.level == "error")'`
- To view logs from specific source: `cat frontend/apps/layouter-demo/layouter-demo.log | jq 'select(.source | contains("main.ts"))'`
- To view recent logs: `tail -20 frontend/apps/layouter-demo/layouter-demo.log | jq -s '.'`
- To count logs by level: `cat frontend/apps/layouter-demo/layouter-demo.log | jq -r '.level' | sort | uniq -c`
