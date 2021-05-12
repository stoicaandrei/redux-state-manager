## Getting Started

Install the dependency.

```sh
yarn add redux-state-manager

// or

npm install --save redux-state-manager
```

## State Manager Instance

In my `stateManager.ts` I have:
```tsx
import StateManager from 'redux-state-manager';

const stateManager = new StateManager({});

const { apiManager, socketManager } = stateManager.managers;
const { useSelector, useDispatch } = stateManager.hooks;
const getStore = stateManager.getStore.bind(stateManager);

export {apiManager, socketManager, useSelector, useDispatch, getStore};
```

See all the configuration options in the [configuration section](configuration.md)

## State Provider

In my `index.tsx` I have
```tsx
import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';

// It's important that you import getStore after importing the App
import { getStore } from 'stateManager';
import { StateProvider } from 'redux-state-manager';

ReactDOM.render(
  <StateProvider store={getStore()}>
    <App />
  </StateProvider>,
  document.getElementById('root')
);

```
As simple as that. You are good to go.
