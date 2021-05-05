# Selectors

## useSelector
In order to access the state, you need to make use of the `useSelector` hook

Example:
```tsx
import React from 'react';
import { useSelector } from 'stateManager';

const Greetings: React.FC = () => {
  const username = useSelector(state => state.auth.username);

  return <p>Hello, I am {username}!</p>;
};
```

## Loading Selectors
redux-state-manager provides an useful selector for api loading. Every apiRequest created comes with a `loadingSelector` attached.

```tsx
action.loadingSelector = (state) => state._loading[action.actionName];
```

Example:
```tsx
import React from 'react';
import { useDispatch, useSelector } from 'stateManager';

import { login } from './actions';

const LoginButton: React.FC = () => {
  const dispatch = useDispatch();
  const loggingIn = useSelector(login.loginSelector);

  if (loggingIn) return <p>Loading...</p>;
  
  const username = 'demo_user';
  const password = 'demo_password';

  const onButtonClicked = () => dispatch(login({username, password}));
  
  return <button onClick={onButtonClicked}>Login</button>;
}
```
