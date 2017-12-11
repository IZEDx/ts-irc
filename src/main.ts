
import IRCServer from "./server";
import {log} from "./utils";

/**
 * Main function
 * @param {string[]} argv Process arguments, including the first two "npm start"
 */
async function main(argv : string[]) {
    if (argv.length < 3) {
        console.log("Usage: ts-irc <port>");
        return;
    }

    const port    = parseInt(argv[2]);
    const server  = new IRCServer(port);

    // Printing empty lines to clear the screen
    const lines = (<any>process.stdout).getWindowSize()[1];
    for (let i = 0; i < lines; i += 1) {
        console.log("\r\n");
    }

    log.main("Starting IRC Server.");

    await server.listen(); // Starting the server and waiting for it to finish

    log.main("Shutdown");
}

main(process.argv);
