
import IRCClient from "./client";
import {Command} from "./commandhandler";
import {log} from "./utils";

class BasicCommands{
    @Command
    static async NICK(client : IRCClient, prefix : string, args : string[]){
        if(args.length < 1) return;

        if((await client.server.getClients("nick", args[0])).length > 0){
            client.tell(client.reply.ErrNicknameInUse(args[0]));
            return;
        }

        let oldnick = client.nick;
        client.nick = args[0];
        if(client.authed && oldnick){
            log(`${client.identifier} changed nick from "${oldnick}" to "${client.nick}".`);
        }else{
            log(`${client.address} set their nick to ${client.nick}`);
        }

        if(client.authed){
            log(`${client.identifier} identified themself`);
            client.tell(client.reply.Welcome());
        }
    }

    @Command 
    static async USER(client : IRCClient, prefix : string, args : string[]){
        if(args.length < 2) return;

        if((await client.server.getClients("username", args[0])).length > 0) return;

        client.username = args[0];
        client.fullname = args[1];

        if(client.authed){
            log(`${client.identifier} identified themself`);
            client.tell(client.reply.Welcome());
        }
    }

    @Command
    static async QUIT(client : IRCClient, prefix : string, args : string[]){
        log(`${client.identifier} attempts to disconnect with reason: ${args[0] || "Not given"}`);
        client.disconnect();
    }
}