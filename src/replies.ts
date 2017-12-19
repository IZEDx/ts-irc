import {IIRCClient, IIRCServer} from "./interfaces";
import IRCMessage from "./message";

/**
 * Creates IRC Reply Messages
 */
export default class ReplyGenerator {
    constructor(public server : IIRCServer, public client : IIRCClient) {}

    public welcome = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "001",
        args: [this.client.nick],
        msg: `Welcome to the Internet Relay Network ${this.client.identifier}`
    });

    public yourHost = (name : string, version : string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "002",
        args: [this.client.nick],
        msg: `Your host is ${name}, running version ${version}`
    });

    public created = (date : string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "003",
        args: [this.client.nick],
        msg: `This server was created ${date}`
    });

    public myInfo = (options : {name : string, version : string, um : string, cm : string}) => new IRCMessage({
        prefix: this.server.hostname,
        command: "004",
        args: [this.client.nick],
        msg: `${options.name} ${options.version} ${options.um} ${options.cm}`
    });

    public motdStart = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "375",
        args: [this.client.nick],
        msg: "- " + this.server.hostname + " Message of the day - "
    });

    public motd = (line : string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "376",
        args: [this.client.nick],
        msg: "- " + line
    });

    public endOfMotd = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "377",
        args: [this.client.nick],
        msg: "End of MOTD command"
    });

    public errNoSuchNick = (nick : string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "401",
        args: [this.client.nick, nick],
        msg: "No such nick/channel"
    });

    public errUnknownCommand = (command : string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "421",
        args: [this.client.nick, command],
        msg: "Unknown command"
    });

    public errNoMOTD = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "422",
        args: [this.client.nick],
        msg: "MOTD File is missing"
    });

    public errNoNicknameGiven = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "431",
        args: [this.client.nick],
        msg: "No nickname given"
    });

    public errNicknameInUse = (nick : string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "433",
        args: [this.client.nick, nick],
        msg: "Nickname is already in use"
    });

    public errNeedMoreParams = (command : string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "461",
        args: [this.client.nick, command],
        msg: "Not enough parameters"
    });

    public errAlreadyRegistred = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "462",
        args: [this.client.nick],
        msg: "Unauthorized command (already registered)"
    });

    public ping = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "PING",
        args: [this.server.hostname, this.client.host],
        msg: ""
    });

    public pong = () => new IRCMessage({
        prefix: "",
        command: "PONG",
        args: [this.server.hostname, this.client.host],
        msg: ""
    });
}
