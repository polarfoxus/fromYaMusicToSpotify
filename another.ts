import express from 'express';
import axios from 'axios';
import * as child_process from 'child_process';
import { config } from 'dotenv';
import { promisify } from 'util';

const open = promisify(child_process.exec);
config();

const clientId = process.env.CLIENT_ID || '';
const clientSecret = process.env.CLIENT_SECRET || '';
const redirect_uri = process.env.REDIRECT_URI || '';

const authorizationEndpoint = 'https://accounts.spotify.com/authorize';
const tokenEndpoint = 'https://accounts.spotify.com/api/token';

const app = express();
const port = 3000;

app.get('/login', async (req, res) => {
    const queryParams = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirect_uri,
        scope: 'user-read-private user-read-email playlist-modify-public',
    });

    const authorizationUrl = `${authorizationEndpoint}?${queryParams}`;

    console.log(`Please authorize the app by visiting: ${authorizationUrl}`);

    // ќткрываем браузерное окно

    try {
        await open(authorizationUrl);
        res.send('Check the console for the authorization link.');
    } catch (error) {
        console.error('Failed to open the browser:', error);
        res.status(500).send('Failed to open the browser. Check the console for details.');
    }
});

app.get('/callback', async (req, res) => {
    const code = req.query.code as string;

    try {
        const tokenResponse = await axios.post(
            tokenEndpoint,
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirect_uri,
                client_id: clientId,
                client_secret: clientSecret,
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;
        const refreshToken = tokenResponse.data.refresh_token;

        console.log('Authentication successful');
        console.log(`Access Token: ${accessToken}`);
        console.log(`Refresh Token: ${refreshToken}`);

        // “еперь у вас есть accessToken и refreshToken, которые вы можете использовать дл€ доступа к API Spotify

        res.send('Authentication successful. You can close this window.');
    } catch (error: any) {
        console.error('Authentication failed', error.message);
        res.status(500).send('Authentication failed. Check the console for details.');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});