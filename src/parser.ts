import {IActor} from "./utils";

export type Step = {p : number, c : string, prev : Step};
export type StepFunction = (step : Step) => StepFunction;
export type SerializedState = {prefix : string, command : string, args : string[]};

export class State implements IActor<Step>{
    private _next : StepFunction;
    private _buffer = "";
    public finished = false;

    constructor(public prefix : string, public command : string, public args : string[]){
        this._next = this.ENTRY;
    }  

    async tell(step : Step){
        this._next = this._next.bind(this)(step);
    }

    serialize() : SerializedState{
        return {
            prefix : this.prefix,
            command : this.command,
            args : this.args
        }
    }

    private ENTRY(step : Step) : StepFunction{
        if(step.c == ":") return this.PREFIX;
        return this.COMMAND(step);
    }

    private PREFIX(step : Step) : StepFunction{
        if(step.c == " ") return this.COMMAND;
        this.prefix += step.c;
         return this.PREFIX;
    }

    private COMMAND(step : Step) : StepFunction{
        if(step.c == " ") return this.ARGUMENTS;
        this.command += step.c.toLowerCase();
        return this.COMMAND;
    }

    private ARGUMENTS(step : Step) : StepFunction{
        if(step.c == "\r") return this.MESSAGE;
        if(step.c == " " || step.c == ":"){
            if(this._buffer.length > 0){
                this.args.push(this._buffer);
                this._buffer = "";
            }
            return step.c == " " ? this.ARGUMENTS : this.MESSAGE;
        }

        this._buffer += step.c;
        return this.ARGUMENTS;
    }

    private MESSAGE(step : Step) : StepFunction{
        if(step.c == "\r") return this.MESSAGE;
        if(step.prev.c  == "\r" && step.c == "\n"){
            if(this._buffer.length > 0){
                this.args.push(this._buffer);
                this._buffer = "";
            }
            return this.FINISHED;
        }
        this._buffer += step.c;
        return this.MESSAGE;
    }

    private FINISHED(step : Step) : StepFunction{
        this.finished = true;
        return this.FINISHED;
    }
}

export default class Parser implements IActor<string, void, State>{
    private _target : IActor;
    private _state : State = new State("", "", []);
    private _p = 0;
    private _step : Step;

    constructor(){
    }   

    async tell(c : string) : Promise<State>{
        this._step = {c : c, p : this._p++, prev : this._step};
        await this._state.tell(this._step);
        return this._state;
    }

    async parse(msg : string) : Promise<State>{
        console.log(`"${msg}"`);
        for(let c of msg) await this.tell(c);
        if(!this._state.finished) throw("Invalid Message");
        return this._state;
    }

    async shutdown(){
    }
}
