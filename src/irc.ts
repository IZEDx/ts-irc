

import {createServer, Socket, Server} from "net";
import Client from "./client";
import CommandHandler, {Command, OperatorParser} from "./commandhandler";
import * as Reply from "./reply";
import {log} from "./utils";

export type IRCClient = Client<IRCServer>;

export default class IRCServer{
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
        let client = new Client(socket, this);

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



class BasicCommands{
    @Command
    static async NICK(client : IRCClient, prefix : string, args : string[]){
        if(args.length < 1) return;

        if((await client.server.getClients("nick", args[0])).length > 0){
            client.tell(Reply.ErrNicknameInUse(client.server.hostname, args[0]));
            return;
        }

        let oldnick = client.nick;
        client.nick = args[0];
        if(client.authed && oldnick){
            log(`${client.identifier} changed nick from "${oldnick}" to "${client.nick}".`);
        }else{
            log(`${client.address} set their nick to ${client.nick}`);
        }

        if(client.username && client.fullname){
            log(`${client.nick}!${client.username}@${client.address} authed.`);
            client.tell(Reply.Welcome(client.server.hostname, client));
        }
    }

    @Command 
    static async USER(client : IRCClient, prefix : string, args : string[]){
        if(args.length < 2) return;

        if((await client.server.getClients("username", args[0])).length > 0) return;

        client.username = args[0];
        client.fullname = args[1];

        if(client.nick){
            log(`${client.nick}!${client.username}@${client.address} authed.`);
            client.tell(Reply.Welcome(client.server.hostname, client));
        }
    }

    @Command
    static async QUIT(client : IRCClient, prefix : string, args : string[]){
            log(`${client.identifier} attempts to disconnect with reason: ${args[0] || "Not given."}`);
            client.disconnect();
    }
}