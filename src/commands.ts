
import {CommandLib, registerCommand as Command} from "./libs/commandhandler";
import {IRCMessage} from "./libs/message";
import {log, readFile} from "./libs/utils";

import {IRCClient} from "./client";

let motdLines: string[];

/**
 * Core functionality.
 */
export class CoreCommands extends CommandLib {

    @Command
    public static async PING(client: IRCClient, cmd: IRCMessage) {
        return client.reply.pong();
    }

    @Command
    public static async PONG(client: IRCClient, cmd: IRCMessage) { }

}

/**
 * Essential commands for login, logout, etc.
 */
export class AccountCommands extends CommandLib {

    @Command
    public static async NICK(client: IRCClient, cmd: IRCMessage) {
        if (cmd.args.length < 1) {
            return client.reply.errNoNicknameGiven();
        }

        const oldnick = client.nick;
        const newnick = cmd.args[0];

        if ((await client.server.getClients("nick", newnick)).length > 0) {
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
            client.server.introduceToClient(client);
        }
    }

    @Command
    public static async USER(client: IRCClient, cmd: IRCMessage) {
        if (cmd.args.length < 1) {
            return client.reply.errNeedMoreParams("user");
        }

        if (client.authed) {
            return client.reply.errAlreadyRegistred();
        }

        if ((await client.server.getClients("username", cmd.args[0])).length > 0) {
            return;
        }

        client.username = cmd.args[0];
        client.fullname = cmd.msg;

        if (client.authed) {
            log.interaction(`${client.identifier} identified themself.`);
            client.server.introduceToClient(client);
        }
    }

    @Command
    public static async QUIT(client: IRCClient, cmd: IRCMessage) {
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
export class MessageCommands extends CommandLib {

    @Command
    public static async PRIVMSG(client: IRCClient, cmd: IRCMessage) {
        if (cmd.args.length < 2 || !client.authed) {
            return;
        }

        const targets: IRCClient[] = await client.server.getClients("nick", cmd.args[0]);
        const target: IRCClient = targets[0];

        if (targets.length === 0) {
            return client.reply.errNoSuchNick(cmd.args[0]);
        }

        log.interaction(`${client.nick} > ${target.nick}\t${cmd.msg}`);
        client.next(`:${client.identifier} PRIVMSG ${target.nick} :${cmd.msg}`);
    }

    @Command
    public static async NOTICE(client: IRCClient, cmd: IRCMessage) {
        if (cmd.args.length < 2 || !client.authed) {
            return;
        }

        const targets: IRCClient[] = await client.server.getClients("nick", cmd.args[0]);
        const target: IRCClient = targets[0];

        if (targets.length > 0) {
            log.interaction(`${client.nick} > ${target.nick}\t${cmd.msg}`);
            client.next(`:${client.identifier} NOTICE ${target.nick} :${cmd.msg}`);
        }

    }

}

/**
 * Information commands.
 */
export class InfoCommands extends CommandLib {

    @Command
    public static async LUSERS(client: IRCClient, cmd: IRCMessage) {
        if (!client.authed) {
            return;
        }

        const total = client.server.clients.length;
        const authed = client.server.clients.filter(x => x.authed).length;

        return [
            client.reply.rplLUserClient(authed, 0, 0),
            client.reply.rplLUserOp(0),
            client.reply.rplLUserUnknown(total - authed),
            client.reply.rplLUserChannels(0),
            client.reply.rplLUserMe(total, 0)
        ];
    }

    @Command
    public static async MOTD(client: IRCClient, cmd: IRCMessage) {
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

    @Command
    public static async WHOIS(client: IRCClient, cmd: IRCMessage) {
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
export class ChannelCommands extends CommandLib {

    @Command
    public static async JOIN(client: IRCClient, cmd: IRCMessage) {
    }

}
