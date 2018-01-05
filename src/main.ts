
import {isConsole, log} from "./libs/utils";
import {IRCServer} from "./server";

import {hostname} from "os";
import {alias, Arguments, default as define, describe, parse} from "yargs";

alias   ("p", "port");
define  ("p", 6667);
describe("p", "Port to listen on.");

/**
 * Main function
 * @param {string[]} arg Process arguments, including the first two "npm start"
 */
async function main(args: Arguments) {
    const port    = parseInt(args.port, 10);
    const server  = new IRCServer(port, hostname());

    // Printing empty lines to clear the screen
    if (isConsole(process.stdout)) {
        for (let i = 1; i < process.stdout.rows; i += 1) {
            console.log("\r\n");
        }
    }

    log.main("Starting IRC Server on port " + port.toString());

    await server.start(); // Starting the server and waiting for it to finish

    log.main("Shutdown.");
}

main(parse(process.argv)); // Run the main function
