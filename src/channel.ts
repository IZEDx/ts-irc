import { IRCClient, IRCServer } from ".";

/**
 * IRC Channel
 */
export class IRCChannel {
    public readonly clients: IRCClient[] = [];
    public readonly server: IRCServer;
    public readonly name: string = "";
    public topic: string = "";

    constructor(server: IRCServer, name: string) {
        this.server = server;
        this.name = name;
    }

    public addClient(client: IRCClient) {
        if (this.clients.find(c => c === client) === undefined) {
            this.clients.push(client);
        }
    }

    public async next(msg: string) {
        await this.server.broadcast(msg, this.clients);
    }
}
