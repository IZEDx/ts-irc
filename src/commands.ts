
import IRCClient from "./client";
import IRCMessage from "./message";
import {registerCommand, CommandLib} from "./commandhandler";
import {log, readFile} from "./utils";

let motd : string;

/**
 * Class containing some essential commands.
 */
export class BasicCommands extends CommandLib {
    @registerCommand
    public static async NICK(client : IRCClient, cmd : IRCMessage) {
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
            log.interaction(`${client.host} set their nick to ${newnick}.`);
        }

        client.nick = newnick;

        if (client.authed && oldnick === undefined) {
            log.interaction(`${client.identifier} identified themself.`);
            client.server.introduceToClient(client);
        }
    }

    @registerCommand
    public static async USER(client : IRCClient, cmd : IRCMessage) {
        if (cmd.args.length < 1 || cmd.msg === "") {
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

    @registerCommand
    public static async QUIT(client : IRCClient, cmd : IRCMessage) {
        log.interaction(`${client.identifier} disconnected with reason: ${cmd.msg !== "" ? cmd.msg : "Not given"}.`);
        client.shutdown();
    }

    @registerCommand
    public static async PRIVMSG(client : IRCClient, cmd : IRCMessage) {
        if (cmd.args.length < 2 || !client.authed) {
            return;
        }

        const targets : IRCClient[] = <any[]> await client.server.getClients("nick", cmd.args[0]);
        const target : IRCClient = targets[0];

        if (targets.length === 0) {
            return client.reply.errNoSuchNick(cmd.args[0]);
        }

        log.interaction(`${client.nick} > ${target.nick}\t${cmd.msg}`);
        target.tell(`:${client.identifier} PRIVMSG ${target.nick} :${cmd.msg}`);
    }

    @registerCommand
    public static async NOTICE(client : IRCClient, cmd : IRCMessage) {
        if (cmd.args.length < 2 || !client.authed) {
            return;
        }

        const targets : IRCClient[] = <any[]> await client.server.getClients("nick", cmd.args[0]);
        const target : IRCClient = targets[0];

        if (targets.length > 0) {
            log.interaction(`${client.nick} > ${target.nick}\t${cmd.msg}`);
            target.tell(`:${client.identifier} NOTICE ${target.nick} :${cmd.msg}`);
        }

    }

    @registerCommand
    public static async MOTD(client : IRCClient, cmd : IRCMessage) {
        if (!client.authed) {
            return;
        }

        if (motd === undefined) {
            try {
                motd = (await readFile("./motd.txt")).toString();
            } catch (err) {
                motd = "";
            }
        }

        if (motd === "") {
            return client.reply.errNoMOTD();
        }

        client.tell(client.reply.motdStart().toString());

        for (const line of motd.split("\n")) {
            client.tell(client.reply.motd(line.trim()).toString());
        }

        return client.reply.endOfMotd();
    }

    @registerCommand
    public static async PING(client : IRCClient, cmd : IRCMessage) {
        return client.reply.pong();
    }

    @registerCommand
    public static async PONG(client : IRCClient, cmd : IRCMessage) {}
}
