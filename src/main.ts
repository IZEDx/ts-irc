
import IRCServer from "./irc";

export function main(argv : string[]){
    if(argv.length < 3){
        console.log("Usage: npm start -- <port>");
        return;
    }

    let port    = parseInt(argv[2]);
    let server  = new IRCServer();

    server.listen(port);
}

main(process.argv); 