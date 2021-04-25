# redux state manager

Easy, typescript friendly, redux store management for APIs and sockets

## Table of Contents

* [Installation](#installation)
* [Quick Look](#quick-look)
* [How to setup](#how-to-setup)
  * [State Manager Instance](#state-manager-instance)
  * [Connect to Redux Store](#connect-to-redux-store)
* [How to use](#how-to-use)
  * [Creating APIs](#creating-apis)


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
type Pet = {
  id: number;
  name: string;
  photoUrls: string[];
};

type Payload = { id: number; };
type Result = Pet;

export const fetchPet = stateManager.createApi<
  Payload,
  Result
>('FETCH_PET', {
  path: 'pets/:id',
  method: 'GET',
  successReducer: (state, result) => {
    state.pets.push(result);
  },
});
```

## How to setup

### State Manager Instance

```js
// stateManager.ts

import { StateManager } from 'redux-state-manager';

export type StoreState = {}; // this will help us later

const API_URL = 'http://localhost:8000/api';

const stateManager = new StateManager<StoreState>({
 apiUrl: API_URL, 
 initialState: {
   auth: {},
 },
 tokenSelector: state => state.auth.item.token, // tell StateManager where to find the JWT token
 selectors: [ // use this for any other data that has to be sent at every request
    {
      varName: 'session_id',
      selector: state => state.session.item.id,
    },
  ],
});

export default stateManager
```
You will import this component for the actions regarding redux-state-manager

### Connect to Redux Store

```js
// index.tsx
import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';

import stateManager from 'stateManager';
import { Provider as ReduxProvider } from 'react-redux';

ReactDOM.render(
  <ReduxProvider store={stateManager.getStore()}>
    <App />
  </ReduxProvider>,
  document.getElementById('root')
);

```

## How to use

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
type API<Payload, Result> = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  successReducer: (state: State, result: Result, payload: Payload) => void;
  failReducer?: (state: State, error: Error, payload: Payload) => void;
  startReducer?: (state: State, payload: Payload) => void;
};
```

To note about the `API` object
* The URL that will be called is `{API_URL}/{path}`
* The URL params from the path will be automatically picked from the payload
i.e 
```js
type payload = { id: number; name: string; };

stateManager.createApi<payload, _, _>(_, _, { path: '/:id', method: 'POST', ... });
// id` will be passed in as a url param, and only `name` will be send as json data to the API
```


