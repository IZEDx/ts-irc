
import {IHandler, IIRCClient} from "./interfaces";
import {IRCMessage} from "./message";
import {getOrDefault, log} from "./utils";

/**
 * CommandFunction
 */
export type FCommandFunction = (sender: IIRCClient, cmd: IRCMessage) => Promise<IRCMessage | IRCMessage[] | undefined>;

/**
 * Global map of functions that can be imported in a CommandHandler
 */
const commands: {[key: string]: {[key: string]: FCommandFunction}} = {};

/**
 * Decorator that registers a method as a command to be run. Will not be called with a proper this value.
 * @param {Function} target Method to be registered.
 * @param {string} propertyKey Key of the method.
 * @param {PropertyDescriptor} descriptor Descriptor
 */
export function registerCommand(target: Function, propertyKey: string, descriptor: PropertyDescriptor) {
    getOrDefault(commands, target.name.toLowerCase(), {})[propertyKey.toLowerCase()] = target[propertyKey];
}

/**
 * A class extending this can add commands to the CommandHandler.
 */
export class CommandLib {
    /**
     * Returns all methods with the the @registerCommand decorator.
     */
    get commands(): {[key: string]: FCommandFunction} {
        return getOrDefault(commands, this.constructor.name.toLowerCase(), {});
    }
}

/**
 * Handles all the commands.
 */
export class CommandHandler implements IHandler<IRCMessage, string> {
    public readonly libs: CommandLib[];

    /**
     * Creates a new CommandHandler.
     * @param {CommandLib[]} libs Libraries of commands to use.
     */
    constructor(...libs: CommandLib[]) {
        this.libs = libs;
    }

    /**
     * Tell a message to be parsed and executed.
     * @param {string} msg Message containing command.
     * @param {IRCClient} client Client to respond to.
     */
    public async handle(value: IRCMessage, client: IIRCClient): Promise<string> {
        let found: {fn: FCommandFunction, lib: CommandLib}|false = false;

        log.interaction(`${client.identifier} sent: ${value.toString().trim()}`);

        if (value.prefix !== "") {
            client.hostname = value.prefix;
        }

        for (const lib of this.libs) {
            const fn = lib.commands[value.command];
            if (fn !== undefined) {
                found = {fn, lib};
                break;
            }
        }

        if (!found) {
            return client.reply.errUnknownCommand(value.command).toString();
        }

        const result: IRCMessage | IRCMessage[] | undefined = await found.fn.bind(found.lib)(client, value);

        if (result instanceof IRCMessage) {
            return result.toString();
        } else if (result !== undefined) {
            return result.map(v => v.toString()).join("\r\n") + "\r\n";
        }

        return "";
    }
}
