import Client from "./client";

export const Welcome = (hostname : string, client : Client<any>) => 
    `:${hostname} 001 ${client.nick} :Welcome to the Internet Relay Network ${client.identifier}`;

export const ErrNicknameInUse = (hostname : string, nick : string) => 
    `:${hostname} 433 * ${nick} :Nickname is already in use.`;