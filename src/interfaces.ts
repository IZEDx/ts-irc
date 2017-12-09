import {Socket, Server} from "net";

export interface IDataEvent<T = Buffer>{
    on(event : "data",  cb : (data : T)             => void) : void;
    on(event : "close", cb : (had_error : Boolean)  => void) : void;
    on(event : "error", cb : (error : Error)        => void) : void;
}

export type IWriteStream        = NodeJS.WriteStream;
export type IReadStream         = NodeJS.ReadStream;
export type IReadWriteStream    = NodeJS.ReadWriteStream;
export type IEventWriteStream   = IDataEvent&IWriteStream;

export interface IActor<T = string, K = string, P = void>{
    tell(msg : T, sender? : IActor<K, any>) : Promise<P>;
    shutdown?(sender : IActor<K, any>) : Promise<void>;
}
export function isActor(object : any) : object is IActor{
    return 'tell' in object && 'shutdown' in object;
}

export interface IPipeable<K = void>{
    pipe(target : IActor) : Promise<K|undefined>;
}
export function isPipeable(object : any) : object is IPipeable{
    return 'run' in object;
}

export interface IParser<T = IParseResult>{
    parse(msg : string) : Promise<T>;
}
export function isParser(object : any) : object is IParser<any>{
    return 'parse' in object;
}
export type IActorParser<T> = IParser & IActor<string, string, T>;
export type IParseResult = {prefix : string, command : string, args : string[]};


export interface ITransciever<T extends IReadWriteStream> extends IPipeable,IActor{
    tell(msg : string) : Promise<void>;
    pipe(target : IActor, then? : IActor) : Promise<void>;
}

export interface IIRCClient extends ITransciever<Socket>{
    nick : string,
    address : string;
    server : IIRCServer;
    username : string;
    fullname : string;
    authed : boolean;
    identifier : string;
    disconnect(): void;
}

export interface IIRCServer{
    port : number;
    server : Server;
    commandHandler : ICommandHandler;
    clients : IIRCClient[];
    hostname : string;
    listen() : Promise<void>;
    getClients<T extends keyof IIRCClient>(where : T, equals : IIRCClient[T]) : Promise<IIRCClient[]>;
    broadcast(msg : string, clients? : IIRCClient[]) : Promise<void>;
}

export interface ICommandHandler extends IActor{
    parser : IParser;
    tell(msg : string, target : IActor) : Promise<void>;
}