import Transciever from "./transciever";
import {Socket} from "net";

export default class Client extends Transciever{
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

    async tell(msg : string){
        super.tell(msg.trim() + "\r\n");
    }
}