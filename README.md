# redux state manager

Easy, typescript friendly, redux store management for APIs, sockets and local events

### <span style="color:red">Documentation needs to be updated</span>

## Table of Contents

* [Installation](#installation)
* [Quick Look](#quick-look)
* [How to setup](#how-to-setup)
  * [File Structure](#file-structure)
  * [State Manager Instance](#state-manager-instance)
  * [Connect to Redux Store](#connect-to-redux-store)
* [How to use](#how-to-use)
  * [Creating new modules](#creating-new-modules)
  * [Creating APIs](#creating-apis)
  * [Creating Sockets](#creating-sockets)
  * [Creating Local Events](#creating-local-events)


## Installation

```shell
$ yarn add redux-state-manager
```
or
```shell
$ npm install --save redux-state-manager
```

## Quick look

```js
const stateModule = 'pet';

type Pet = {
  id: number;
  name: string;
  photoUrls: string[];
};

type State = {
  waiting: boolean;
  items: Pet[];
  error?: Error;
};

type Payload = { id: number; };
type Result = Pet;

export const retrievePet = stateManager.createApi<
  Payload,
  Result,
  State
>(stateModule, 'RETRIEVE_PET', {
  path: '/:id',
  method: 'GET',
  successReducer: (state, result, payload) => {
    state.item.push(result);
  },
});
```

## How to setup

### File structure

I recommend keeping all the state login in a module folder, separated from the react views

```bash
src
  ├── components # react components
  ├── views # react views
  ├── state # state logic
  │   ├── modules # add as many as you want
  │   │   ├── pets
  │   │   │   ├── actions.ts
  │   │   │   ├── selectors.ts
  │   │   │   └── types.ts
  │   │   └── root # this is mandatory
  │   │       └── index.ts
  │   ├── index.ts
  │   └── store.ts
  ├── App.tsx
  └── index.tsx
```

### State Manager Instance

```js
// modules/root/index.ts

import { StateManager } from 'redux-state-manager';

export type StoreState = {}; // this will help us later

const API_URL = 'http://localhost:8000/api';
const SOCKET_URL = 'ws://localhost:8000/api';

export const stateManager = new StateManager<StoreState>({
 // All settings are optional
 apiUrl: API_URL, 
 socketUrl: SOCKET_URL,
 authSelector: state => state.auth.item.token, // tell StateManager where to find the JWT token
 selectors: [ // use this for any other data that has to be sent at every request
    {
      varName: 'session_id',
      selector: state => state.session.item.id,
    },
  ],
});
```

If the APIs require JWT authentication you need to pass `authSelector` to createModule.



Then, in the other modules you will `import { stateManager } from '../root';`

### Connect to Redux Store

```js
// state/index.ts
import { createStore, compose, applyMiddleware, StoreEnhancer } from 'redux';
import { devToolsEnhancer } from 'redux-devtools-extension/logOnlyInProduction';
import createSagaMiddleware from 'redux-saga';
import { createSocketMiddleware } from 'redux-state-manager';

import { stateManager, StoreState } from './modules/root/';

const sagaMiddleware = createSagaMiddleware();

const enhancers = compose(
  /* Add the redux-saga middleware */
  applyMiddleware(createSocketMiddleware(stateManager)),
  applyMiddleware(sagaMiddleware),
  
  /* Include the devtools. Comment this out if you don't want to use the dev tools. */
  devToolsEnhancer({})
) as StoreEnhancer<StoreState>;

/**
 * Create the store. We do not include an initial state, as each of the module
 * reducers includes its own initial state.
 */
const store = createStore(apiManager.reducer, enhancers);

/* Run the root saga */
sagaMiddleware.run(apiManager.saga);

export function getStore() {
  return store;
}

```
Then, in `index.tsx`, import `getStore` and pass it to the `Redux Provider`

## How to use

### Creating new modules

Every module should have a `types.ts` and `actions.ts`

You'll need to create a `State` type, import it in `root/index.ts` and addd it to the `StoreState`

```js
// modules/root/index.ts

...
export const stateManager = ...

import { State: PetsState } from '../pets/types';
...

export type StoreState = {
  pets: PetsState;
  ...
};
```

You'll also need to have this snippet at the start of `action.ts`

```js
// modules/pets/actions.ts

import { stateManager } from '../root';

import * as types from './types';

const stateModule = 'pets';

stateManager.createModule(stateModule, { initialState: {} })
```

You can also pass `selectors` property the same as at [State Manager Instance](#state-manager-instance) if you want data to be sent at every request, but for that specific module.

### Creating APIs

This is done via the `createApi<Payload, Result, State>(module: string, actionName: string, api: API)` method

```js
// modules/pets/actions.ts

export const retrievePet = stateManager.createApi<
  types.RetrievePetPayload, // what arguments need to be passed to the API  (i.e { id: number })
  types.RetrievePetResult, // what are you expecting to receive from the api
  types.State // the State of the module
>(
stateModule, 
'RETRIEVE_PET', 
{
  path: '/:id',
  method: 'GET',
  successReducer: (state, result, payload) => {
    state.items.push(result);
  },
}
);

// Then, in the react view, you only need to dispatch the created action
```

The `API` object should look as following
```js
type API<Payload, Result, ApiState> = {
  path: string;
  endpoint?: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: Payload;
  auth?: boolean;
  successReducer: (state: ApiState, result: Result, payload: Payload) => void;
  failReducer?: (state: ApiState, error: Error, payload: Payload) => void;
  startReducer?: (state: ApiState, payload: Payload) => void;
};
```

To note about the `API` object
* The URL that will be called is `{API_URL}/{stateModule}/{path}`
* If the endpoint for the API isn't the same with `stateModule`, you can overwrite it via the `enpoint` param. It will become `{API_URL}/{endpoint}/{path}`
* The URL params from the path will be automatically picked from the payload
i.e 
```js
type payload = { id: number; name: string; };

stateManager.createApi<payload, _, _>(_, _, { path: '/:id', method: 'POST', ... });
// id` will be passed in as a url param, and only `name` will be send as json data to the API
```
* The reducers will always modify `waiting` and `error` properties of the state

### Creating Sockets

This is done via the `createSocketListener<Result, State>(module: string, event: string, onReceive: (state, result) => void)` method

```js
// modules/pets/actions.ts

const stateModule = 'pets';

stateManager.createSocketListener<types.Pet, types.State>(
  stateModule,
  'created',
  (state, result) => {
    state.items.push(result);
  }
);
```

To note about sockets
* This will listen for a socket signal with `type={stateModule}.{event}`


## Creating local events

Local events are action that do not make any request, they just change the state

This is done via the `createLocalEvent<Payload, State>(module: string, actionName: string, reducerFn: (state, payload) => void)` method

```js
// modules/pets/actions.ts

type payload = { id: number; };

const selectPet = stateManager.createLocalEvent<payload, types.State>(
  stateModule,
  'SELECT_PET',
  (state, payload) => {
    state.selected = payload.id;
  }
)
```
