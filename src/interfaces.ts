import {Server, Socket} from "net";

// Miscellanous

export interface IDataEvent<T = Buffer> {
    on(event: "data",  cb: (data: T)             => void): void;
    on(event: "close", cb: (hadError: Boolean)  => void): void;
    on(event: "error", cb: (error: Error)        => void): void;
}

export type WriteStream        = NodeJS.WriteStream;
export type ReadStream         = NodeJS.ReadStream;
export type ReadWriteStream    = NodeJS.ReadWriteStream;
export type EventWriteStream   = IDataEvent & WriteStream;

export interface IActor<T = string, K = string, P = void> {
    tell(msg: T, sender?: IActor<K, any>): Promise<P>;
    shutdown?(sender: IActor<K, any>): Promise<void>;
}
export function isActor(object: any): object is IActor {
    return "tell" in object && "shutdown" in object;
}

export interface IPipeable<K = void> {
    pipe(target: IActor): Promise<K | undefined>;
}
export function isPipeable(object: any): object is IPipeable {
    return "pipe" in object;
}

export type IConsole = WriteStream & {
    columns: number;
    rows: number;
};

// Transciever

export interface ITransciever extends IPipeable, IActor {
    tell(msg: string): Promise<void>;
    pipe(target: IActor, then?: IActor): Promise<void>;
}

// Client

export interface IIRCClient extends ITransciever {
    nick: string;
    host: string;
    server: IIRCServer;
    reply: IReplyGenerator;
    identifier: string;
    authed: boolean;
    username: string;
    fullname: string;
}

// CommandHandler

export interface ICommandHandler extends IActor {
    parser: IParser;
    tell(msg: string, target: IActor): Promise<void>;
}
export type ICommandFunction = (sender: IActor, cmd: IIRCMessage) => Promise<IIRCMessage | IIRCMessage[] | undefined>;

// Message

export interface IIRCMessage {
    prefix: string;
    command: string;
    args: string[];
    msg: string;
}

// Parser

export interface IParser {
    parse(message: string): IIRCMessage;
}

// Replies

export type IReplyGenerator = any;

// Server

export interface IIRCServer<T extends IIRCClient = IIRCClient> {
    port: number;
    server: Server;
    commandHandler: ICommandHandler;
    clients: T[];
    hostname: string;
    created: Date;
    version: string;
    onConnection(socket: Socket): Promise<void>;
    listen(): Promise<void>;
    getClients<K extends keyof T>(where: K, equals: T[K]): Promise<T[]>;
    broadcast(msg: string, clients?: T[]): Promise<void>;
    introduceToClient(client: T): Promise<void>;
}