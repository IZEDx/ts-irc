import {Server, Socket} from "net";

/**
 * Required events on an EventEmitter so that it can be observed.
 */
export interface IDataEvent<T = Buffer> {
    on(event: "data",  cb: (data: T)             => void): void;
    on(event: "close", cb: (hadError: Boolean)  => void): void;
    on(event: "error", cb: (error: Error)        => void): void;
}

// Node Streams
export type WriteStream        = NodeJS.WriteStream;
export type ReadStream         = NodeJS.ReadStream;
export type ReadWriteStream    = NodeJS.ReadWriteStream;
export type EventWriteStream   = IDataEvent & WriteStream;

/**
 * An Actor can be told messages to either operate on or relay.
 */
export interface IActor<T = string, K = string, P = void> {
    tell(msg: T, sender?: IActor<K, any>): Promise<P>;
    shutdown?(sender: IActor<K, any>): Promise<void>;
}
export function isActor(object: any): object is IActor {
    return "tell" in object && "shutdown" in object;
}

/**
 * A Pipeable can be piped into an Actor, if the Actor is a subscriber, it can thus be subsribed on.
 */
export interface IPipeable<K = void> {
    pipe(target: IActor): Promise<K | undefined>;
}
export function isPipeable(object: any): object is IPipeable {
    return "pipe" in object;
}

/**
 * Output stream to the console, has extra columns and rows.
 */
export type IConsole = WriteStream & {
    columns: number;
    rows: number;
};

/**
 * Transciever interface
 */
export interface ITransciever extends IPipeable, IActor {
    tell(msg: string): Promise<void>;
    pipe(target: IActor, then?: IActor): Promise<void>;
}

/**
 * IRCClient interface
 */
export interface IIRCClient extends ITransciever {
    nick: string;
    hostname: string;
    server: IIRCServer;
    reply: IReplyGenerator;
    identifier: string;
    authed: boolean;
    username: string;
    fullname: string;
}

/**
 * CommandHandler interface
 */
export interface ICommandHandler extends IActor {
    parser: IParser;
    tell(msg: string, target: IActor): Promise<void>;
}
export type ICommandFunction = (sender: IActor, cmd: IIRCMessage) => Promise<IIRCMessage | IIRCMessage[] | undefined>;

/**
 * IRCMessage interface
 */
export interface IIRCMessage {
    prefix: string;
    command: string;
    args: string[];
    msg: string;
}

/**
 * Parser interface
 */
export interface IParser {
    parse(message: string): IIRCMessage;
}

/**
 * ReplyGenerator interface
 */
export type IReplyGenerator = any;

/**
 * IRCServer interface
 */
export interface IIRCServer<T extends IIRCClient = IIRCClient, K extends IIRCChannel = IIRCChannel> {
    port: number;
    server: Server;
    commandHandler: ICommandHandler;
    clients: T[];
    channels: K[];
    hostname: string;
    created: Date;
    version: string;
    onConnection(socket: Socket): Promise<void>;
    listen(): Promise<void>;
    getClients<K extends keyof T>(where: K, equals: T[K]): Promise<T[]>;
    broadcast(msg: string, clients?: T[]): Promise<void>;
    introduceToClient(client: T): Promise<void>;
}

/**
 * IRCChannel interface
 */
export interface IIRCChannel extends IActor {
    clients: IIRCClient[];
    server: IIRCServer;
    name: string;
    topic: string;
    addClient(client: IIRCClient): void;
}