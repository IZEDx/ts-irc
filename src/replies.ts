
import {IIRCClient, IIRCServer} from "./libs/interfaces";
import {IRCMessage} from "./libs/message";

/**
 * Creates IRC Reply Messages
 */
export class ReplyGenerator {
    constructor(public server: IIRCServer, public client: IIRCClient) {}

    public error = (msg: string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "ERROR",
        args: [],
        msg
    })

    public ping = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "PING",
        args: [this.server.hostname, this.client.hostname],
        msg: ""
    })

    public pong = () => new IRCMessage({
        prefix: "",
        command: "PONG",
        args: [this.server.hostname, this.client.hostname],
        msg: ""
    })

    public rplWelcome = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "001",
        args: [this.client.nick],
        msg: `Welcome to the Internet Relay Network ${this.client.identifier}`
    })

    public rplYourHost = (name: string, version: string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "002",
        args: [this.client.nick],
        msg: `Your host is ${name}, running version ${version}`
    })

    public rplCreated = (date: string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "003",
        args: [this.client.nick],
        msg: `This server was created ${date}`
    })

    public rplMyInfo = (options: {name: string, version: string, um: string, cm: string}) => new IRCMessage({
        prefix: this.server.hostname,
        command: "004",
        args: [this.client.nick],
        msg: `${options.name} ${options.version} ${options.um} ${options.cm}`
    })

    public rplLUserClient = (clientCount: number, serviceCount: number, serverCount: number) => new IRCMessage({
        prefix: this.server.hostname,
        command: "251",
        args: [this.client.nick],
        msg: `There are ${clientCount} users and ${serviceCount} services on ${serverCount} servers`
    })

    public rplLUserOp = (count: number) => new IRCMessage({
        prefix: this.server.hostname,
        command: "252",
        args: [this.client.nick, count.toString()],
        msg: "operator(s) online"
    })

    public rplLUserUnknown = (count: number) => new IRCMessage({
        prefix: this.server.hostname,
        command: "253",
        args: [this.client.nick, count.toString()],
        msg: "unknown connection(s)"
    })

    public rplLUserChannels = (count: number) => new IRCMessage({
        prefix: this.server.hostname,
        command: "254",
        args: [this.client.nick, count.toString()],
        msg: "channels formed"
    })

    public rplLUserMe = (clientCount: number, serverCount: number) => new IRCMessage({
        prefix: this.server.hostname,
        command: "255",
        args: [this.client.nick],
        msg: `I have ${clientCount} clients and ${serverCount} servers`
    })

    public rplWhoisUser = (user: IIRCClient) => new IRCMessage({
        prefix: this.server.hostname,
        command: "311",
        args: [this.client.nick, user.nick, user.username, user.hostname, "*"],
        msg: user.fullname
    })

    public rplWhoisServer = (user: IIRCClient, info: string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "312",
        args: [this.client.nick, user.nick, this.server.hostname],
        msg: info
    })

    public rplEndOfWhois = (user: IIRCClient) => new IRCMessage({
        prefix: this.server.hostname,
        command: "318",
        args: [this.client.nick, user.nick],
        msg: "End of WHOIS list"
    })

    public rplMOTDStart = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "375",
        args: [this.client.nick],
        msg: "- " + this.server.hostname + " Message of the day - "
    })

    public rplMOTD = (line: string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "376",
        args: [this.client.nick],
        msg: "- " + line
    })

    public rplEndOfMotd = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "377",
        args: [this.client.nick],
        msg: "End of MOTD command"
    })

    public errNoSuchNick = (nick: string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "401",
        args: [this.client.nick, nick],
        msg: "No such nick/channel"
    })

    public errUnknownCommand = (command: string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "421",
        args: [this.client.nick, command],
        msg: "Unknown command"
    })

    public errNoMOTD = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "422",
        args: [this.client.nick],
        msg: "MOTD File is missing"
    })

    public errNoNicknameGiven = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "431",
        args: [this.client.nick],
        msg: "No nickname given"
    })

    public errNicknameInUse = (nick: string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "433",
        args: [this.client.nick, nick],
        msg: "Nickname is already in use"
    })

    public errNeedMoreParams = (command: string) => new IRCMessage({
        prefix: this.server.hostname,
        command: "461",
        args: [this.client.nick, command],
        msg: "Not enough parameters"
    })

    public errAlreadyRegistred = () => new IRCMessage({
        prefix: this.server.hostname,
        command: "462",
        args: [this.client.nick],
        msg: "Unauthorized command (already registered)"
    })
}
