const cors = require('cors');
const express = require('express'); 
const morgan = require('morgan');
const logger = require('./logger');
const httpProxy = require('http-proxy');
const JsonFile = require('jsonfile');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { EWOULDBLOCK } = require('constants');
const app = express();
const proxy = httpProxy.createProxyServer({});

const globalOptions = {};
const proxyOptions = {};
// Check for global configuration. Set options.
const globalStat = fs.existsSync(path.join(process.cwd().toString(), 'conf', 'global.fp'));
if(!globalStat) {
    logger.error(`Uh oh! It seems like your global configuration file doesn't exist! This is normally due to an accidental deletion.`);
    logger.error(`If you think this is an accident, please recreate the global.fp.`);
    logger.error(`If you need help, try our example at https://femboy.us/proxy/example`)
    process.exit(1003);
}else{
    logger.success(`We've located your global configuration file!`);
    const global = JsonFile.readFileSync(path.join(process.cwd().toString(), 'conf', 'global.fp'));
    globalOptions.PORT = global.port;
    globalOptions.EXPERIMENTAL = global.experimental;
    globalOptions.WEBPANEL = global.webPanel;
}
function getProxyConfig(dir) {
    const files = fs.readdirSync(path.join(process.cwd().toString(), dir));
    for(const file of files) {
        const stat = fs.lstatSync(path.join(process.cwd().toString(), dir, file));
        if(stat.isDirectory()) {
            getProxyConfig(path.join(dir, file));
        }else{
            
            let conf = JsonFile.readFileSync(path.join(process.cwd().toString(), dir, file));
            if(!conf.enabled) { logger.error(`${conf.domain[0]} is not enabled. Not loading.`); return; }
            conf.domain.forEach(domain => {
                try {
                    proxyOptions[domain].secure = conf.secure;
                    proxyOptions[domain].cors = conf.cors;
                    if(conf.secure) {
                        proxyOptions[domain].ssl.privatekey = conf.ssl.privatekey;
                        proxyOptions[domain].ssl.publickey = conf.ssl.publickey;
                    }
                    proxyOptions[domain].target = conf.target;
                } catch (e) {
                    logger.error(`Your configuration in ${file} isn't configured correctly.`);
                }
            });
            logger.success(`Successfully loaded ${conf.domain[0]}!`);
        }
    }
}
getProxyConfig('conf');


// Express
app.use(cors({
    credentials: true,
    origin: true
}));

// Morgan Logging
app.use(morgan((tokens, req, res) => {
    // get all info about request
    var method = tokens.method(req,res);
    var status = tokens.status(req,res);
    var domain = req.get('host');
    var path = tokens.url(req,res);
    var ip = req.ip;
    // check if it has a string we dont need, if it does, remove it
    if(ip.substr(0, 7) == "::ffff:"){
        ip = ip.substr(7);
    }
    if(ip == "::1" || ip == "127.0.0.1"){
        ip = "localhost"
    }
    // list of bad requests
    var bad = [400, 401, 403, 404, 500, 502, 503, 504];
    var failed = false;
    // Loops through all of the bad status codes
    // if the current status is one of the bad codes, it will return an error response
    // will set a failed variable for if it is bad.
    bad.forEach((val) => {
        if(status == val){
            failed = true;
            logger.error([method, '|', status, '|', domain, '|', path, '|', ip, '|', tokens['response-time'](req, res), 'ms'].join(' '));
            return;
        }
    });
    // If the status code isnt in the bad list, log a successful request.
    if(failed == false) logger.success([method, '|', status, '|', domain, '|', path, '|', ip, '|', tokens['response-time'](req, res), 'ms'].join(' '));
}));

app.all('*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.get('origin'));
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use((req, res, next) => {
    
});

app.get('*', (req, res, next) => {
    res.send('<h1 style="text-align: center;">Welcome to FemboyProxy</h1><h3 style="text-align: center;">You have not configured FemboyProxy correctly! If you do not know how, check out <a href="https://femboy.us/proxy">the webpage.</a></h3>');
    res.status(404);
    res.end();
});

app.listen(globalOptions.PORT, () => {
    logger.success(`FemboyProxy has started on port ${globalOptions.PORT}!`);
    console.log(proxyOptions);
});