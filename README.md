# pnpm-hoisting-workaround
An example of working around `pnpm deploy` not ignoring `--filter` with `--node-linker=hoisted`

```yml
name: Account API deployment
on:
  push:
    branches: [main]
    paths:
      - apps/account-api/**
      - .github/actions/api-dist/action.yml
      - .github/workflows/account-api.yml

jobs:
  Deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Create api dist
        id: create_api_dist
        uses: ./.github/actions/api-dist
        with:
          workspace: '@my-company/account-api'

      - name: Deploy AWS Lambda
        run: echo 'Dist is here: ${{steps.create_api_dist.outputs.dist_path}}'
```
