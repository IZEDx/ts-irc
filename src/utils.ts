// Async Hacks
(Symbol as any).asyncIterator = Symbol.asyncIterator || Symbol.for("asyncIterator");
export interface AsyncIterable<T> {[Symbol.asyncIterator](): AsyncIterator<T>; }

import {IDataEvent, IPipeable} from "./interfaces";

export async function* faucet(pipeable : IPipeable) : AsyncIterable<string> {
    let waiting  : ((data : string) => void) | null;
    const buffered : string[] = [];
    let ended               = false;

    pipeable.pipe({
        async tell(msg : string) {
            if (waiting) {
                waiting(msg);
                waiting = null;
                return;
            }
            buffered.push(msg);
        },
        async shutdown() {
            ended = true;
        }
    });

    while (!ended) {
        yield await new Promise<string>(resolve => {
            if (buffered.length > 0) {
                resolve(buffered[0]);
                buffered.splice(0, 1);
                return;
            }
            waiting = resolve;
        });
    }
}

/**
 * Async Data Generator. Takes an input providing data and yields that.
 * @param {IDataEvent<T>} stream
 * @returns {AsyncIterable<T>}
 */
export async function* dataEvent<T>(stream : IDataEvent<T>) : AsyncIterable<T> {
    let waitingResolve  : null | ((data : T) => void);
    let waitingReject   : (err : Error) => void;
    const buffered : T[]                     = [];
    let ended                                   = false;

    stream.on("error", err => waitingReject && waitingReject(err));
    stream.on("close", hadError => {
        ended = !hadError;
        if (waitingReject) { waitingReject(new Error("Event closed")); }
    });
    stream.on("data",  data => {
        if (!waitingResolve) { return buffered.push(data); }
        waitingResolve(data);
        waitingResolve = null;
    });

    let error : Error;
    while (true) {
        try {
            yield await new Promise<T>((resolve, reject) => {
                waitingReject = reject;
                if (buffered.length === 0) { return waitingResolve = resolve; }

                resolve(buffered[0]);
                buffered.splice(0, 1);
            });
        } catch (err) {
            error = err;
            break;
        }
    }

    if (!ended) {
        throw error;
    }
}

export const log = console.log;

export const nop = () => {};
