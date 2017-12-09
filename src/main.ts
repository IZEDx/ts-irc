
import IRCServer from "./server";

async function main(argv : string[]){
    if(argv.length < 3){
        console.log("Usage: npm start -- <port>");
        return;
    }

    let port    = parseInt(argv[2]);
    let server  = new IRCServer(port);

    console.log("Starting IRC Server.");

    server.listen();
}

main(process.argv); 
