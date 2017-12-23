
import {IActor, IParser, ICommandHandler, ICommandFunction} from "./interfaces";
import IRCClient from "./client";
import IRCMessage from "./message";
import {log, getOrDefault} from "./utils";
import {OperatorParser} from "./parser";

/**
 * Global map of functions that can be imported in a CommandHandler
 */
const commands: {[key: string]: {[key: string]: ICommandFunction}} = {};

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
    get commands(): {[key: string]: ICommandFunction} {
        return getOrDefault(commands, this.constructor.name.toLowerCase(), {});
    }
}

/**
 * Handles all the commands.
 */
export default class CommandHandler implements ICommandHandler {
    public readonly parser: IParser;
    public readonly libs: CommandLib[];

    /**
     * Creates a new CommandHandler.
     * @param {CommandLib[]} libs Libraries of commands to use.
     */
    constructor(...libs: CommandLib[]) {
        this.parser = new OperatorParser();
        this.libs = libs;
    }

    /**
     * Tell a message to be parsed and executed.
     * @param {string} msg Message containing command.
     * @param {IRCClient} client Client to respond to.
     */
    public async tell(msg: string, client: IRCClient) {
        let found: {fn: ICommandFunction, lib: CommandLib}|false = false;
        const cmd: IRCMessage = new IRCMessage(this.parser.parse(msg));

        log.interaction(`${client.identifier} attempts to run ${cmd.command}.`);

        if (cmd.prefix !== "") {
            client.hostname = cmd.prefix;
        }

        for (const lib of this.libs) {
            const fn = lib.commands[cmd.command];
            if (fn !== undefined) {
                found = {fn : fn, lib : lib};
                break;
            }
        }

        if (!found) {
            client.tell(client.reply.errUnknownCommand(cmd.command).toString());
            return;
        }

        const result: IRCMessage | IRCMessage[] | undefined = await found.fn.bind(found.lib)(client, cmd);

        if (result !== undefined) {
            if (result instanceof IRCMessage) {
                client.tell(result.toString());
            } else {
                for (const replies of result) {
                    client.tell(replies.toString());
                }
            }
        }
    }

    /**
     * Shuts down this CommandHandler
     * @param sender
     */
    public async shutdown(sender: IActor) {
    }
}
