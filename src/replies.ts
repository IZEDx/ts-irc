import {IIRCClient, IIRCServer} from "./interfaces";

export default class ReplyGenerator{
    constructor(public server : IIRCServer, public client : IIRCClient){}

    Welcome(){
        return `:${this.server.hostname} 001 ${this.client.nick} :Welcome to the Internet Relay Network ${this.client.identifier}`
    }

    ErrUnknownCommand(command : string){
        return `:${this.server.hostname} 421 ${command} :Unknown command`;
    }

    ErrNicknameInUse(nick : string){
        return `:${this.server.hostname} 433 * ${nick} :Nickname is already in use`;
    }
}