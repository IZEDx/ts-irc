
import IRCServer from "./server";
import chalk from "chalk";

const log = (...msg : string[]) => console.log(chalk.red.bold("[ts-irc]\t") + chalk.gray(...msg));

async function main(argv : string[]) {
    if (argv.length < 3) {
        log("Usage: npm start -- <port>");
        return;
    }

    const port    = parseInt(argv[2]);
    const server  = new IRCServer(port);

    log("Starting IRC Server.");

    await server.listen();

    log("Shutdown");
}

main(process.argv);
