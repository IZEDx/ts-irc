
import {CommandLib} from "./libs/commandhandler";
import {IRCMessage} from "./libs/message";
import {log, readFile} from "./libs/utils";

import {IRCChannel} from "./channel";
import {IRCClient} from "./client";
import { IObserver } from "./libs/async";

let motdLines: string[];

/**
 * Core functionality.
 */
export class CoreCommands extends CommandLib<IRCClient> {

    public async ping(client: IRCClient, cmd: IRCMessage) {
        return client.reply.pong();
    }

    public async pong(client: IRCClient, cmd: IRCMessage) { }

}

/**
 * Essential commands for login, logout, etc.
 */
export class AccountCommands extends CommandLib<IRCClient> {

    public async nick(client: IRCClient, cmd: IRCMessage) {
        if (cmd.args.length < 1) {
            return client.reply.errNoNicknameGiven();
        }

        const oldnick = client.nick;
        const newnick = cmd.args[0];

        if ((await this.server.getClients("nick", newnick)).length > 0) {
            return client.reply.errNicknameInUse(newnick);
        }

        if (client.authed) {
            log.interaction(`${client.identifier} changed nick from "${oldnick}" to "${newnick}".`);
        } else {
            log.interaction(`${client.hostname} set their nick to ${newnick}.`);
        }

        client.nick = newnick;

        if (client.authed && oldnick === "*") {
            log.interaction(`${client.identifier} identified themself.`);
            this.server.introduceToClient(client);
        } else {
            for (const channel of this.server.channels) {
                if (channel.clients.find(c => c === client) !== undefined) {
                    channel.next(`:${client.identifier} NICK newnick`);
                }
            }
        }
    }

    public async user(client: IRCClient, cmd: IRCMessage) {
        if (cmd.args.length < 1) {
            return client.reply.errNeedMoreParams("USER");
        }

        if (client.authed) {
            return client.reply.errAlreadyRegistred();
        }

        if ((await this.server.getClients("username", cmd.args[0])).length > 0) {
            return;
        }

        client.username = cmd.args[0];
        client.fullname = cmd.msg;

        if (client.authed) {
            log.interaction(`${client.identifier} identified themself.`);
            this.server.introduceToClient(client);
        }
    }

    public async quit(client: IRCClient, cmd: IRCMessage) {
        if (cmd.msg === "") {
            cmd.msg = "Client Quit";
        }
        log.interaction(`${client.identifier} quit with reason: ${cmd.msg}.`);
        client.next(client.reply.error(`Closing Link: ${client.hostname} (${cmd.msg})`).toString());
        client.complete();

        for (const channel of this.server.channels) {
            const idx = channel.clients.indexOf(client);
            if (idx >= 0) {
                channel.next(`:${client.identifier} QUIT :${cmd.msg}`);
                channel.clients.splice(idx);
            }
        }
    }

}

/**
 * Actual messaging.
 */
export class MessageCommands extends CommandLib<IRCClient> {

    public async privmsg(client: IRCClient, cmd: IRCMessage) {
        if (cmd.args.length < 1 || cmd.msg.trim().length === 0 || !client.authed) {
            return;
        }

        const name = cmd.args[0].toLowerCase();
        let target: IObserver<string>|undefined = this.server.clients.find(c => c.nick.toLowerCase() === name);

        if (target === undefined) {
            const channel = this.server.channels.find(c => c.name === name.substr(1));

            if (channel === undefined) {
                return client.reply.errNoSuchNick(name);
            }

            if ( channel.clients.find(c => c === client) === undefined ) {
                return client.reply.errCannotSendToChan(channel);
            }

            target = channel;
        }

        log.interaction(`${client.nick} > ${name}\t${cmd.msg}`);
        target.next(`:${client.identifier} PRIVMSG ${name} :${cmd.msg}`);
    }

    public async notice(client: IRCClient, cmd: IRCMessage) {
        if (cmd.args.length < 2 || !client.authed) {
            return;
        }

        const name = cmd.args[0].toLowerCase();
        let target: IObserver<string>|undefined = this.server.clients.find(c => c.nick.toLowerCase() === name);

        if (target === undefined) {
            const channel = this.server.channels.find(c => c.name === name.substr(1));

            if (channel !== undefined && channel.clients.find(c => c === client) === undefined) {
                target = channel;
            }

        }

        if (target !== undefined) {
            log.interaction(`${client.nick} > ${name}\t${cmd.msg}`);
            target.next(`:${client.identifier} NOTICE ${name} :${cmd.msg}`);
        }

    }

}

