import {IParseResult, IParser} from "./interfaces";

export class IRCMessage implements IParseResult {
    private constructor(
        public prefix : string,
        public command : string,
        public args : string[],
        public msg : string
    ) {}

    public static FROM_PARSERESULT(message : IParseResult) {
        return new IRCMessage(message.prefix, message.command, message.args, message.msg);
    }

    public static FROM_STRING(parser: IParser, message : string) {
        const pr = parser.parse(message);
        return new IRCMessage(pr.prefix, pr.command, pr.args, pr.msg);
    }

    public toString() {
        let result = "";

        if (this.prefix !== "") {
            result += ":" + this.prefix + " ";
        }

        result += this.command + " ";
        result += this.args.join(" ") + " ";

        if (this.msg !== "") {
            result += ":" + this.msg;
        }

        return result;
    }
}