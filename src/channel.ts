
import {IIRCServer, IIRCChannel} from "./interfaces";
import IRCClient from "./client";

type IRCServer = IIRCServer<IRCClient, IRCChannel>;

/**
 * IRC Channel
 */
export default class IRCChannel implements IIRCChannel {
    public readonly clients: IRCClient[] = [];
    public readonly server: IRCServer;
    public readonly name: string;
    private _topic: string;

    get topic() {
        return this._topic;
    }

    set topic(newtopic: string) {
        this._topic = newtopic;
    }

    constructor(server: IRCServer, name: string) {
        this.server = server;
        this.name = name;
    }

    public addClient(client: IRCClient) {
        if (this.clients.find(c => c === client) === undefined) {
            this.clients.push(client);
        } 
    }

    public async tell(msg: string) {
        await this.server.broadcast(msg, this.clients);
    }
}
