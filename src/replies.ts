import {IIRCClient, IIRCServer} from "./interfaces";

/**
 * Creates IRC Reply Messages
 */
export default class ReplyGenerator {
    constructor(public server : IIRCServer, public client : IIRCClient) {}

    public welcome() {
        return `:${this.server.hostname} 001 ${this.client.nick} :Welcome to the Internet Relay Network ${this.client.identifier}`;
    }

    public errUnknownCommand(command : string) {
        return `:${this.server.hostname} 421 ${command} :Unknown command`;
    }

    public errNicknameInUse(nick : string) {
        return `:${this.server.hostname} 433 * ${nick} :Nickname is already in use`;
    }
}
