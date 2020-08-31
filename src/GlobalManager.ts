import { call, ForkEffect, put, takeEvery, select } from 'redux-saga/effects';
import { combineReducers, Reducer } from 'redux';

import { API, CreateModuleOptions } from './types';
import apiCaller from './ApiCaller';

import { StateManager, combineManagers } from './index';

import { PING_INTERVAL, PONG_TIMEOUT, PING, PONG, SOCKET_STATES, SOCKET_OPENED } from './constants';

type ConstructorProps = {
  socketUrl?: string;
  managers: StateManager[];
};

export default class GlobalManager {
  readonly sockets: {
    [key: string]: {
      socket: WebSocket;
      uri: string;
      token: string;
    };
  };
  readonly timeouts: {
    [key: string]: NodeJS.Timeout;
  };
  private pingInterval: NodeJS.Timeout | null;
  readonly logging: boolean;

  private handleMessage: (...args: unknown[]) => void;
  private handleOpen: (...args: unknown[]) => void;
  private handleClose: (...args: unknown[]) => void;
  private handleReconnect: (...args: unknown[]) => void;

  readonly socketUrl: string;

  readonly reducer: Reducer;
  readonly saga: () => Generator;
  readonly events: Record<string, any>;

  constructor(props: ConstructorProps) {
    this.sockets = {};
    this.timeouts = {};
    this.pingInterval = null;
    this.logging = false;

    // Callbacks
    this.handleMessage = () => {
      /*empty*/
    };
    this.handleOpen = () => {
      /*empty*/
    };
    this.handleClose = () => {
      /*empty*/
    };
    this.handleReconnect = () => {
      /*empty*/
    };

    this.socketUrl = props.socketUrl || '';
    const { reducer, saga, events } = combineManagers(props.managers);

    this.reducer = reducer;
    this.saga = saga;
    this.events = events;
  }

  private _ping = (socketDesc: string) => {
    this.sockets[socketDesc].socket.send(PING);

    this.timeouts[socketDesc] = setTimeout(() => {
      this.sockets[socketDesc].socket.close(4008, 'ping_timeout');
    }, PONG_TIMEOUT);
  };

  private _onPong = (socketDesc: string) => {
    clearTimeout(this.timeouts[socketDesc]);
  };

  private _listen = (socketDesc: string) => {
    const { socket } = this.sockets[socketDesc];

    socket.onopen = (event) => {
      this.pingInterval = setInterval(() => this._ping(socketDesc), PING_INTERVAL);
      this._log(event, socketDesc);
      this.handleOpen(socketDesc);
    };

    socket.onclose = (event) => {
      clearInterval(this.pingInterval as NodeJS.Timeout);
      // console.log(this.sockets);
      // attempt to reconnect if socket connection is dropped

      if (!event.wasClean) {
        const { token, uri } = this.sockets[socketDesc];
        setTimeout(() => this.connectToSocket(socketDesc, token, uri), 10000);
      }

      this.handleClose(socketDesc, event.wasClean);
      this._log(event, socketDesc);
    };

    socket.onmessage = (event) => {
      const message = event.data;
      if (message === PONG) this._onPong(socketDesc);
      else {
        this.handleMessage(socketDesc, JSON.parse(event.data));
        this._log(event, socketDesc);
      }
    };
  };

  private _log = (event: any, socketDesc: string) => {
    // this.logging &&
    //   console.log({
    //     event,
    //     state: this.getState(socketDesc),
    //     socketObj: this.sockets,
    //   });
  };

  public getState = (socketDesc: string) => SOCKET_STATES[this.sockets[socketDesc].socket.readyState];

  public connectToSocket = (socketDesc: string, token: string, uri: string) => {
    if (this.sockets[socketDesc] && SOCKET_STATES[this.sockets[socketDesc].socket.readyState] === SOCKET_OPENED) return;

    const socket = new WebSocket(`${this.socketUrl}${uri}?token=${token}`);

    this.sockets[socketDesc] = { token, uri, socket };
    this._listen(socketDesc);
  };

  public disconnectFromSocket = (socketDesc: string) => {
    // console.log(this.sockets);
    this.sockets[socketDesc].socket.close();
  };

  public onOpen = (func: any) => {
    this.handleOpen = func;
  };

  public onReconnect = (func: any) => {
    this.handleReconnect = func;
  };

  public onMessage = (func: any) => {
    this.handleMessage = func;
  };

  public onClose = (func: any) => {
    this.handleClose = func;
  };
}
