// Async Hacks
(<any>Symbol)["asyncIterator"] = Symbol.asyncIterator || Symbol.for("asyncIterator");
export interface AsyncIterable<T>{[Symbol.asyncIterator](): AsyncIterator<T>;}

import {Socket} from "net";


export interface IActor<T = string, K = void>{
    tell(msg : T, sender? : IActor<T, K>) : Promise<K|undefined>;
    shutdown(sender : IActor<T, K>) : Promise<void>;
}
export function isActor(object : any) : object is IActor{
    return 'tell' in object && 'shutdown' in object;
}



export interface IPipeable<K = void>{
    pipe(sender : IActor) : Promise<K|undefined>;
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
    on(event : "data",  cb : (data : Buffer)    => void) : void;
    on(event : "close",   cb : ()                 => void) : void;
    on(event : "error", cb : (err : Error)      => void) : void;
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

    stream.on("error",  (err  : Error)  => waitingReject(err) );
    stream.on("close",    ()              => ended = true );
    stream.on("data",   (data : Buffer) => {
        if(!waitingResolve) return buffered.push(data);
        waitingResolve(data);
        waitingResolve = null;
    });

    while(!ended){
        yield await new Promise<Buffer>( (resolve, reject) => {
            waitingReject = reject;
            if(buffered.length == 0) return waitingResolve = resolve;

            resolve(buffered[0]);
            buffered.splice(0,1);
        });
    }
}