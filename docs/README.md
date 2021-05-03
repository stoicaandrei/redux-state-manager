# redux state manager

Easy, typescript friendly, redux store management for APIs and sockets

## What is it?
Redux State Manager is a library, written on top of redux-saga, that removes boilerplate code and provides and intuitive mode to call `APIs`, received `WebSocket` messages and manipulate `state` data. 


## Motivation
Redux-Saga is a powerful library for managing asynchronous calls inside react, but it requires lots of boilerplate, unintuitive code, so I decided to create a configurable interface over it that **just works** and allows you to focus on fast development instead moving chunks of code from one file to another.


## Features
- Simple [API request action definition](apimanager.md#api-type)
- No headache [WebSocket message listeners](socketmanager.md)
- Clean [state manipulation](apimanager.md#creating-json-requests) using javascript immutable objects
- Strong typed [selectors](selectors.md) for accessing the state

## Limitations

This library was made to work with a `django` + `channels` backend, and will keep updating as demand comes.

- The token authorization currently work only with `JWT tokens`
- The state can be updated only when some form of API request or a WebSocket message is received
- There is no way to send WebSocket messages to the server

If you experience any error or have some improvements ideas, don't hesitate to [create a new issue](https://github.com/stoicaandrei/redux-state-manager/issues) on github.

