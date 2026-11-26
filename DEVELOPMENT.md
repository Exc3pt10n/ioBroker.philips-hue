# Development

Notes for contributors. User documentation: [README.md](README.md).

## Setup and checks

```bash
npm install
npm run build              # TypeScript → build/
npm test                   # unit and package tests
npm run test:integration   # adapter in a js-controller test instance against a simulated bridge
npm run lint && npm run check
```

## Architecture

```
Hue bridge (CLIP API v2)
   │  GET /clip/v2/resource          full snapshot at start, after reconnects and structural changes
   │  SSE /eventstream/clip/v2       pushed updates
   │  PUT /clip/v2/resource/<type>   commands, rate limited and merged per resource
   ▼
ResourceIndex (all resources by id)
   ▼
model.ts: object tree and state values (pure functions)
   ▼
main.ts: synchronizes objects, writes states, translates state writes via commands.ts
```

- Object ids are derived from the names in the Hue app. An id once created is kept via `native.id`/`native.type`,
  so a rename in the Hue app does not break scripts.
- Updates which change the object tree (`metadata`, `children`, `services`, added or deleted resources) trigger a
  full resynchronisation, all others only update the affected states.

## Project structure

```
src/
  main.ts            life cycle, object synchronisation, events, state writes, admin messages
  lib/hue/           Hue API v2 client: REST, event stream, command queue, bridge discovery, types
  lib/model.ts       object tree and state values from the resources
  lib/commands.ts    state writes → API v2 commands
  lib/color.ts       color conversion (xy, RGB, mirek)
  lib/resourceIndex.ts
test/
  unit/              unit tests of the pure logic
  integration/       simulated bridge (HTTPS + event stream)
  integrationAdapter.ts, packageFiles.ts
admin/               jsonConfig of the instance settings, translations, icon
```
