# redux state manager

Easy, typescript friendly, redux store management for APIs and sockets. [Read the docs][docs] to know more

## What is it?
Redux State Manager is a library, written on top of redux-saga, that removes boilerplate code and provides and intuitive mode to call `APIs`, received `WebSocket` messages and manipulate `state` data. 


## Motivation
Redux-Saga is a powerful library for managing asynchronous calls inside react, but it requires lots of boilerplate, unintuitive code, so I decided to create a configurable interface over it that `just works` and allows you to focus on fast development instead moving chunks of code from one file to another.


## Features
- Simple [API request action definition][api-type]
- No headache [WebSocket message listeners][socketmanager]
- Clean [state manipulation][create-json-requests] using javascript immutable objects
- Strong typed [selectors][selectors] for accessing the state

[docs]: https://github.stoica.dev/redux-state-manager/#
[api-type]: https://github.stoica.dev/redux-state-manager/#/apimanager#api-type
[create-json-requests]: https://github.stoica.dev/redux-state-manager/#/apimanager#create-json-requests
[socketmanager]: https://github.stoica.dev/redux-state-manager/#/socketmanager
[selectors]: https://github.stoica.dev/redux-state-manager/#/selectors
