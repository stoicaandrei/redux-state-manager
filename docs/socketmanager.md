# Web Socket Manager
This component is responsible for listening to websocket messages received from the server and updating the state accordingly.

The socket messages must be in the format `{ type: string, data: object }`

## Create Socket Listener
The methods used for creating listeners is defined as followed.
```js
createSocketListener<Result>(type: string, onReceive: (state: Draft<State>, result: Result) => void)
```
- `type` corresponds with the type from the message format

Example:
```js
import { socketManager } from 'stateManager';

type Message = {
  sender_id: number;
  text: string;
};

socketManager.createSocketListener<Message>('message_received', (state, result) => {
  state.messages.push(result);
});
```
