
import {createServer, Socket, Server} from "net";
import IRCClient from "./client";
import CommandHandler, {OperatorParser} from "./commandhandler";
import {log, nop} from "./utils";
import {IIRCServer} from "./interfaces";
import {BasicCommands} from "./commands";

const pjson : {version : string} = (<any>require)("../package");

/**
 * IRC Server
 */
export default class IRCServer implements IIRCServer {
    private resolve : () => void = nop;

    public readonly port : number;
    public readonly server : Server;
    public readonly commandHandler : CommandHandler;
    public readonly clients : IRCClient[] = [];
    public readonly hostname : string;
    public readonly created : Date;

    public readonly version : string = pjson.version;

    /**
     * Creates a new IRC Server instance
     * @param {number} port Port to run the server on
     * @param {string|void} hostname Hostname to run the server on
     */
    constructor(port : number, hostname : string = "localhost") {
        this.port = port;
        this.hostname = hostname;
        this.server = createServer();
        this.server.on("connection", async socket => await this.onConnection(socket));
        this.server.on("close", () => this.resolve());
        this.commandHandler = new CommandHandler(new OperatorParser(), new BasicCommands());
        this.created = new Date();
    }

    /**
     * Called on every client connection to this server.c
     * @param {Socket} socket Socket to the client
     * @returns {Promise<void>} Promise that resolves when the client is disconnected
     */
    public async onConnection(socket : Socket) {
        const client = new IRCClient(socket, this);
        this.clients.push(client);

        log.server(`New client connected from ${client.address}.`);

        await client.pipe(this.commandHandler, client);

        log.server(`${client.identifier} disconnected.`);

        this.clients.splice(this.clients.indexOf(client), 1);
    }

    /**
     * Starts the server
     * @returns {Promise<void>} Promise that resolves when it"s done
     */
    public async listen() {
        this.server.listen(this.port);
        return new Promise<void>((resolve, reject) => this.resolve = resolve);
    }

    /**
     * Gets all registered clients that match the give value
     * @param {T} where What key to match
     * @param {IRCClient[T]} equals Value to match
     * @return {Promise<IRCClient[]} Promise that resolves to the list of clients
     */
    public async getClients<T extends keyof IRCClient>(where : T, equals : IRCClient[T]) : Promise<IRCClient[]> {
        return this.clients.filter(client => client.authed).filter(client => client[where] === equals);
    }

    /**
     * Broadcasts a message to all clients that are registered or a given list of clients.
     * @param {string} msg Message to broadcast
     * @param {IRCClient[]|void} clients Optional list of clients to broadcast to
     */
    public async broadcast(msg : string, clients? : IRCClient[]) {
        if (!clients) {
            clients = this.clients.filter(client => client.authed);
        }

        const promises : Promise<void>[] = [];

        for (const client of clients) {
            promises.push(client.tell(msg));
        }

        await Promise.all(promises);
    }

    public async introduceToClient(client : IRCClient) {
        await Promise.all([
            client.tell(client.reply.welcome()),
            client.tell(client.reply.yourHost(this.hostname, this.version)),
            client.tell(client.reply.created(this.created.toLocaleDateString())),
            client.tell(client.reply.myInfo( {
                name: this.hostname,
                version: this.version,
                um: "ao",
                cm: "mtov"
            } ))
        ]);
    }
}