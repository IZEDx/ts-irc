import Transciever from "./transciever";
import {Socket} from "net";
import {IIRCServer , IIRCClient} from "./interfaces";
import ReplyGenerator from "./replies";

type IRCServer = IIRCServer<IRCClient>;

/**
 * IRC Client
 */
export default class IRCClient extends Transciever implements IIRCClient {
    public nick: string = "*";
    private _username: string;
    private _fullname: string;
    public hostname: string;
    public readonly server: IRCServer;
    public readonly reply: ReplyGenerator;

    /**
     * Returns an identifier for this user
     */
    get identifier() {
        if (this.authed) {
            return this.nick + "!" + this._username + "@" + this.hostname;
        } else {
            return this.hostname;
        }
    }

    /**
     * Returns true when the user has both, his nick and username set
     */
    get authed(): boolean {
        return this._username !== undefined;
    }

    get username()  { return this._username;    }
    get fullname()  { return this._fullname;    }

    /**
     *
     * @param {Socket} socket Socket of this client
     * @param {IIRCServer<IRCClient>} server Server the client is on
     */
    constructor(server: IRCServer, socket: Socket) {
        super(socket);
        this.server = server;
        this.hostname = socket.remoteAddress || "unknown";
        this.reply = new ReplyGenerator(this.server, this);

        if (/^:(ffff)?:(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/.test(this.hostname)) {
            this.hostname.replace(/^.*:/, "");
        }
    }

    /**
     * Sets the username of this client. Can be done once
     */
    set username(name: string) {
        if (this._username) { return; }
        this._username = name;
    }

    /**
     * Sets the fullname of this client. Can be done once
     */
    set fullname(name: string) {
        if (this._fullname) { return; }
        this._fullname = name;
    }

    /**
     * Sends a message to the socket of this client suffixed with "\r\n"
     * @param msg Message to be sent
     * @return {Promise<void>}
     */
    public async tell(msg: string) {
        super.tell(msg.trim() + "\r\n");
    }
}
