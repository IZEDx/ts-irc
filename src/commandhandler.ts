
import {IPipeable, IActor, isActor} from "./utils";

type CommandFunction = (sender : IActor, args : string[], prefix? : string) => Promise<string|undefined>;

export class CommandLib{
    commands : {name : string, fn : CommandFunction}[];
}

export function Command(name? : string) {
    return function (target : CommandLib, propertyKey: string, descriptor: PropertyDescriptor) {
        name = name || propertyKey;
        if(!target.commands) target.commands = [];
        target.commands.push({name : name.toLowerCase(), fn : target[propertyKey]});
    }
}

export default class CommandHandler implements IActor{
    private libs : CommandLib[] = []; 

    constructor(...libs : CommandLib[]){
        this.libs = libs;
    }

    addLib(lib : CommandLib){
        if(this.libs.indexOf(lib) < 0) this.libs.push(lib);
    }

    lookUp(name: string) : CommandFunction|undefined{
        for(let {commands} of this.libs){
            let found = commands.find(o => o.name == name);
            return found && found.fn;
        }
    }

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

        let fn = this.lookUp(parts[0].toLowerCase());
        parts.splice(0,1);
        if(fn != undefined){
            let result = await fn(target, parts, prefix != "" ? prefix : undefined);
            if(result) target.tell(result);
        }else{
            target.tell("Command not found: " + msg);
        }
    }

    async shutdown(sender : IActor){

    }
}