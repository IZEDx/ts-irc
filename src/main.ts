
import IRCServer from "./server";
import {log} from "./utils";
import {hostname} from "os";
import {parse, alias, default as define, describe,  Arguments} from "yargs";
import {IConsole} from "./interfaces";

alias   ("p", "port");
define  ("p", 6667);
describe("p", "Port to listen on.");

/**
 * Main function
 * @param {string[]} arg Process arguments, including the first two "npm start"
 */
async function main(args: Arguments) {
    const port    = parseInt(args.port);
    const server  = new IRCServer(port, hostname());

    // Printing empty lines to clear the screen
    for (let i = 1; i < (<IConsole>process.stdout).rows; i += 1) {
        console.log("\r\n");
    }

    log.main("Starting IRC Server on port " + port);

    await server.listen(); // Starting the server and waiting for it to finish

    log.main("Shutdown.");
}

main(parse(process.argv));