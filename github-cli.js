const username = process.argv[2]
if (!username) {
    process.exit(1);
}
console.log(`Fetching activity for user: ${username}`)
const https = require('https')
const url = `https://api.github.com/users/${username}/events`
const options = {
    headers: {
        'User-Agent': 'github-acitivty-cli'
    }
}
function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}
https.get(url, options, (res) => {
    console.log(`Status Code: ${res.statusCode}`)
    let data = ''
    if (res.statusCode === 404) {
        console.error("User not found. Please check the GitHub username.");
        process.exit(1);
    } else if (res.statusCode === 403) {
        console.error("API rate limit exceeded. Try again later.");
        process.exit(1);
    } else if (res.statusCode !== 200) {
        console.error(`Failed to fetch data. Status code: ${res.statusCode}`);
        process.exit(1);
    }
    res.on('data', chunk => {
        data += chunk
    })
    res.on('end', () => {
        try {
            const events = JSON.parse(data);
            console.log(events);
            for (let event of events) {
                const repo = event.repo.name;
                switch (event.type) {
                    case 'PushEvent':
                        const commitCount = event.payload.commits?.length || 0;
                        console.log(`Pushed ${commitCount} commit(s) to ${repo}`);
                        break;
                    case 'IssuesEvent':
                        const issueAction = event.payload.action;
                        console.log(`${capitalize(issueAction)} an issue in ${repo}`);
                        break;
                    case 'WatchEvent':
                        console.log(`Starred ${repo}`);
                        break;
                    case 'CreateEvent':
                        const refType = event.payload.ref_type;
                        console.log(`Created ${refType} in ${repo}`);
                        break;
                    default:
                        break;
                }
            }
        } catch (e) {
            console.error("Error parsing JSON", e.message);
        }
    })
}).on('error', (e) => {
    console.error("Error fetching data", e.message)
})