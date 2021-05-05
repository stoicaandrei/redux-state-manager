# API Manager

This manager is used for creating API requests and handling the data received from them.

## API type
This is the main data necessary for creating an API request
```tsx
type API<Payload, Result, State> = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  successReducer: (state: Draft<State>, result: Result, payload: Payload) => void;
  failReducer?: (state: Draft<State>, error: Error, payload: Payload) => void;
  startReducer?: (state: Draft<State>, payload: Payload) => void;
};
```
- `Payload` is the data that sent to the API
- `Result` is the data retrieved from the API
- `State` is the state defined for the manager

The state can be mutated in all the API phases via the `startReducer`, `successReducer`, and `failReducer`.

## JSON Requests
This is the most common request that will probably be used.

Header `Content-Type: application/json` will be set for every request.

The method is defined as followed
```tsx
createJsonRequest<Payload, Result>(actionName: string, api: API)
```
- `actionName` must be unique for every request
Let's take a login action as an example

### Creating JSON Requests
```tsx
import { apiManager } from 'stateManager';

type LoginPayload = {
  username: string;
  password: string;
};

type LoginResult = {
  token: string;
}

export const login = apiManager.createJsonRequest<
  LoginPayload, 
  LoginResult
>('LOGIN', {
  path: '/auth/get-token/',
  method: 'POST',
  successReducer: (state, result) => {
    state.authToken = result.token;
  },
});
```
### Using JSON Requests
Using the requests is straightforward

```tsx
import React from 'react';
import { useDispatch } from 'stateManager';

import { login } from './actions';

const LoginButton: React.FC = () => {
  const dispatch = useDispatch();
  
  const username = 'demo_user';
  const password = 'demo_password';

  const onButtonClicked = () => dispatch(login({username, password}));
  
  return <button onClick={onButtonClicked}>Login</button>;
}
```

## Form Requests
Form requests work the same way as the JSON ones, but they don't provide the `Content-Type: application/json` header, and are used for `file uploading`.

```tsx
import { apiManager } from 'stateManager';

type UploadPicPayload = {
  description: string;
  picture: string | Blob;
};

type UploadPicResult = {
  id: number;
  description: string;
  imgUrl: string;
}

export const uploadPic = apiManager.createFormRequest<
  UploadPicPayload, 
  UploadPicResult
>('UPLOAD_PIC', {
  path: '/images/upload/',
  method: 'POST',
  successReducer: (state, result) => {
    state.pictures.push(result);
  },
});
```
