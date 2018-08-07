
import chalk from "chalk";
import {readFile as readFileCallback} from "fs";
import { Spring, Operator } from "plumbing-toolkit";

export {chalk};

/**
 * Does nothing.
 * @param args Anything.
 */
export function nop(...args: string[]) {}

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
    /**
     * Logs stuff using a given prefix.
     * @param {string} prefix The prefix to prepend.
     * @param {string[]} msg The actual message.
     */
    function logPrefix(prefix: string, ...msg: string[]) {
        console.log(prefix + "\t" + chalk.gray(time.local()) + "\t", ...msg);
    }

    export const main           = (...msg: string[]) => logPrefix(chalk.red.bold("[ts-irc]"), ...msg);
    export const server         = (...msg: string[]) => logPrefix(chalk.blue.bold("[Server]"), ...msg);
    export const interaction    = (...msg: string[]) => logPrefix(chalk.green.bold("[Interaction]"), ...msg);
    export const debug          = (...msg: string[]) => logPrefix(chalk.yellow.bold("[Debug]"), ...msg);
    export const test          = (...msg: string[]) => logPrefix(chalk.green.bold("[Test]"), ...msg);
}

/**
 * Promise wrapper for fs.readFile
 * @param path File to be read.
 */
export function readFile(path: string | Buffer): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        readFileCallback(path, (err, data) => {
            if (err === undefined) {
                resolve(data);
            } else {
                reject(err);
            }
        });
    });
}

/**
 * Gets value from map or returns default, if not found.
 * @param {{[key : string] : V}} m Map to get from.
 * @param {string} key Key to get.
 * @param {V} def Value to return if not found.
 */
export function getOrDefault<V>(m: {[key: string]: V}, key: string, def: V): V {
    const v = m[key];
    if (v === undefined) {
        m[key] = def;

        return def;
    }

    return v;
}


/**
 * Output stream to the console, has extra columns and rows.
 */
export type IConsole = NodeJS.WriteStream & {
    columns: number;
    rows: number;
};

/**
 * Checks whether a given object can be considered a Console to output to and read its dimensions.
 * @param object The object to check.
 */
export function isConsole(object: any): object is IConsole {
    return typeof object === "object" &&  typeof object.columns === "number" && typeof object.rows === "number";
}


export function listen<T>(stream: NodeJS.ReadableStream): Spring<T> {
    return sink => {
        const onerr     = (err: Error) => sink.throw(err);
        const onclose   =           () => sink.return();
        const ondata    =    (data: T) => sink.next(data);

        stream.once("error", onerr);
        stream.once("close", onclose);
        stream.on("data",  ondata);

        return () => {
            stream.off("error", onerr);
            stream.off("close", onclose);
            stream.off("data", ondata);
        }
    };
}

export function stringifier(): Operator<{toString(): string}, string>
{
    return input => input.map(obj => obj.toString());
}
