// Async Hacks
(<any>Symbol).asyncIterator = Symbol.asyncIterator || Symbol.for("asyncIterator");
export interface AsyncIterable<T> {[Symbol.asyncIterator](): AsyncIterator<T>; }

import {IDataEvent, IPipeable} from "./interfaces";
import chalk from "chalk";

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
export async function* listen<T>(stream : IDataEvent<T>) : AsyncIterable<T> {
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

    let error : Error|undefined;
    while (error === undefined) {
        try {
            yield await new Promise<T>((resolve, reject) => {
                waitingReject = reject;
                if (buffered.length === 0) { return waitingResolve = resolve; }

                resolve(buffered[0]);
                buffered.splice(0, 1);
            });
        } catch (err) {
            error = err;
        }
    }

    if (!ended) {
        throw error;
    }
}

export const nop = (...args : any[]) => {};

export namespace now {
    export const local = () => new Date().toLocaleString();
}

export namespace log {
    function logPrefix(prefix : string, ...msg : string[]) {
        console.log(prefix + "\t" + chalk.gray(now.local()) + "\t", ...msg);
    }

    export const main           = (...msg : string[]) => logPrefix(chalk.red.bold("[ts-irc]"), ...msg);
    export const server         = (...msg : string[]) => logPrefix(chalk.blue.bold("[Server]"), ...msg);
    export const interaction    = (...msg : string[]) => logPrefix(chalk.green.bold("[Interaction]"), ...msg);
}