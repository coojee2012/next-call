import { Socket } from 'socket.io';

export interface SocketWithUserData extends Socket {
  user: {
    id: number;
    lastActiveTime: number;
    domain: string;
    tenantId: number;
    nickName: string;
  };
}

export type UserSocket = Map<number, SocketWithUserData>;

// heartbeat(ms)
export const HEART_BEAT_INTERVAL = 3000;

// all drop times
export const HEART_BEAT_ALLOWABLE_DROPED_TIMES = 1;