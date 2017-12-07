
import {IPipeable, IActor, isActor} from "./utils";
import {SerializedState, parsePercentage, } from "./parser";

type CommandFunction = (sender : IActor, prefix : string, args : string[]) => Promise<string|undefined>;

const commands : Map<string, CommandFunction> = new Map();
export function Command(target : Function, propertyKey: string, descriptor: PropertyDescriptor) {
    commands.set(propertyKey.toLowerCase(), target[propertyKey]);
}


export default class CommandHandler implements IActor{

    async parseByCharacter(msg : string) : Promise<SerializedState>{
        console.log("Parsing: " + msg);
        let state : SerializedState = <any>{};
        for await(let p of parsePercentage(msg)){
            console.log("..."+p+"%");
            state = p.state;
        }
        console.log("Done. ", state);

        return state;
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