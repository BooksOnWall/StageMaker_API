## Manage api server 

### Requirement 

* Nodejs
* yarn 
* pm2 (for production)

### Install 

```
git clone https://git.pulsar113.org/AGC/Manage_api.git
cd manage_api
yarn

```

### Create and Set .env file 

```
cp env.example .env

```
* Development env

```
[tom@tom-desk manage_api]$ cat env.example 
SERVER_HOST=localhost
SERVER_PROTOCOL=http
SERVER_PORT=3010
PROXY_PORT=80

```
* Production env
```
[tom@tom-desk manage_api]$ cat env.production 
SERVER_HOST=manage.anima-gc.uy
SERVER_PROTOCOL=https
SERVER_PORT=3017
PROXY_PORT=443
```

### Run (dev) 
```
yarn start 
o
node server.js
```

### Run (prod)

install pm2 

```
yarn global add pm2

```
run server.js pm2 in daemon mode
```
pm2 start serverjs --name ManageApi
```
o
```
./start.sh
```
or 
```
NODE_ENV=production pm2 start server.js -- --port 3017 --name "ManageApi" 
```

Start the api automaticamente at server start 

```
pm2 startup
and
sudo env PATH=$PATH:/usr/bin /usr/local/share/.config/yarn/global/node_modules/pm2/bin/pm2 startup systemd -u anima --hp /home/anima

```