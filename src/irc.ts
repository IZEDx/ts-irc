

import {createServer, Socket, Server} from "net";
import Client from "./client";
import CommandHandler, {Command} from "./commandhandler";
import * as Reply from "./reply";
import Transciever from "./transciever";


export default class IRCServer{
    private _port : number;
    private _server : Server;
    private _commandHandler : CommandHandler;
    private _clients : Client[] = [];

    get port() { return this._port; }
    get clients() { return this._clients.filter(client => client.authed); }

    constructor(){
        this._server = createServer();
        this._server.on("connection", async socket => {
            let client = new Client(socket, this._server);
            this._clients.push(client);
            await this.onConnection(client);
            this._clients.splice(this._clients.indexOf(client), 1);
        });
        this._commandHandler = new CommandHandler();
    }

    async onConnection(client : Client){
        console.log(`New client connected from ${client.address}.`);

        await client.pipe(this._commandHandler, client);

        console.log(`${client.address} disconnected.`);
    }

    async listen(port : number){
        this._port = port;
        await this._server.listen(port);
    }
}



class BasicCommands{
    @Command
    static async NICK(client : Client, prefix : string, args : string[]){
        if(args.length < 1) return;
        client.nick = args[0];
    }

    @Command 
    static async USER(client : Client, prefix : string, args : string[]){
        if(args.length < 2) return;
        client.username = args[0];
        client.fullname = args[1];

        if(client.nick){
            console.log(`${client.nick}!${client.username}@${client.address} authed.`);
            client.tell(Reply.Welcome(client.server.address().address, client));
        }
    }
}