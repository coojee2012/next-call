import { createSocket, BindOptions, SocketOptions, RemoteInfo, Socket } from 'dgram';

import { DGRAM_SOCKET } from './dgram.constants';
import { rejects } from 'assert';

export const createDgramProviders = (
	bindOptions: BindOptions = { address: '0.0.0.0', port: 3002 },
	socketOptions: SocketOptions = { type: 'udp4' },
	onMessage: () => void = () => {},
) => [
	{
		provide: DGRAM_SOCKET,
		useFactory: () => {
			console.log('socketOptions:', socketOptions);
			const socket = createSocket(socketOptions);
			try {
				console.log('bindOptions:', bindOptions);
				return new Promise(resolve => socket.bind(bindOptions, () => resolve(socket)));
			} catch (error) {
				console.log(error)
				rejects(error);
			}
		},
	},
];