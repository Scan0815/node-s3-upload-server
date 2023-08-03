
# S3 Multipart upload server for S3 compatible apis on upload finish publish to mongoDB 

### Add a .env.json file to root dir, with this structure:

```
{
    "port": 3001,
    "s3": {
        "endPoint": "",
        "region": "eu-central-003",
        "accessKeyId": "",
        "secretAccessKey": "",
        "bucketName": ""
    },
    "cloudConvert": {
        "apiKey": "",
        "sandbox": false
    },
    "kloudConvert": {
        "api": "",
        "apiInfo": ""
    },
    "redis": {
        "port": ,
        "host": "",
        "DB": ""
    },
    "mongoDb": {
        "collection": "queue_s3",
        "url": "mongodb://"
    },
    "cors": {
        "origin": "",
        "optionsSuccessStatus": 200,
        "methods": [
            "POST",
            "GET"
        ]
    },
    "sentry": {
        dsn: ""
    },
    "debug": false
}
```

### first time run
```
npm install
```

### copy .env.json to built dir of server
```
npm run copy
```

### build and start server
```
npm start
```
