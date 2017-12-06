
import {IPipeable, IActor, isActor} from "./utils";

type CommandFunction = (sender : IActor, prefix : string, args : string[]) => Promise<string|undefined>;

const commands : Map<string, CommandFunction> = new Map();
export function Command(target : Function, propertyKey: string, descriptor: PropertyDescriptor) {
    commands.set(propertyKey.toLowerCase(), target[propertyKey]);
}

export default class CommandHandler implements IActor{

    async tell(msg : string, target : IActor){
        let prefix : string = "";
        let parts : string[] = [];

        let segments = msg.split(":");
        if(segments.length == 0) return;

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
        if(parts.length == 0)return;

        console.log(parts[0], commands);
        let fn = commands.get(parts[0].toLowerCase());
        parts.splice(0,1);
        if(fn != undefined){
            let result = await fn(target, prefix, parts);
            if(result) target.tell(result);
        }else{
            target.tell("Command not found: " + msg);
        }
    }

    async shutdown(sender : IActor){

    }
}