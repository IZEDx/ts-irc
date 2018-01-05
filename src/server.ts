
import {CommandHandler} from "./libs/commandhandler";
import {IIRCServer, IParser} from "./libs/interfaces";
import {OperatorParser} from "./libs/parser";
import {log, nop} from "./libs/utils";

import {createServer, Server, Socket} from "net";
import {IRCChannel} from "./channel";
import {IRCClient} from "./client";
import * as Commands from "./commands";

const pjson: {version: string} = (require as Function)("../package.json");

/**
 * IRC Server
 */
export class IRCServer implements IIRCServer {
    public readonly port: number;
    public readonly server: Server;
    public readonly commandHandler: CommandHandler;
    public readonly parser: IParser;
    public readonly clients: IRCClient[] = [];
    public readonly channels: IRCChannel[] = [];
    public readonly hostname: string;
    public readonly created: Date;
    public readonly version: string = pjson.version;

    private resolve: () => void = nop;

    /**
     * Creates a new IRC Server instance
     * @param {number} port Port to run the server on
     * @param {string|void} hostname Hostname to run the server on
     */
    constructor(port: number, hostname: string = "localhost") {
        this.port = port;
        this.hostname = hostname;
        this.server = createServer();
        this.server.on("connection", this.onConnection.bind(this));
        this.server.on("close", this.resolve.bind(this));
        this.commandHandler = new CommandHandler(
            new Commands.CoreCommands(),
            new Commands.AccountCommands(),
            new Commands.InfoCommands(),
            new Commands.MessageCommands(),
            new Commands.ChannelCommands()
        );
        this.created = new Date();
        this.parser = new OperatorParser();
    }

    /**
     * Called on every client connection to this server.c
     * @param {Socket} socket Socket to the client
     * @returns {Promise<void>} Promise that resolves when the client is disconnected
     */
    public async onConnection(socket: Socket) {
        const client = new IRCClient(this, socket);
        this.clients.push(client);

        log.server(`New client connected from ${client.hostname}.`);

        await client.observe()
            .map(async msg => this.parser.parse(msg.trim()))
            .handle(this.commandHandler, client)
            .filter(async response => response.trim().length > 0)
            .pipe(client);

        log.server(`${client.identifier} disconnected.`);

        this.clients.splice(this.clients.indexOf(client), 1);
    }

    /**
     * Starts the server
     * @returns {Promise<void>} Promise that resolves when it"s done
     */
    public async start() {
        this.server.listen(this.port);

        return new Promise<void>((resolve, reject) => this.resolve = resolve);
    }

    /**
     * Gets all registered clients that match the give value
     * @param {T} where What key to match
     * @param {IRCClient[T]} equals Value to match
     * @return {Promise<IRCClient[]} Promise that resolves to the list of clients
     */
    public async getClients<T extends keyof IRCClient>(where: T, equals: IRCClient[T]): Promise<IRCClient[]> {
        return this.clients.filter(client => client.authed).filter(client => client[where] === equals);
    }

    /**
     * Broadcasts a message to all clients that are registered or a given list of clients.
     * @param {string} msg Message to broadcast
     * @param {IRCClient[]|void} clients Optional list of clients to broadcast to
     */
    public async broadcast(msg: string, clients?: IRCClient[]) {
        if (clients === undefined) {
            clients = this.clients.filter(client => client.authed);
        }

        const promises: Promise<void>[] = [];

        for (const client of clients) {
            promises.push(client.next(msg));
        }

        await Promise.all(promises);
    }

    public async introduceToClient(client: IRCClient) {
        await Promise.all([
            client.next(client.reply.rplWelcome().toString()),
            client.next(client.reply.rplYourHost(this.hostname, this.version).toString()),
            client.next(client.reply.rplCreated(this.created.toLocaleDateString()).toString()),
            client.next(client.reply.rplMyInfo({
                name: this.hostname,
                version: this.version,
                um: "ao",
                cm: "mtov"
            }).toString())
        ]);
    }
}
