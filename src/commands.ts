
import IRCClient from "./client";
import {registerCommand, CommandLib} from "./commandhandler";
import {log} from "./utils";

/**
 * Class containing some essential commands.
 */
export class BasicCommands extends CommandLib {
    @registerCommand
    public static async NICK(client : IRCClient, prefix : string, args : string[]) {
        if (args.length < 1) {
            client.tell(client.reply.errNoNicknameGiven());
            return;
        }

        if ((await client.server.getClients("nick", args[0])).length > 0) {
            client.tell(client.reply.errNicknameInUse(args[0]));
            return;
        }

        const oldnick = client.nick;
        client.nick = args[0];
        if (client.authed && oldnick) {
            log.interaction(`${client.identifier} changed nick from "${oldnick}" to "${client.nick}".`);
        } else {
            log.interaction(`${client.address} set their nick to ${client.nick}.`);
        }

        if (client.authed) {
            log.interaction(`${client.identifier} identified themself.`);
            client.server.introduceToClient(client);
        }
    }

    @registerCommand
    public static async USER(client : IRCClient, prefix : string, args : string[]) {
        if (args.length < 2) {
            client.tell(client.reply.errNeedMoreParams("user"));
            return;
        }

        if (client.authed) {
            client.tell(client.reply.errAlreadyRegistred());
            return;
        }

        if ((await client.server.getClients("username", args[0])).length > 0) {
            return;
        }

        client.username = args[0];
        client.fullname = args[1];

        if (client.authed) {
            log.interaction(`${client.identifier} identified themself.`);
            client.server.introduceToClient(client);
        }
    }

    @registerCommand
    public static async QUIT(client : IRCClient, prefix : string, args : string[]) {
        log.interaction(`${client.identifier} disconnected with reason: ${args[0] || "Not given"}.`);
        client.shutdown();
    }

    @registerCommand
    public static async PRIVMSG(client : IRCClient, prefix : string, args : string[]) {
        if (args.length < 2) {
            return;
        }

        const targets : IRCClient[] = <any[]> await client.server.getClients("nick", args[0]);
        const target : IRCClient = targets[0];
        const msg : string = args[1];

        if (targets.length === 0) {
            client.tell(client.reply.errNoSuchNick(args[0]));
            return;
        }

        log.interaction(`${client.nick} > ${target.nick}\t${msg}`);
        targets[0].tell(`:${client.identifier} PRIVMSG ${target.nick} :${msg}`);
    }
}
