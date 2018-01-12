
import {CommandLib} from "./libs/commandhandler";
import {IRCMessage} from "./libs/message";
import {log, readFile} from "./libs/utils";

import {IRCClient} from "./client";

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
        }
    }

    public async user(client: IRCClient, cmd: IRCMessage) {
        if (cmd.args.length < 1) {
            return client.reply.errNeedMoreParams("user");
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

        const targets: IRCClient[] = await this.server.getClients("nick", cmd.args[0]);
        const target: IRCClient = targets[0];

        if (targets.length === 0) {
            return client.reply.errNoSuchNick(cmd.args[0]);
        }

        log.interaction(`${client.nick} > ${target.nick}\t${cmd.msg}`);
        target.next(`:${client.identifier} PRIVMSG ${target.nick} :${cmd.msg}`);
    }

    public async notice(client: IRCClient, cmd: IRCMessage) {
        if (cmd.args.length < 2 || !client.authed) {
            return;
        }

        const targets: IRCClient[] = await this.server.getClients("nick", cmd.args[0]);
        const target: IRCClient = targets[0];

        if (targets.length > 0) {
            log.interaction(`${client.nick} > ${target.nick}\t${cmd.msg}`);
            target.next(`:${client.identifier} NOTICE ${target.nick} :${cmd.msg}`);
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
    }

}
