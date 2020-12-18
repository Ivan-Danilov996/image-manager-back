const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();

const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const public = path.join(__dirname, '/public')


const koaStatic = require('koa-static');
app.use(koaStatic(public));



app.use(koaBody({
    multipart: true,
    urlencoded: true
}));


app.use(async (ctx, next) => {
    const origin = ctx.request.get('Origin');
    if (!origin) {
        return await next();
    }
    const headers = { 'Access-Control-Allow-Origin': '*', };
    if (ctx.request.method !== 'OPTIONS') {
        ctx.response.set({ ...headers });
        try {
            return await next();
        } catch (e) {
            e.headers = { ...e.headers, ...headers };
            throw e;
        }
    }
    if (ctx.request.get('Access-Control-Request-Method')) {
        ctx.response.set({
            ...headers,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
        });
        if (ctx.request.get('Access-Control-Request-Headers')) {
            ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Allow-Request-Headers'));
        }
        ctx.response.status = 204; // No content
    }

});

const links = []


app.use(async ctx => {
    console.log(ctx.request.method)
    if(ctx.request.body.src) {
        console.log('dsdsdsdd')
        const filePath = `./public/${ctx.request.body.src}`
        fs.unlinkSync(filePath);
        links.forEach((link, index, array)=> {
            if(link === ctx.request.body.src) {
                array.splice(index, 1)
            }
        })
        ctx.response.body = links
    } 
    else if (ctx.request.method === 'GET') {
        ctx.response.body = links
        console.log(links)
    }
     else {
        const { name } = ctx.request;
        const { file } = ctx.request.files;
        const link = await new Promise((resolve, reject) => {
            const oldPath = file.path;
            const filename = uuid.v4();
            const newPath = path.join(public, filename);
    
            const callback = (error) => reject(error);
    
            const readStream = fs.createReadStream(oldPath);
            const writeStream = fs.createWriteStream(newPath);
    
            readStream.on('error', callback);
            writeStream.on('error', callback);
    
            readStream.on('close', () => {
                console.log('close');
                fs.unlink(oldPath, callback);
                resolve(filename);
            });
    
            readStream.pipe(writeStream);
        });
        links.push(link)
        ctx.response.body = {'link': link};
    }
    
});



const port = process.env.PORT || 7070;
const server = http.createServer(app.callback()).listen(port)



