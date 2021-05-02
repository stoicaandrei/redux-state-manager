## API Url
Set the `API` endpoint for the state manager.
```js
const API_URL = 'http://localhost:8000/api';
const stateManager = new StateManager({ apiUrl: API_URL });
```

## Web Socket Url
Set the `WebSocket` endpoint for the state manager.
```js
const SOCKET_URL = 'ws://localhost:8000/api';
const stateManager = new StateManager({ socketUrl: SOCKET_URL });
```

## State Type Definition
Define the `type` of the state that the manager will keep track of.

```js
type User = {
  id: number;
  name: string;
};

type State = { 
  authToken: string;
  users: User[];
};

const stateManager = new StateManager<State>({});
```
## Initial State
Define initial values for the state based on the `State` type defined.

```js
const stateManager = new StateManager<State>({
  initialState: {
    users: [{id: 0, name: 'mock_user'}],
  },
});
```

## Token Selector
Specify where the token for authentication will be found
```js
const stateManager = new StateManager<State>({
  tokenSelector: state => state.authToken,
});
```
At every API request, the token will be retrieved from the state and put inside the `Authorization Header`
```
Authorization: JWT <your_token>
```

## Permanent Params Selectors
Similarly to `token selector`, this is used for parameters that need to be sent with every request.
```js
const stateManager = new StateManager<State>({
  permanentParamsSelectors: [
    {varName: 'session_id', selector: state => state.session_id},
  ],
});
```
This parameter will be sent either in the `query params` or the `body`, depending on the http request type.
