
import {IActor, IParser, ICommandHandler, ICommandFunction} from "./interfaces";
import IRCClient from "./client";
import {log} from "./utils";
export {OperatorParser} from "./parser";

const commands : Map<string, Map<string, ICommandFunction>> = new Map();

/**
 * Decorator that registers a method as a command to be run. Will not be called with a proper this value.
 * @param {Function} target Method to be registered.
 * @param {string} propertyKey Key of the method.
 * @param {PropertyDescriptor} descriptor Descriptor
 */
export function registerCommand(target : Function, propertyKey: string, descriptor: PropertyDescriptor) {
    getOrDefault(commands, target.name.toLowerCase(), new Map()).set(propertyKey.toLowerCase(), target[propertyKey]);
}

function getOrDefault<K, V>(map : Map<K, V>, key : K, def : V) : V {
    const v = map.get(key);
    if (v === undefined) {
        map.set(key, def);
        return def;
    }
    return v;
}

export class CommandLib {
    get commands() : Map<string, ICommandFunction> {
        return getOrDefault(commands, this.constructor.name.toLowerCase(), new Map());
    }
}

/**
 * Handles all the commands
 */
export default class CommandHandler implements ICommandHandler {
    public readonly parser : IParser;
    public readonly libs : CommandLib[];

    /**
     * Creates a new CommandHandler
     * @param {IParser} parser Parser to use when parsing command.
     */
    constructor(parser : IParser, ...libs : CommandLib[]) {
        this.parser = parser;
        this.libs = libs;
    }

    /**
     * Tell a message to be parsed and executed.
     * @param {string} msg Message containing command.
     * @param {IRCClient} client Client to respond to.
     */
    public async tell(msg : string, client : IRCClient) {
        let fn : ICommandFunction | undefined;
        let result : string | undefined;
        const {prefix, command, args} = await this.parser.tell(msg); // this.parseByCharacter(msg, tsrue);

        log.interaction(`${client.identifier} attempts to run ${command} ${args}.`);

        for (const lib of this.libs) {
            fn = lib.commands.get(command);
            if (fn !== undefined) { break; }
        }

        if (fn !== undefined) {
            result = await fn(client, prefix, args);
        }

        if (result !== undefined) {
            client.tell(result);
        } else if (fn === undefined) {
            client.tell(client.reply.errUnknownCommand(command));
        }
    }

    public async shutdown(sender : IActor) {
    }
}
