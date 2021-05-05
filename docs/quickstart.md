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

export default {
 apiManager,
 socketManager,
 getStore: stateManager.getStore,
 useSelector,
 useDispatch,
}
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
import { Provider as ReduxProvider } from 'redux-state-manager';

ReactDOM.render(
  <ReduxProvider store={getStore()}>
    <App />
  </ReduxProvider>,
  document.getElementById('root')
);

```
As simple as that. You are good to go.
