import Redis from "ioredis"

export const redisClient = new Redis({
    host: process.env.REDIS_HOST, 
    port: 6379,        
     password: process.env.REDIS_PASSWORD, 
});


redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});



