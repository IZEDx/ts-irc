
import { IIRCMessage, IParser } from "../src/libs/interfaces";
import { OperatorParser } from "../src/libs/parser";

import { expect } from "chai";

interface IMessageExpectation {
    description: string;
    message: string;
    result: IIRCMessage;
}

const emptyResult: IIRCMessage = {
    prefix: "",
    command: "",
    args: [],
    msg: ""
};

const expectedMessages: IMessageExpectation[] = [

    { description: "should return empty result", message: "", result: emptyResult },
    { description: "should return empty result", message: "  ", result: emptyResult },

    {
        description: "should return full result",
        message: ":thisIsThePrefix command arg0 arg1 :Message with spaces and : colons!",
        result: {
            prefix: "thisIsThePrefix",
            command: "command",
            args: ["arg0", "arg1"],
            msg: "Message with spaces and : colons!"
        }
    },
    {
        description: "should return full result except message",
        message: ":thisIsThePrefix command arg0",
        result: {
            prefix: "thisIsThePrefix",
            command: "command",
            args: ["arg0"],
            msg: ""
        }
    },
    {
        description: "should return prefix without args and message",
        message: ":thisIsThePrefix command",
        result: {
            prefix: "thisIsThePrefix",
            command: "command",
            args: [],
            msg: ""
        }
    },
    {
        description: "should return just the command",
        message: "command",
        result: {
            prefix: "",
            command: "command",
            args: [],
            msg: ""
        }
    },
    {
        description: "should return the command and message",
        message: "command :This is a message",
        result: {
            prefix: "",
            command: "command",
            args: [],
            msg: "This is a message"
        }
    },
    {
        description: "should return the command with some args",
        message: "command arg0 arg1 arg2",
        result: {
            prefix: "",
            command: "command",
            args: ["arg0", "arg1", "arg2"],
            msg: ""
        }
    }

];

let parser: IParser;

describe("OperatorParser", () => {

    before(() => {
        parser = new OperatorParser();
    });

    for (const expectation of expectedMessages) {
        it(expectation.description, async () => {
            const result = parser.parse(expectation.message);
            expect(result).to.deep.equal(expectation.result);
        });
    }
});
