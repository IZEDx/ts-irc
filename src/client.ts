import Transciever from "./transciever";
import {Socket} from "net";
import {IIRCServer, IIRCClient} from "./interfaces";
import ReplyGenerator from "./replies";

/**
 * IRC Client
 */
export default class IRCClient extends Transciever<Socket> implements IIRCClient{
    public nick : string;
    private _username : string;
    private _fullname : string;
    readonly address : string;
    readonly server : IIRCServer;
    readonly reply : ReplyGenerator;

    get username()  { return this._username;    }
    get fullname()  { return this._fullname;    }
    /**
     * Returns true when the user has both, his nick and username set
     */
    get authed() : boolean{ 
        return !!(this.nick && this._username);      
    }
    /**
     * Returns an identifier for this user
     */
    get identifier() {
        if(this.authed){
            return this.nick + "!" + this._username + "@" + this.address;
        }else{
            return this.address;
        }
    }

    /**
     * 
     * @param {Socket} socket Socket of this client
     * @param {IIRCServer} server Server the client is on
     */
    constructor(socket : Socket, server : IIRCServer){
        super(socket);
        this.server = server;
        this.address = socket.remoteAddress || "unknown";
        this.reply = new ReplyGenerator(this.server, this);
    }

    /**
     * Sets the username of this client. Can be done once
     */
    set username(name : string){
        if(this._username) return;
        this._username = name;
    }

    /**
     * Sets the fullname of this client. Can be done once
     */
    set fullname(name : string){
        if(this._fullname) return;
        this._fullname = name;
    }

    /**
     * Sends a message to the socket of this client suffixed with "\r\n"
     * @param msg Message to be sent
     * @return {Promise<void>}
     */
    async tell(msg : string){
        super.tell(msg.trim() + "\r\n");
    }

    /**
     * Disconnects the client
     */
    disconnect(){
        this.socket.end();
        this.socket.destroy();
    }
}