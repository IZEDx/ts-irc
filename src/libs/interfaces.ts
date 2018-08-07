
import {Server, Socket} from "net";


/**
 * IRCClient interface
 */
export interface IIRCClient extends ISubject<string, string> {
    nick: string;
    hostname: string;
    server: IIRCServer;
    reply: any;
    identifier: string;
    authed: boolean;
    username: string;
    fullname: string;
}


/**
 * Parser interface
 */
export interface IParser {
    parse(message: string): IIRCMessage;
}
/**
 * IRCServer interface
 */
export interface IIRCServer<T extends IIRCClient = IIRCClient, K extends IIRCChannel = IIRCChannel> {
    port: number;
    server: Server;
    commandHandler: IHandler<IIRCMessage, string|undefined, T>;
    clients: T[];
    channels: K[];
    hostname: string;
    created: Date;
    version: string;
    onConnection(socket: Socket): Promise<void>;
    start(): Promise<void>;
    getClients<I extends keyof T>(where: I, equals: T[I]): Promise<T[]>;
    broadcast(msg: string, clients?: T[]): Promise<void>;
    introduceToClient(client: T): Promise<void>;
}

/**
 * IRCChannel interface
 */
export interface IIRCChannel extends IObserver<string> {
    clients: IIRCClient[];
    server: IIRCServer;
    name: string;
    topic: string;
    addClient(client: IIRCClient): void;
}
