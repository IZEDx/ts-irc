import {IActor, IParser, IActorParser, IParseResult} from "./interfaces";
import {AsyncIterable} from "./utils";

export interface Step {p : number; c : string; prev : Step; }
export type StepFunction = (step : Step) => StepFunction;

export class State implements IActor<Step> {
    private _next : StepFunction;
    private _buffer : string = "";
    public finished : boolean = false;

    constructor(public prefix : string, public command : string, public args : string[]) {
        this._next = this.ENTRY;
    }

    public async tell(step : Step) {
        this._next = this._next.bind(this)(step);
    }

    public serialize() : IParseResult {
        return {
            prefix : this.prefix,
            command : this.command,
            args : this.args
        };
    }

    private ENTRY(step : Step) : StepFunction {
        if (step.c === ":") { return this.PREFIX; }
        return this.COMMAND(step);
    }

    private PREFIX(step : Step) : StepFunction {
        if (step.c === " ") { return this.COMMAND; }
        this.prefix += step.c;
         return this.PREFIX;
    }

    private COMMAND(step : Step) : StepFunction {
        if (step.c === " ") { return this.ARGUMENTS; }
        this.command += step.c.toLowerCase();
        return this.COMMAND;
    }

    private ARGUMENTS(step : Step) : StepFunction {
        if (step.c === "\r") { return this.MESSAGE; }
        if (step.c === " " || step.c === ":") {
            if (this._buffer.length > 0) {
                this.args.push(this._buffer);
                this._buffer = "";
            }
            return step.c === " " ? this.ARGUMENTS : this.MESSAGE;
        }

        this._buffer += step.c;
        return this.ARGUMENTS;
    }

    private MESSAGE(step : Step) : StepFunction {
        if (step.c === "\r") { return this.MESSAGE; }
        if (step.prev.c  === "\r" && step.c === "\n") {
            if (this._buffer.length > 0) {
                this.args.push(this._buffer);
                this._buffer = "";
            }
            return this.FINISHED;
        }
        this._buffer += step.c;
        return this.MESSAGE;
    }

    private FINISHED(step : Step) : StepFunction {
        this.finished = true;
        return this.FINISHED;
    }
}

export class StateParser implements IActorParser<State> {
    private _state : State = new State("", "", []);
    private _p : number = 0;
    private _step : Step;

    constructor() {
    }

    public async tell(c : string) : Promise<State> {
        this._step = {c, p : this._p++, prev : this._step};
        await this._state.tell(this._step);
        return this._state;
    }

    public async parse(msg : string) : Promise<IParseResult> {
        for (const c of msg) { await this.tell(c); }
        if (!this._state.finished) { throw new Error("Invalid Message"); }
        return this._state.serialize();
    }

    public async shutdown() {
    }
}

export class OperatorParser implements IParser {
    constructor() {
    }

    public async parse(msg : string) : Promise<IParseResult> {
        let prefix  = "";
        let command = "";
        let parts : string[] = [];
        const segments = msg.split(":");
        if (segments.length === 0) { return {prefix : "", command : "", args: []}; }

        if (/^\s*:/i.test(msg)) {             // Contains prefix
            const p = segments[1].split(" ");
            prefix = p[0];
            p.splice(0, 1);
            parts.push(...p);
            segments.splice(0, 2);

        } else {                               // No Prefix
            const p = segments[0].split(" ");
            parts.push(...p);
            segments.splice(0, 1);
        }

        if (segments.length >= 1) { parts.push(segments.join(":")); }

        parts = parts.map(x => x.trim()).filter(x => x.length > 0);

        if (parts.length > 0) {
            command = parts[0].toLowerCase();
            parts.splice(0, 1);
        }

        return {
            prefix,
            command,
            args : parts
        };
    }
}

export async function* parsePercentage(msg : string) : AsyncIterable<{state : State, p : number}> {
    const parser = new StateParser();
    let i = 0;
    for (const c of msg) {
        yield {state : await parser.tell(c), p : 100 / msg.length * ++i};
    }

    return;
}

export async function parseByCharacter(msg : string, silent : boolean = false) : Promise<IParseResult> {
    if (!silent) { console.log("Parsing: " + msg); }
    let state : State = {} as any;
    for await(const r of parsePercentage(msg)) {
        if (!silent) { console.log("..." + r.p + "%"); }
        state = r.state;
    }
    if (!silent) { console.log("Done. ", state); }

    if (!state.finished) { throw new Error("Invalid Message"); }
    return state;
}
