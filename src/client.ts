import Transciever from "./transciever";
import {Socket} from "net";
import {IIRCServer, IIRCClient} from "./interfaces";
import ReplyGenerator from "./replies";

export default class IRCClient extends Transciever<Socket> implements IIRCClient{
    public nick : string;
    private _username : string;
    private _fullname : string;
    readonly address : string;
    readonly server : IIRCServer;
    readonly reply : ReplyGenerator;

    get username()  { return this._username;    }
    get fullname()  { return this._fullname;    }
    get authed() : boolean{ 
        return !!(this.nick && this._username);      
    }
    get identifier() {
        if(this.authed){
            return this.nick + "!" + this._username + "@" + this.address;
        }else{
            return this.address;
        }
    }

    constructor(socket : Socket, server : IIRCServer){
        super(socket);
        this.server = server;
        this.address = socket.remoteAddress || "unknown";
        this.reply = new ReplyGenerator(this.server, this);
    }

    set username(name : string){
        if(this._username) return;
        this._username = name;
    }
    set fullname(name : string){
        if(this._fullname) return;
        this._fullname = name;
    }

    async tell(msg : string){
        super.tell(msg.trim() + "\r\n");
    }

    disconnect(){
        this.socket.end();
        this.socket.destroy();
    }
}