
import {option, parse} from "yargs";
import { TestRunner } from "./libs/runner";
import { log } from "../src/libs/utils";

interface Arguments {
    host: string;
    port: number;
}

option("host", {
    alias: "h",
    default: "localhost",
    desc: "Host to connect to."
});

option("port", {
    alias: "p",
    default: 6667,
    desc: "Port to connect to."
});

async function main() {
    const args = parse() as any as Arguments;
    const runner = new TestRunner(args.host, args.port);

    log.test("Running IRC Tests on ${args.host}:${args.port}...");

    try
    {
        await runner.run();
    }
    catch(err)
    {
        log.test("Error running IRC Tests:");
        console.error(err);
    }
    finally
    {
        log.test("IRC Tests ended.");
    }
}

main();