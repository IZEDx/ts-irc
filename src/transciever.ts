import {IPipeable, IActor, dataEvent, NodeDataStream} from "./utils";

export default class Transciever implements IPipeable,IActor{
    private socket : NodeDataStream;

    constructor(socket : NodeDataStream){
        this.socket = socket;
    }

    async tell(msg : string){
        console.log(msg);
        this.socket.write(msg);
    }

    async shutdown(){
    }

    async pipe(target : IActor, then? : IActor){
        for await (let data of dataEvent(this.socket)){
            target.tell(data.toString(), then || this);
        }
    }
}