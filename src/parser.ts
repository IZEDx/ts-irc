import {IParser, IParseResult} from "./interfaces";

/**
 * Parses IRC Commands using string and array operations.
 */
export class OperatorParser implements IParser {
    constructor() {
    }

    public async tell(msg : string) : Promise<IParseResult> {
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

    public async shutdown() {
    }
}