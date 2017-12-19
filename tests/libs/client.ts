import {connect, Socket} from "net";
import IRCMessage from "../../src/message";
import {OperatorParser} from "../../src/parser";

export default class TestClient {
    private requests : {resolve : Function, reject : Function}[] = [];
    private parser : OperatorParser = new OperatorParser();

    public socket : Socket;
    public host : string;
    public port : number;
    public connected : boolean = false;

    public onReply = (cmd : IRCMessage) => { };

    private constructor() { }

    public request(msg : string) : Promise<IRCMessage> {
        return new Promise<IRCMessage>((resolve, reject) => {
            this.send(msg, () => {
                this.requests.push({resolve, reject});
            });
        });
    }

    public send(msg : string, cb? : Function) {
        this.socket.write(msg.trim() + "\r\n", cb);
    }

    public disconnect() {
        if ( this.connected ) {
            this.socket.end();
            this.socket.destroy();
            this.connected = false;
        }
    }

    public onData(msg : string) {
        const cmd = this.parser.parse(msg);

        if (/^\d\d\d$/.test(cmd.command)) {
            this.onReply(cmd);
        }
    }

    public static CREATE(host : string = "localhost", port : number = 7776) : Promise<TestClient> {
        const client = new TestClient();
        client.host = host;
        client.port = port;
        client.socket = connect(port, host);
        client.socket.on("data", buffer => client.onData(buffer.toString()));

        return new Promise<TestClient>((resolve, reject) => {
            client.socket.once("connect", () => {
                client.connected = true;
                resolve(client);
            });
            client.socket.once("error", (err) => {
                if ( !client.connected ) {
                    reject(err);
                }
            });
        });
    }
}