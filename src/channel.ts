
import {IIRCChannel, IIRCClient, IIRCServer} from "./libs/interfaces";

/**
 * IRC Channel
 */
export class IRCChannel implements IIRCChannel {
    public readonly clients: IIRCClient[] = [];
    public readonly server: IIRCServer;
    public readonly name: string;
    public topic: string;

    constructor(server: IIRCServer, name: string) {
        this.server = server;
        this.name = name;
    }

    public addClient(client: IIRCClient) {
        if (this.clients.find(c => c === client) === undefined) {
            this.clients.push(client);
        }
    }

    public async next(msg: string) {
        await this.server.broadcast(msg, this.clients);
    }
}
