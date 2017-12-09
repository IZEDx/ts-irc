

import {createServer, Socket, Server} from "net";
import IRCClient from "./client";
import CommandHandler, {Command, OperatorParser} from "./commandhandler";
import {log} from "./utils";
import {IIRCServer} from "./interfaces";
import "commands.ts";

export default class IRCServer implements IIRCServer{
    readonly port : number;
    readonly server : Server;
    readonly commandHandler : CommandHandler;
    readonly clients : IRCClient[] = [];
    readonly hostname : string;

    constructor(port : number, hostname = "localhost"){
        this.port = port;
        this.hostname = hostname;
        this.server = createServer();
        this.server.on("connection", async socket => await this.onConnection(socket));
        this.commandHandler = new CommandHandler(new OperatorParser());
    }

    async onConnection(socket : Socket){
        let client = new IRCClient(socket, this);

        this.clients.push(client);
        log(`New client connected from ${client.address}.`);

        await client.pipe(this.commandHandler, client);

        log(`${client.identifier} disconnected.`);
        this.clients.splice(this.clients.indexOf(client), 1);
    }

    async listen(){
        await this.server.listen(this.port);
    }

    async getClients<T extends keyof IRCClient>(where : T, equals : IRCClient[T]) : Promise<IRCClient[]>{
        return this.clients.filter(c => c.authed).filter(c => c[where] == equals);
    }

    async broadcast(msg : string, clients? : IRCClient[]){
        if(!clients) clients = this.clients.filter(c => c.authed);
        let promises : Promise<void>[] = [];
        
        for(let c of clients){
            promises.push(c.tell(msg));
        }

        await Promise.all(promises);
    }
}

