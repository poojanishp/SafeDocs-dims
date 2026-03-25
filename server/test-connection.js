import http from 'http';

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/documents/all', // Just a test endpoint
    method: 'GET',
    timeout: 2000 // 2 seconds timeout
};

console.log(`Attempting to connect to http://localhost:3001...`);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log('Server is reachable!');
    process.exit(0);
});

req.on('error', (e) => {
    console.error(`PROBLEM WITH REQUEST: ${e.message}`);
    console.log("SUGGESTION: The backend server is likely NOT running or crashed.");
    process.exit(1);
});

req.on('timeout', () => {
    console.error("REQUEST TIMED OUT");
    req.destroy();
});

req.end();
