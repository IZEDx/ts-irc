
import {IIRCMessage} from "./interfaces";

export {IIRCMessage};

export class IRCMessage implements IIRCMessage {
    public prefix: string;
    public command: string;
    public args: string[];
    public msg: string;

    constructor(message: IIRCMessage) {
        Object.assign(this, message);
    }

    public toString(): string {
        let result = "";

        if (this.prefix !== "" ) {
            result += ":" + this.prefix.replace(/\s/i, "") + " ";
        }

        result += this.command.trim().length > 0 ? this.command + " " : "";

        if (result === "") {
            return "";
        }

        if (this.args.length > 0) {
            result += this.args.map(arg => arg.trim()).join(" ") + " ";
        }

        if (this.msg.replace(/\s/i, "") !== "") {
            result += ":" + this.msg.trim();
        }

        return result + "\r\n";
    }
}
