import Client from "./client";

export const Welcome = (hostname : string, client : Client<any>) => 
    `:${hostname} 001 ${client.nick} :Welcome to the Internet Relay Network ${client.nick}!${client.username}@${client.address}`;