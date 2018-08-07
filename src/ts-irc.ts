
import {isConsole, log} from "./libs/utils";
import {IRCServer} from "./server";

import {hostname} from "os";
import {option, parse} from "yargs";

interface Arguments {
    port: number;
}

option("port", {
    alias: "p",
    default: 6667,
    desc: "Port to connect to."
});

/**
 * Main function
 * @param {Arguments} arg Process arguments, including the first two "npm start"
 */
async function main() {
    const args    = parse() as any as Arguments;
    const server  = new IRCServer(args.port, hostname());

    // Printing empty lines to clear the screen
    if (isConsole(process.stdout)) {
        for (let i = 1; i < process.stdout.rows; i += 1) {
            console.log("\r\n");
        }
    }

    log.main("Starting IRC Server on port " + args.port.toString());

    await server.start(); // Starting the server and waiting for it to finish

    log.main("Shutdown.");
}

main();