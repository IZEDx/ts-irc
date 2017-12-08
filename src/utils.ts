// Async Hacks
(<any>Symbol)["asyncIterator"] = Symbol.asyncIterator || Symbol.for("asyncIterator");
export interface AsyncIterable<T>{[Symbol.asyncIterator](): AsyncIterator<T>;}

import {Socket} from "net";


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

export async function* faucet(pipeable : IPipeable) : AsyncIterable<string>{
    let waiting  : ((data : string) => void)|null;
    let buffered : string[] = [];
    let ended               = false;

    pipeable.pipe({
        async tell(msg : string){
            if(waiting){
                waiting(msg);
                waiting = null;
                return;
            } 
            buffered.push(msg);
        },
        async shutdown(){
            ended = true;
        }
    });

    while(!ended){
        yield await new Promise<string>( resolve => {
            if(buffered.length > 0){
                resolve(buffered[0]);
                buffered.splice(0,1);
                return;
            }
            waiting = resolve;
        });
    }
}


// Subset of NodeJS.EventEmitter requiring the events "data", "end" and "error". Can be listened on until completion.
export interface IDataEvent{
    on(event : "data",  cb : (data : Buffer)        => void) : void;
    on(event : "close", cb : (had_error : Boolean)  => void) : void;
    on(event : "error", cb : (error : Error)        => void) : void;
}

// types implementing IDataEvent and NodeJS.WriteStream
// Can be listened on and written.
export type NodeDataStream = IDataEvent&NodeJS.WriteStream;

/**
 * Async Data Generator. Takes an input providing data and yields that.
 * @param {IDataEvent} stream
 * @returns {AsyncIterable<Buffer>}
 */
export async function* dataEvent(stream : IDataEvent) : AsyncIterable<Buffer> {
    let waitingResolve  : null | ((data : Buffer) => void);
    let waitingReject   : (err : Error) => void;
    let buffered : Buffer[]                     = [];
    let ended                                   = false;

    stream.on("error", err => waitingReject && waitingReject(err) );
    stream.on("close", had_error =>{ 
        ended = !had_error;
        if(waitingReject) waitingReject(new Error("Event closed"));
    });
    stream.on("data",  data => {
        if(!waitingResolve) return buffered.push(data);
        waitingResolve(data);
        waitingResolve = null;
    });

    let error : Error;
    while(true){
        try{
            yield await new Promise<Buffer>( (resolve, reject) => {
                waitingReject = reject;
                if(buffered.length == 0) return waitingResolve = resolve;

                resolve(buffered[0]);
                buffered.splice(0,1);
            });
        }catch(err){
            error = err;
            break;
        }
    }

    if(!ended){
        throw error;
    }
}


export interface IParser<T>{
    parse(msg : string) : Promise<T>;
}

export type IActorParser<T> = IParser<T> & IActor<string, void, T>;

export const log = console.log;