/**
 * Information commands.
 */
export class InfoCommands extends CommandLib<IRCClient> {

    public async lusers(client: IRCClient, cmd: IRCMessage) {
        if (!client.authed) {
            return;
        }

        const total = this.server.clients.length;
        const authed = this.server.clients.filter(x => x.authed).length;

        return [
            client.reply.rplLUserClient(authed, 0, 0),
            client.reply.rplLUserOp(0),
            client.reply.rplLUserUnknown(total - authed),
            client.reply.rplLUserChannels(0),
            client.reply.rplLUserMe(total, 0)
        ];
    }

    public async motd(client: IRCClient, cmd: IRCMessage) {
        try {
            if (!client.authed) {
                return;
            }

            motdLines = motdLines !== undefined ? motdLines : (await readFile("./motd.txt"))
                .toString()
                .split("\n")
                .map(line => line.trim());
            const replies = [client.reply.rplMOTDStart()];

            for (const line of motdLines) {
                replies.push(client.reply.rplMOTD(line));
            }

            replies.push(client.reply.rplEndOfMotd());

            return replies;
        } catch (err) {
            return client.reply.errNoMOTD();
        }
    }

    public async whois(client: IRCClient, cmd: IRCMessage) {
        if (cmd.args.length < 1 || !client.authed) {
            return;
        }

        const targets: IRCClient[] = await client.server.getClients("nick", cmd.args[0]);
        const target: IRCClient = targets[0];

        if (target === undefined) {
            return client.reply.errNoSuchNick(cmd.args[0]);
        }

        return [
            client.reply.rplWhoisUser(target),
            client.reply.rplWhoisServer(target, "Server info."),
            client.reply.rplEndOfWhois(target)
        ];
    }

}

/**
 * Channel functionality.
 */
export class ChannelCommands extends CommandLib<IRCClient> {

    public async join(client: IRCClient, cmd: IRCMessage) {
        if (!client.authed) {
            return;
        }
        if (cmd.args.length < 1) {
            return client.reply.errNeedMoreParams("JOIN");
        }

        const channelname = cmd.args[0].toLowerCase().substr(1);
        let channel = this.server.channels.find(v => v.name === channelname);
        if (channel === undefined) {
            channel = new IRCChannel(this.server, channelname);
            this.server.channels.push(channel);
        }

        channel.addClient(client);

        const replies: IRCMessage[] = [
            client.reply.join("#" + channelname)
        ];

        if (channel.topic !== undefined && channel.topic !== "") {
            replies.push(client.reply.rplTopic(channel));
        }

        if (channel.clients.length > 0) {
            replies.push(client.reply.rplNameReply(channel));
        }

        replies.push(client.reply.rplEndOfNames(channel));

        return replies;
    }

    public async part(client: IRCClient, cmd: IRCMessage) {
        if (!client.authed) {
            return;
        }
        if (cmd.args.length < 1) {
            return client.reply.errNeedMoreParams("PART");
        }

        const channel = this.server.channels.find(v => v.name === cmd.args[0].toLowerCase().substr(1));
        if (channel === undefined) {
            return client.reply.errNoSuchChannel(cmd.args[0]);
        }

        const idx = channel.clients.indexOf(client);
        if (idx < 0) {
            return client.reply.errNotOnChannel(channel);
        }

        channel.clients.splice(idx);

        if (channel.clients.length === 0) {
            this.server.channels.splice(this.server.channels.indexOf(channel));
        }
    }

    public async topic(client: IRCClient, cmd: IRCMessage) {
        if (!client.authed) {
            return;
        }
        if (cmd.args.length < 1) {
            return client.reply.errNeedMoreParams("TOPIC");
        }

        const channel = this.server.channels.find(v => v.name === cmd.args[0].toLowerCase().substr(1));
        if (channel === undefined) {
            return;
        }

        if (channel.clients.find(c => c === client) === undefined) {
            return client.reply.errNotOnChannel(channel);
        }

        if (cmd.msg === undefined || cmd.msg === "") {
            return client.reply.rplNoTopic(channel);
        } else {
            channel.topic = cmd.msg;

            return client.reply.rplTopic(channel);
        }
    }
}
