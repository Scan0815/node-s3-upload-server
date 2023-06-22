
# S3 Mutipart upload server for S3 compatible apis on upload finish publish to kafka 


### Add a .env.json file to root dir, with this structure:
```
{
"port": 3001,
"s3" : {
    "endPoint": "*.amazon.com",
    "accessKeyId": "",
    "secretAccessKey":"",
    "bucketName": "public"
},
  "mongoDb" : {
    "url": "mongodb+srv://{mongo_connection_string}"
  },
"cors": {
    "origin": "*",
    "optionsSuccessStatus": 200,
    "methods": [
      "POST"
    ]
  },
"debug": true
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
