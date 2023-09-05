import express from 'express';
import {createServer, Server} from 'http';
import {MultiPartService} from "../service/multi-part-service";
import cors from 'cors';
import {MorganMiddleware} from "../service/morgan-middleware";
import * as Sentry from "@sentry/node";

let env = require("../.env.json");

export class ExpressServer {
    private readonly _app: express.Application;
    private readonly server: Server;
    private readonly port: string | number;
    private service: MultiPartService;

    constructor(port: number, service: MultiPartService) {
        this.service = service;
        this.port = port;
        this._app = express();
        this._app.use(express.json());
        this._app.use(express.urlencoded({extended: true}));
        this._app.use(cors(env.cors));
        this._app.use(MorganMiddleware);
        this._app.enable("trust proxy");
        this._app.use(Sentry.Handlers.errorHandler());

        this.server = createServer(this._app);

        Sentry.init({
            dsn: env.sentry.dsn,
            integrations: [
                // enable HTTP calls tracing
                new Sentry.Integrations.Http({
                    tracing: true
                }),
                // enable Express.js middleware tracing
                new Sentry.Integrations.Express({
                    app: this._app,
                }),
            ],
            // Performance Monitoring
            tracesSampleRate: 0.1, // Capture 100% of the transactions, reduce in production!,
        });

        this._app.use(Sentry.Handlers.requestHandler());
        this._app.use(Sentry.Handlers.tracingHandler());

        this.listen();
        this.routes();
    }

    private listen(): void {
        console.log("init listen");
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });
    }

    private routes(): void {
        console.log("init routes");
        this._app.get("/status", (req, res) => {
            console.log((env.cors.origin === "https://4based.com") ? "your on the production system" : "your on the staging system");
            res.send(((env.cors.origin === "https://4based.com") ? "your on the production system" : "your on the staging system"));
        });
        this._app.post("/uploads/initializeMultipartUpload", (req, res) => {
            (async () => {
                await this.service.initializeMultipartUpload(req, res);
            })();
        });
        this._app.post("/uploads/getMultipartPreSignedUrls", (req, res) => {
            (async () => {
                await this.service.getMultipartPreSignedUrls(req, res);
            })();
        });
        this._app.post("/uploads/finalizeMultipartUpload", (req, res) => {
            (async () => {
                await this.service.finalizeMultipartUpload(req, res);
            })();
        });
    }

    get app(): express.Application {
        return this._app;
    }
}
