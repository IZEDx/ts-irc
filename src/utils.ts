// Async Hacks
(<any>Symbol).asyncIterator = Symbol.asyncIterator || Symbol.for("asyncIterator");
export interface AsyncIterable<T> {[Symbol.asyncIterator](): AsyncIterator<T>; }

import {IDataEvent, IPipeable} from "./interfaces";
import chalk from "chalk";
import {readFile as readFileCallback} from "fs";

/**
 * Async iterator to subscribe on a pipeable.
 * @param {IPipeable} pipeable Pipeable to read
 */
export async function* faucet(pipeable: IPipeable): AsyncIterable<string> {
    let waiting: ((data: string) => void) | null;
    const buffered: string[] = [];
    let ended               = false;

    pipeable.pipe({
        async tell(msg: string) {
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
export async function* listen<T>(stream: IDataEvent<T>): AsyncIterable<T> {
    let waitingResolve: null | ((data: T) => void);
    let waitingReject: (err: Error) => void;
    const buffered: T[]                     = [];
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

    let error: Error|undefined;
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

/**
 * Does nothing.
 * @param args Anything.
 */
export const nop = (...args: any[]) => {};

/**
 * Time utilities
 */
export namespace time {
    export const local = () => new Date().toLocaleString();
}

/**
 * Logging utilities
 */
export namespace log {
    function logPrefix(prefix: string, ...msg: string[]) {
        console.log(prefix + "\t" + chalk.gray(time.local()) + "\t", ...msg);
    }

    export const main           = (...msg: string[]) => logPrefix(chalk.red.bold("[ts-irc]"), ...msg);
    export const server         = (...msg: string[]) => logPrefix(chalk.blue.bold("[Server]"), ...msg);
    export const interaction    = (...msg: string[]) => logPrefix(chalk.green.bold("[Interaction]"), ...msg);
    export const debug          = (...msg: string[]) => logPrefix(chalk.yellow.bold("[Debug]"), ...msg);
}

/**
 * Promise wrapper for fs.readFile
 * @param path File to be read.
 */
export function readFile(path: string | Buffer): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        readFileCallback(path, (err, data) => {
            if (!err) {
                resolve(data);
            } else {
                reject(err);
            }
        });
    });
}

/**
 * Gets value from map or returns default, if not found.
 * @param {{[key : string] : V}} map Map to get from.
 * @param {string} key Key to get.
 * @param {V} def Value to return if not found.
 */
export function getOrDefault<V>(map: {[key: string]: V}, key: string, def: V): V {
    const v = map[key];
    if (v === undefined) {
        map[key] = def;
        return def;
    }
    return v;
}