import IRCMessage from "../src/message";
import { expect } from "chai";

describe("IRCMessage", () => {
    it("contains everything", () => {
        const msg = new IRCMessage({
            prefix : "thisIsMyPrefix",
            command : "command",
            args : ["arg1", "arg2"],
            msg : "this is a message: with colons"
        }).toString();

        expect(msg).to.equal(":thisIsMyPrefix command arg1 arg2 :this is a message: with colons\r\n");
    });

    it("contains no prefix", () => {
        const msg = new IRCMessage({
            prefix : "",
            command : "command",
            args : ["arg1", "arg2"],
            msg : "this is a message: with colons"
        }).toString();

        expect(msg).to.equal("command arg1 arg2 :this is a message: with colons\r\n");
    });

    it("and no command", () => {
        const msg = new IRCMessage({
            prefix : "",
            command : "",
            args : ["arg1", "arg2"],
            msg : "this is a message: with colons"
        }).toString();

        expect(msg).to.equal("");
    });

    it("contains no args", () => {
        const msg = new IRCMessage({
            prefix : "",
            command : "command",
            args : [],
            msg : "this is a message: with colons"
        }).toString();

        expect(msg).to.equal("command :this is a message: with colons\r\n");
    });

    it("and no message", () => {
        const msg = new IRCMessage({
            prefix : "",
            command : "command",
            args : [],
            msg : ""
        }).toString();

        expect(msg).to.equal("command \r\n");
    });
});