
import {IActor, IParser} from "./utils";
import {SerializedState} from "./parser";

type CommandFunction = (sender : IActor, prefix : string, args : string[]) => Promise<string|undefined>;

const commands : Map<string, CommandFunction> = new Map();
export function Command(target : Function, propertyKey: string, descriptor: PropertyDescriptor) {
    commands.set(propertyKey.toLowerCase(), target[propertyKey]);
}

export {OperatorParser, StateParser} from "./parser";

export default class CommandHandler implements IActor{
    readonly parser : IParser<SerializedState>;

    constructor(parser : IParser<SerializedState>){
        this.parser = parser;
    }

    async tell(msg : string, target : IActor){
        
        let {prefix, command, args} = await this.parser.parse(msg); // this.parseByCharacter(msg, true);

        console.log(prefix, command, args);

        let fn = commands.get(command);
        if(fn != undefined){
            let result = await fn(target, prefix, args);
            if(result) target.tell(result);
        }else{
            target.tell("Command not found: " + msg);
        }
    }

    async shutdown(sender : IActor){

    }
}