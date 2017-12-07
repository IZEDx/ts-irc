
import {IPipeable, IActor, isActor} from "./utils";
import Parser, {SerializedState} from "./parser";

type CommandFunction = (sender : IActor, prefix : string, args : string[]) => Promise<string|undefined>;

const commands : Map<string, CommandFunction> = new Map();
export function Command(target : Function, propertyKey: string, descriptor: PropertyDescriptor) {
    commands.set(propertyKey.toLowerCase(), target[propertyKey]);
}


export default class CommandHandler implements IActor{

    async parseByCharacter(msg : string) : Promise<SerializedState>{
        return (await new Parser().parse(msg)).serialize();
    }

    async parseBySegment(msg : string) : Promise<SerializedState>{
        let prefix  = "";
        let command = "";
        let parts : string[] = [];
        let segments = msg.split(":");
        if(segments.length == 0) return {prefix : "", command : "", args: []};

        if(/^\s*:/i.test(msg)){             // Contains prefix
            let p = segments[1].split(" ");
            prefix = p[0];
            p.splice(0,1)
            parts.push(...p);
            segments.splice(0,2);

        }else{                               // No Prefix
            let p = segments[0].split(" ");
            parts.push(...p);
            segments.splice(0,1);
        }

        if(segments.length >= 1) parts.push(segments.join(":"));

        parts = parts.map(x => x.trim()).filter(x => x.length > 0);


        if(parts.length > 0){
            command = parts[0].toLowerCase();
            parts.splice(0,1);
        }

        return {
            prefix : prefix,
            command : command,
            args : parts
        }
    }

    async tell(msg : string, target : IActor){
        
        let {prefix, command, args} = await this.parseByCharacter(msg);

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