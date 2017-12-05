

import {createServer, Socket, Server} from "net";
import Transciever from "./transciever";
import {CommandHandler, CommandLib, Command} from "./commands";
import {Reply} from "./reply";

export class Client extends Transciever{
    private _username : string;
    private _nick : string;
    private _fullname : string;
    get username(){ return this._username; }
    get nick(){ return this._nick; }
    get fullname(){ return this._fullname; }

    constructor(socket : Socket){
        super(socket);
    }

    set nick(name : string){
        this._nick = name;
    }
    set username(name : string){
        if(this._username) return;
        this._username = name;
    }
    set fullname(name : string){
        if(this._fullname) return;
        this._fullname = name;
    }
}

export default class IRCServer{
    private _port : number;
    private _server : Server;
    private _commandHandler : CommandHandler = new CommandHandler();
    private _clients : Client[] = [];

    get port() { return this._port; }

    constructor(){
        this._server = createServer(this.onConnection.bind(this));
    }

    async onConnection(socket : Socket){
        let client = new Client(socket);
        this._clients.push(client);

        console.log(`New client connected from ${socket.remoteAddress}.`);

        await client.pipe(this._commandHandler, client);

        console.log(`${socket.remoteAddress} disconnected.`);
    }

    listen(port : number){
        this._port = port;
        this._server.listen(port);
    }
}



class BasicCommands extends CommandLib{
    @Command() 
    async nick(client : Client, args? : string[]){
        if(!args || args.length != 1) return;
        client.nick = args[0];
    }

    @Command() 
    async user(client : Client, args? : string[]){
        if(!args || args.length != 2) return;
        client.username = args[0];
        client.fullname = args[1]
        if(client.nick) client.tell(`Welcome ${client.fullname}`);
    }
}