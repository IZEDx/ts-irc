import Transciever from "./transciever";
import {Socket, Server} from "net";

export default class Client<T> extends Transciever{
    public nick : string;
    private _username : string;
    private _fullname : string;
    readonly address : string;
    readonly server : T;

    get username()  { return this._username;    }
    get fullname()  { return this._fullname;    }
    get authed() : boolean{ 
        return !!(this.nick && this._username);      
    }

    constructor(socket : Socket, server : T){
        super(socket);
        this.server = server;
        this.address = socket.remoteAddress || "unknown";
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
}