

import {createServer, Socket, Server} from "net";
import Client from "./client";
import CommandHandler, {Command} from "./commandhandler";
import * as Reply from "./reply";
import Transciever from "./transciever";

export type IRCClient = Client<IRCServer>;

export default class IRCServer{
    readonly port : number;
    readonly server : Server;
    readonly commandHandler : CommandHandler;
    readonly clients : IRCClient[] = [];
    private _hostname = "localhost";

    get hostname() : string{
        return this._hostname;
    }

    constructor(port : number){
        this.port = port;
        this.server = createServer();
        this.server.on("connection", async socket => await this.onConnection(socket));
        this.commandHandler = new CommandHandler();
    }

    async onConnection(socket : Socket){
        let client = new Client(socket, this);

        this.clients.push(client);
        console.log(`New client connected from ${client.address}.`);

        await client.pipe(this.commandHandler, client);

        console.log(`${client.address} disconnected.`);
        this.clients.splice(this.clients.indexOf(client), 1);
    }

    async listen(){
        await this.server.listen(this.port);
    }
}



class BasicCommands{
    @Command
    static async NICK(client : IRCClient, prefix : string, args : string[]){
        if(args.length < 1) return;
        client.nick = args[0];
    }

    @Command 
    static async USER(client : IRCClient, prefix : string, args : string[]){
        if(args.length < 2) return;
        client.username = args[0];
        client.fullname = args[1];

        if(client.nick){
            console.log(`${client.nick}!${client.username}@${client.address} authed.`);
            client.tell(Reply.Welcome(client.server.hostname, client));
        }
    }
}