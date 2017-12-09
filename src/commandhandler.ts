
import {IActor, IParser, ICommandHandler, ICommandFunction} from "./interfaces";
import IRCClient from "./client";
import {log} from "./utils";
export {OperatorParser, StateParser} from "./parser";

const commands : Map<string, Map<string, ICommandFunction>> = new Map();

export class CommandLib{
    get commands() : Map<string, ICommandFunction>{
        return commands.get(this.constructor.name) || new Map();
    }
}

/**
 * Decorator that registers a method as a command to be run. Will not be called with a proper this value.
 * @param {Function} target Method to be registered.
 * @param {string} propertyKey Key of the method.
 * @param {PropertyDescriptor} descriptor Descriptor
 */
export function registerCommand(target : Function, propertyKey: string, descriptor: PropertyDescriptor) {
    let lib = target.name.toLowerCase()
    if(!commands.has(lib)) commands.set(lib, new Map());
    commands.set(propertyKey.toLowerCase(), target[propertyKey]);
}

/**
 * Handles all the commands
 */
export default class CommandHandler implements ICommandHandler {
    readonly parser : IParser;
    readonly libs : CommandLib[];

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
        const {prefix, command, args} = await this.parser.parse(msg); // this.parseByCharacter(msg, true);

        for(let lib of this.libs){
            fn = lib.commands.get(command);
            if (fn !== undefined) result = await fn(client, prefix, args);
        }

        log.interaction(`${client.identifier} attempts to run ${command} ${args}.`);

        if (result !== undefined) {
            client.tell(result);
        } else if (fn === undefined) {
            client.tell(client.reply.ErrUnknownCommand(command));
        }
    }

    public async shutdown(sender : IActor) {
    }
}
