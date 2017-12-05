

import {createServer, Socket, Server} from "net";
import Client from "./client";
import CommandHandler, {CommandLib, Command} from "./commandhandler";
import {Reply} from "./reply";


export default class IRCServer{
    private _port : number;
    private _server : Server;
    private _commandHandler : CommandHandler;
    private _clients : Client[] = [];

    get port() { return this._port; }

    constructor(){
        this._server = createServer(this.onConnection.bind(this));
        this._commandHandler = new CommandHandler(new BasicCommands());
    }

    async onConnection(socket : Socket){
        let client = new Client(socket);
        this._clients.push(client);

        console.log(`New client connected from ${socket.remoteAddress}.`);

        await client.pipe(this._commandHandler, client);

        console.log(`${socket.remoteAddress} disconnected.`);
    }

    async listen(port : number){
        this._port = port;
        await this._server.listen(port);
    }
}



class BasicCommands extends CommandLib{
    @Command() 
    async NICK(client : Client, args? : string[]){
        if(!args || args.length != 1) return;
        client.nick = args[0];
    }

    @Command() 
    async USER(client : Client, args? : string[]){
        if(!args || args.length != 2) return;
        client.username = args[0];
        client.fullname = args[1]
        if(client.nick){
            console.log(`${client.username} authed.`);
            client.tell(`Welcome ${client.fullname}`);
        }
    }
}