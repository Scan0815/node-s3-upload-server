import {Db, InsertOneResult, MongoClient} from "mongodb";

export class MongodbService {
    private readonly url: string;
    private readonly dbName: string|null;
    private readonly username: string|null;
    private readonly password: string|null;
    private readonly port: string|null;
    private client: MongoClient;
    private db:any
    constructor(url: string, dbName: string|null = null, username: string|null= null, password: string|null= null, port: string|null = null) {
        this.url = url;
        this.dbName = dbName;
        this.username = username;
        this.password = password;
        this.port= port;
        this.client = new MongoClient(this.getConnectionString());
        (async () => {
            this.db = await this.connect();
        })();
    }

    private getConnectionString(): string {
        if(this.dbName && this.password && this.port && this.password) {
            return `mongodb://${this.username}:${encodeURIComponent(this.password)}@${this.url}:${this.port}`;
        }else{
            return this.url;
        }
    }

    public async connect(): Promise<Db> {
        try {
            await this.client.connect();
            console.log('Verbunden mit der MongoDB-Datenbank');
            return this.client.db(this.dbName || undefined);
        } catch (error) {
            console.log('Fehler beim Verbinden mit der Datenbank', error);
            throw error;
        }
    }

    public async close(): Promise<void> {
        await this.client.close();
        console.log('Verbindung zur MongoDB-Datenbank geschlossen');
    }

    public async saveObject(collectionName: string, object: any): Promise<InsertOneResult> {
        try {
            const collection = this.db.collection(collectionName);
            const result = await collection.insertOne(object);
            console.log('Objekt erfolgreich gespeichert:', result.insertedId);
            return result;
        } catch (error) {
            console.log('Fehler beim Speichern des Objekts', error);
            throw error;
        }

}