
import { IRCMessage, Transciever } from "./libs";
import { Socket } from "net";
import { ReplyGenerator, IRCServer } from ".";


/**
 * IRC Client
 */
export class IRCClient extends Transciever {

    public fullname: string = "*";
    public hostname: string;

    public readonly server: IRCServer;
    public readonly reply: ReplyGenerator;

    private _nick: string = "*";
    private _username: string = "*";
    private _authed: boolean = false;

    /**
     *
     * @param {Socket} socket Socket of this client
     * @param {IIRCServer<IRCClient>} server Server the client is on
     */
    constructor(server: IRCServer, socket: Socket) {
        super(socket);
        this.server = server;
        this.hostname = socket.remoteAddress !== undefined ? socket.remoteAddress : "unknown";
        this.reply = new ReplyGenerator(this.server, this);

        while (this.hostname.includes(":")) {
            this.hostname = this.hostname.replace(/^.*:/, "");
        }
    }

    /**
     * Sends an IRCMessage to this user
     */
    public send(msg: IRCMessage) {
        this.next(msg.toString());
    }

    /**
     * Returns an identifier for this user
     */
    get identifier(): string {
        if (this.authed) {
            return `${this._nick}!${this._username}@${this.hostname}`;
        } else {
            return this.hostname;
        }
    }

    /**
     * Returns true if this user has been authenticated
     */
    get authed(): boolean {
        return this._authed;
    }

    /**
     * Sends a message to the socket of this client suffixed with "\r\n"
     * @param msg Message to be sent
     * @return {Promise<void>}
     */
    public async next(msg: string) {
        super.next(msg.trim() + "\r\n");
    }

    /**
     * Sets the username of this client. Can be done once
     */
    set username(name: string) {
        if (this._authed) {
            return;
        }

        this._username = name;

        if (this._nick !== "*") {
            this._authed = true;
        }
    }

    /**
     * Gets the username of this user
     */
    get username(): string {
        return this._username;
    }

    /**
     * Sets the nickname of this user
     */
    set nick(nick: string) {
        this._nick = nick;

        if (this._username !== "*") {
            this._authed = true;
        }
    }

    /**
     * Gets the nickname of this user
     */
    get nick(): string {
        return this._nick;
    }

    public observe(): Observable<string> {
        return new Observable(aops.buffer(super.observe(), "\r\n")).filter(async msg => msg.trim().length > 0);
    }
}
