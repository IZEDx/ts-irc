
import {IActor, IParser, ICommandHandler} from "./interfaces";
import IRCClient from "./client";

type CommandFunction = (sender : IActor, prefix : string, args : string[]) => Promise<string|undefined>;

const commands : Map<string, CommandFunction> = new Map();
export function Command(target : Function, propertyKey: string, descriptor: PropertyDescriptor) {
    commands.set(propertyKey.toLowerCase(), target[propertyKey]);
}

export {OperatorParser, StateParser} from "./parser";

export default class CommandHandler implements ICommandHandler{
    readonly parser : IParser;

    constructor(parser : IParser){
        this.parser = parser;
    }

    async tell(msg : string, client : IRCClient){
        
        let {prefix, command, args} = await this.parser.parse(msg); // this.parseByCharacter(msg, true);

        let fn = commands.get(command);
        if(fn != undefined){
            let result = await fn(client, prefix, args);
            if(result) client.tell(result);
        }else{
            client.tell(client.reply.ErrUnknownCommand(command));
        }
    }

    async shutdown(sender : IActor){
    }
}