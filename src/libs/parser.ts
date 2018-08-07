
import {IRCMessage} from ".";
import { Operator } from "plumbing-toolkit";

export function parser(): Operator<string, IRCMessage>
{
    return input => input.map(msg => parse(msg));
}

/**
 * Parses IRC Commands using string and array operations.
 */
export function parse(msg: string): IRCMessage
{
    const result: IRCMessage = new IRCMessage({
        prefix: "",
        command: "",
        args: [],
        msg: ""
    });
    const segments = msg.split(":");

    // Got empty message
    if (segments.length === 0) {
        return result;
    }

    // Contains prefix => Get prefix and following args
    if (/^\s*:/i.test(msg)) {
        const p = segments[1].split(" ");
        result.prefix = p[0];
        p.splice(0, 1);
        result.args.push(...p);
        segments.splice(0, 2);

    // No prefix => Get args
    } else {
        const p = segments[0].split(" ");
        result.args.push(...p);
        segments.splice(0, 1);
    }

    // Get message content
    if (segments.length >= 1) {
        result.msg = segments.join(":").trim();
    }

    // Trim args and remove empty ones (multiple whitespaces)
    result.args = result.args.map(x => x.trim()).filter(x => x.length > 0);

    // Extract Command
    if (result.args.length > 0) {
        result.command = result.args[0].toLowerCase();
        result.args.splice(0, 1);
    }

    return result;
}
