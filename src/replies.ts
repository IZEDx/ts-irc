import {IIRCClient, IIRCServer} from "./interfaces";

/**
 * Creates IRC Reply Messages
 */
export default class ReplyGenerator {
    constructor(public server : IIRCServer, public client : IIRCClient) {}

    public welcome = () =>
        `:${this.server.hostname} 001 ${this.client.nick} :Welcome to the Internet Relay Network ${this.client.identifier}`;

    public yourHost = (name : string, version : string) =>
        `:${this.server.hostname} 002 ${this.client.nick} :Your host is ${name}, running version ${version}`;

    public created = (date : string) =>
        `:${this.server.hostname} 003 ${this.client.nick} :This server was created ${date}`;

    public myInfo = (options : {name : string, version : string, um : string, cm : string}) =>
        `:${this.server.hostname} 004 ${this.client.nick} :${options.name} ${options.version} ${options.um} ${options.cm}`;

    public errNoSuchNick = (nick : string) =>
        `:${this.server.hostname} 401 ${nick} :No such nick/channel`;

    public errUnknownCommand = (command : string) =>
        `:${this.server.hostname} 421 ${command} :Unknown command`;

    public errNoNicknameGiven = () =>
        `:${this.server.hostname} 431 * :No nickname given`;

    public errNicknameInUse = (nick : string) =>
        `:${this.server.hostname} 433 * ${nick} :Nickname is already in use`;

    public errNeedMoreParams = (command : string) =>
        `:${this.server.hostname} 461 ${this.client.nick} ${command} :Not enough parameters`;

    public errAlreadyRegistred = () =>
        `:${this.server.hostname} 462 ${this.client.nick} :Unauthorized command (already registered)`;
}
