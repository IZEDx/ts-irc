
import IRCServer from "./server";
import {log} from "./utils";

/**
 * Main function
 * @param {string[]} argv Process arguments, including the first two "npm start"
 */
async function main(argv : string[]) {
    if (argv.length < 3) {
        log.main("Usage: npm start -- <port>");
        return;
    }

    const port    = parseInt(argv[2]);
    const server  = new IRCServer(port);

    log.main("Starting IRC Server.");

    await server.listen();

    log.main("Shutdown");
}

main(process.argv);
