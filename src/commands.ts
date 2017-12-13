
import IRCClient from "./client";
import {registerCommand, CommandLib} from "./commandhandler";
import {log} from "./utils";
import {IParseResult} from "./interfaces";

/**
 * Class containing some essential commands.
 */
export class BasicCommands extends CommandLib {
    @registerCommand
    public static async NICK(client : IRCClient, cmd : IParseResult) {
        if (cmd.args.length < 1) {
            client.tell(client.reply.errNoNicknameGiven());
            return;
        }

        const oldnick = client.nick;
        const newnick = cmd.args[0];

        if ((await client.server.getClients("nick", newnick)).length > 0) {
            client.tell(client.reply.errNicknameInUse(newnick));
            return;
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
    public static async USER(client : IRCClient, cmd : IParseResult) {
        if (cmd.args.length < 1 || cmd.msg === "") {
            client.tell(client.reply.errNeedMoreParams("user"));
            return;
        }

        if (client.authed) {
            client.tell(client.reply.errAlreadyRegistred());
            return;
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
    public static async QUIT(client : IRCClient, cmd : IParseResult) {
        log.interaction(`${client.identifier} disconnected with reason: ${cmd.msg !== "" ? cmd.msg : "Not given"}.`);
        client.shutdown();
    }

    @registerCommand
    public static async PRIVMSG(client : IRCClient, cmd : IParseResult) {
        if (cmd.args.length < 2) {
            return;
        }

        const targets : IRCClient[] = <any[]> await client.server.getClients("nick", cmd.args[0]);
        const target : IRCClient = targets[0];

        if (targets.length === 0) {
            client.tell(client.reply.errNoSuchNick(cmd.args[0]));
            return;
        }

        log.interaction(`${client.nick} > ${target.nick}\t${cmd.msg}`);
        targets[0].tell(`:${client.identifier} PRIVMSG ${target.nick} :${cmd.msg}`);
    }

    @registerCommand
    public static async PING(client : IRCClient, prefix : string, args : string[]) {
        // TODO: client.tell()
    }
}
