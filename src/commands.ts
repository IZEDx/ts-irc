
import IRCClient from "./client";
import {registerCommand, CommandLib} from "./commandhandler";
import {log} from "./utils";

/**
 * Class containing some essential commands.
 */
export class BasicCommands extends CommandLib {
    @registerCommand
    public static async NICK(client : IRCClient, prefix : string, args : string[]) {
        if (args.length < 1) { return; }

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
            client.tell(client.reply.welcome());
        }
    }

    @registerCommand
    public static async USER(client : IRCClient, prefix : string, args : string[]) {
        if (args.length < 2) { return; }

        if ((await client.server.getClients("username", args[0])).length > 0) { return; }

        client.username = args[0];
        client.fullname = args[1];

        if (client.authed) {
            log.interaction(`${client.identifier} identified themself.`);
            client.tell(client.reply.welcome());
        }
    }

    @registerCommand
    public static async QUIT(client : IRCClient, prefix : string, args : string[]) {
        log.interaction(`${client.identifier} disconnected with reason: ${args[0] || "Not given"}.`);
        client.disconnect();
    }
}
