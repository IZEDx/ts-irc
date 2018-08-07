import { TestClient } from "./client";

export class TestRunner
{
    public clients: TestClient[] = [];

    constructor(public host: string, public port: number)
    {

    }

    async createClient()
    {
        const client = await TestClient.CREATE(this.host, this.port);
        this.clients.push(client);
        return client;
    }

    async disconnectClient(client: TestClient)
    {
        client.disconnect();
        this.clients.splice(this.clients.indexOf(client), 1);
    }

    

    async run()
    {

    }
}