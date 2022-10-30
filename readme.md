
# S3 Mutipart upload server for S3 compatible apis


### Add a .env.json file to src dir, with this structure:
```
{
"port": 3001,
"s3" : {
    "endPoint": "*.amazon.com",
    "accessKeyId": "",
    "secretAccessKey":"",
    "bucketName": "public"
},
"cors": {
    "origin": "https://local.dev.4based.com:3335",
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

### build and start server
```
npm start
```
