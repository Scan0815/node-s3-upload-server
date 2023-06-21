import {Db, InsertOneResult, MongoClient} from "mongodb";

export class MongodbService {
    private readonly url: string;
    private readonly dbName: string;
    private readonly username: string;
    private readonly password: string;
    private readonly port: string;
    private client: MongoClient;

    constructor(url: string, dbName: string, username: string, password: string, port: string = "27017") {
        this.url = url;
        this.dbName = dbName;
        this.username = username;
        this.password = password;
        this.port= port;
        this.client = new MongoClient(this.getConnectionString());
    }

    private getConnectionString(): string {
        return `mongodb://${this.username}:${encodeURIComponent(this.password)}@${this.url}:${this.port}`;
    }

    public async connect(): Promise<Db> {
        try {
            await this.client.connect();
            console.log('Verbunden mit der MongoDB-Datenbank');
            return this.client.db(this.dbName);
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
            const db = await this.connect();
            const collection = db.collection(collectionName);
            const result = await collection.insertOne(object);
            console.log('Objekt erfolgreich gespeichert:', result.insertedId);
            return result;
        } catch (error) {
            console.log('Fehler beim Speichern des Objekts', error);
            throw error;
        } finally {
            await this.close();
        }
    }

}