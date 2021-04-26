import type { SocketActions } from './types';

import { PING_INTERVAL, PONG_TIMEOUT, PING, PONG, SOCKET_STATES, SOCKET_OPENED } from './constants';

type ConstructorProps<State> = {
  socketUrl: string;
  socketEvents: SocketActions;
};

export default class SocketListener<State> {
  private readonly socketUrl: string;
  readonly socketEvents: SocketActions;
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

  private handleMessage: (...args: unknown[]) => void;
  private handleOpen: (...args: unknown[]) => void;
  private handleClose: (...args: unknown[]) => void;
  private handleReconnect: (...args: unknown[]) => void;

  constructor(props: ConstructorProps<State>) {
    this.socketUrl = props.socketUrl;
    this.socketEvents = props.socketEvents;

    this.socketEvents = {};
    this.sockets = {};

    this.timeouts = {};
    this.pingInterval = null;

    this.handleMessage = () => {
      /* empty */
    };
    this.handleOpen = () => {
      /* empty */
    };
    this.handleClose = () => {
      /* empty */
    };
    this.handleReconnect = () => {
      /* empty */
    };
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

    socket.onopen = () => {
      this.pingInterval = setInterval(() => this._ping(socketDesc), PING_INTERVAL);
      this.handleOpen(socketDesc);
    };

    socket.onclose = (event) => {
      clearInterval(this.pingInterval as NodeJS.Timeout);
      // attempt to reconnect if socket connection is dropped

      if (!event.wasClean) {
        const { token, uri } = this.sockets[socketDesc];
        setTimeout(() => this.connectToSocket(socketDesc, token, uri), 10000);
      }

      this.handleClose(socketDesc, event.wasClean);
    };

    socket.onmessage = (event) => {
      const message = event.data;
      if (message === PONG) this._onPong(socketDesc);
      else {
        this.handleMessage(socketDesc, JSON.parse(event.data));
      }
    };
  };

  public connectToSocket = (socketDesc: string, token: string, uri: string) => {
    if (this.sockets[socketDesc] && SOCKET_STATES[this.sockets[socketDesc].socket.readyState] === SOCKET_OPENED) return;

    const socket = new WebSocket(`${this.socketUrl}${uri}?token=${token}`);

    this.sockets[socketDesc] = { token, uri, socket };
    this._listen(socketDesc);
  };

  public disconnectFromSocket = (socketDesc: string) => {
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
