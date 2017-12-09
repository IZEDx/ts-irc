

import {createServer, Socket, Server} from "net";
import IRCClient from "./client";
import CommandHandler, {Command, OperatorParser} from "./commandhandler";
import {log as _log, nop} from "./utils";
import {IIRCServer} from "./interfaces";
import "./commands";
import chalk from "chalk";

const log = (...msg : string[]) => _log(chalk.blue.bold("[Server]\t") + chalk.gray(...msg));

/**
 * IRC Server
 */
export default class IRCServer implements IIRCServer{
    private resolve : () => void = nop;

    readonly port : number;
    readonly server : Server;
    readonly commandHandler : CommandHandler;
    readonly clients : IRCClient[] = [];
    readonly hostname : string;

    /**
     * Creates a new IRC Server instance
     * @param {number} port Port to run the server on
     * @param {string|void} hostname Hostname to run the server on
     */
    constructor(port : number, hostname = "localhost"){
        this.port = port;
        this.hostname = hostname;
        this.server = createServer();
        this.server.on("connection", async socket => await this.onConnection(socket));
        this.server.on("close", () => this.resolve());
        this.commandHandler = new CommandHandler(new OperatorParser());
    }

    /**
     * Called on every client connection to this server.
     * @param {Socket} socket Socket to the client
     * @returns {Promise<void>} Promise that resolves when the client is disconnected
     */
    async onConnection(socket : Socket){
        let client = new IRCClient(socket, this);

        this.clients.push(client);
        log(`New client connected from ${client.address}.`);

        await client.pipe(this.commandHandler, client);

        log(`${client.identifier} disconnected.`);
        this.clients.splice(this.clients.indexOf(client), 1);
    }

    /**
     * Starts the server
     * @returns {Promise<void>} Promise that resolves when it's done
     */
    async listen(){
        this.server.listen(this.port);
        return new Promise<void>((resolve, reject) => this.resolve = resolve);
    }

    /**
     * Gets all registered clients that match the give value
     * @param {T} where What key to match
     * @param {IRCClient[T]} equals Value to match
     * @return {Promise<IRCClient[]} Promise that resolves to the list of clients
     */
    async getClients<T extends keyof IRCClient>(where : T, equals : IRCClient[T]) : Promise<IRCClient[]>{
        return this.clients.filter(c => c.authed).filter(c => c[where] == equals);
    }

    /**
     * Broadcasts a message to all clients that are registered or a given list of clients.
     * @param {string} msg Message to broadcast
     * @param {IRCClient[]|void} clients Optional list of clients to broadcast to
     */
    async broadcast(msg : string, clients? : IRCClient[]){
        if(!clients) clients = this.clients.filter(c => c.authed);
        let promises : Promise<void>[] = [];
        
        for(let c of clients){
            promises.push(c.tell(msg));
        }

        await Promise.all(promises);
    }
}

