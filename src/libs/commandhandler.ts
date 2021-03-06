
import {IHandler, IIRCClient, IIRCServer} from "./interfaces";
import {IRCMessage} from "./message";
import {log} from "./utils";

/**
 * CommandFunction
 */
export type FCommandFunction = (sender: IIRCClient, cmd: IRCMessage) => Promise<IRCMessage | IRCMessage[] | undefined>;

/**
 * A class extending this can add commands to the CommandHandler.
 */
export class CommandLib<T extends IIRCClient = IIRCClient> {
    private _server: IIRCServer<T>;
    private _commands: {[key: string]: FCommandFunction};

    /**
     * Returns all methods with the the @registerCommand decorator.
     */
    get commands(): {[key: string]: FCommandFunction} {
        if (this._commands === undefined) {
            const names = Object.getOwnPropertyNames(this.constructor.prototype)
                .filter(name => name !== "constructor");

            this._commands = {};

            for (const name of names) {
                this._commands[name.toLowerCase()] = this.constructor.prototype[name];
            }
        }

        return this._commands;
    }

    set server(value: IIRCServer<T>) {
        if (this._server === undefined) {
            this._server = value;
        }
    }

    get server(): IIRCServer<T> {
        return this._server;
    }
}

/**
 * Handles all the commands.
 */
export class CommandHandler implements IHandler<IRCMessage, string|undefined, IIRCClient> {
    public readonly libs: CommandLib[];

    /**
     * Creates a new CommandHandler.
     * @param {CommandLib[]} libs Libraries of commands to use.
     */
    constructor(server: IIRCServer, ...libs: CommandLib[]) {
        this.libs = libs;
        for (const lib of this.libs) {
            lib.server = server;
        }
    }

    /**
     * Tell a message to be parsed and executed.
     * @param {string} msg Message containing command.
     * @param {IRCClient} client Client to respond to.
     */
    public async handle(value: IRCMessage, client: IIRCClient): Promise<string|undefined> {

        log.interaction(`${client.identifier} sent: ${value.toString().trim()}`);

        if (value.prefix !== "") {
            client.hostname = value.prefix;
        }

        const found = this.libs
            .map( (v): {lib: CommandLib, fn: FCommandFunction} => ({ lib: v, fn: v.commands[value.command] }) )
            .find( v => v.fn !== undefined );

        if (found === undefined) {
            return client.reply.errUnknownCommand(value.command).toString();
        }

        const result: IRCMessage | IRCMessage[] | undefined = await found.fn.bind(found.lib)(client, value);

        if (result instanceof IRCMessage) {
            return result.toString();
        } else if (result !== undefined) {
            return result.map(v => v.toString()).join("\r\n") + "\r\n";
        }

        return;
    }
}
