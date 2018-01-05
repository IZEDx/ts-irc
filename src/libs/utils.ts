
import chalk from "chalk";
import {readFile as readFileCallback} from "fs";
import {IConsole} from "./interfaces";

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

export function isConsole(object: any): object is IConsole {
    return typeof object === "object" &&  typeof object.columns === "number" && typeof object.rows === "number";
}
