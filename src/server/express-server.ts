import express from 'express';
import { createServer, Server } from 'http';
import {MultiPartService} from "../service/multi-part-service";
import cors from 'cors';
let env  = require("../.env.json");
export class ExpressServer {
    private readonly _app: express.Application;
    private readonly server: Server;
    private readonly port: string | number;
    private service:MultiPartService;
    constructor (port:number, service:MultiPartService) {
        this.service = service;
        this.port = port;
        this._app = express();
        this._app.use(express.json());
        this._app.use(express.urlencoded({ extended: true }));
        this._app.use(cors(env.cors));
        this.server = createServer(this._app);
        this.listen();
        this.routes();
    }

    private listen (): void {
        console.log("init listen");
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });
    }

    private routes (): void {
        console.log("init routes");
        this._app.get("/status",    (req, res) => {
            res.send('OK');
        });
        this._app.post("/uploads/initializeMultipartUpload",    (req, res) => {
            (async () => {
                await this.service.initializeMultipartUpload(req, res);
            })();
        });
        this._app.post("/uploads/getMultipartPreSignedUrls",    (req, res) => {
            (async () => {
                await this.service.getMultipartPreSignedUrls(req, res);
            })();
        });
        this._app.post("/uploads/finalizeMultipartUpload",(req, res) => {
            (async () => {
                await this.service.finalizeMultipartUpload(req, res);
            })();
        });
    }

    get app (): express.Application {
        return this._app;
    }
}
