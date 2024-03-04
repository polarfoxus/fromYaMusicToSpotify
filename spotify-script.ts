import axios, { AxiosResponse } from 'axios';
import express from 'express';
import * as fs from 'fs/promises';
import { config } from 'dotenv';

config();
// Replace these with your Spotify Developer App credentials
const clientId = process.env.CLIENT_ID || '';
const clientSecret = process.env.CLIENT_SECRET || '';
const redirect_uri = process.env.REDIRECT_URI || '';
const csvFilePath = process.env.CSV_FILE_PATH || '';
const playlistName = process.env.PLAYLIST_NAME || '';
const accessToken = process.env.ACCESS_TOKEN || '';
const refreshToken = process.env.REFRESH_TOKEN || '';
const playlistId = process.env.PLAYLIST_ID || '';

var app = express();

/**
 * 
 
async function getAccessToken() {
    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'client_credentials',
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                },
            }
        );
        console.log(response.data.access_token)
        return response.data.access_token;
    } catch (error:any) {
        console.error('Error in getAccessToken:', error.response ? error.response.data : error.message);
        throw error;
    }
}
*/

/**async function createPlaylist(accessToken: any, userId: any) {
    try {
        const response = await axios.post(
            `https://api.spotify.com/v1/users/${userId}/playlists`,
            {
                name: playlistName,
                public: false,
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data.id;
    } catch (error:any) {
        console.error('Error in createPlaylist:', error.response ? error.response.data : error.message);
        throw error;
    }
}
*/

async function searchTrack(accessToken: any, artist: string, trackName: string) {
    try {
        const response = await axios.get(
            `https://api.spotify.com/v1/search`,
            {
                params: {
                    q: `track:${trackName} artist:${artist}`,
                    type: 'track',
                    limit: 1,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const firstTrack = response.data.tracks?.items[0];
        console.log(firstTrack);
        return firstTrack ? firstTrack.id : null;
    } catch (error: any) {
        console.error('Error in searchTrack:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function addTrackToPlaylist(accessToken: any, playlistId: any, trackId: any) {
    try {
        await axios.post(
            `https://api.spotify.com/v1/playlists/1yDYKzpaFaumbrVRX2S303/tracks`,
            {
                uris: [`spotify:track:${trackId}`],
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error: any) {
        console.error('Error in addTrackToPlaylist:', error.response ? error.response.data : error.message);
        throw error;
    }
}


async function processCSVFile() {
    try {
        //const { accessToken, userId } = await getAccessToken();
        const playlistId = "1yDYKzpaFaumbrVRX2S303";

        const fileContent = await fs.readFile(csvFilePath, 'utf-8');
        const lines = fileContent.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const [artist, trackName] = lines[i].trim().split(',');

            if (artist && trackName) {
                try {
                    const trackId = await searchTrack(accessToken, artist, trackName);

                    if (trackId) {
                        await addTrackToPlaylist(accessToken, playlistId, trackId);
                        console.log(`Track added to the playlist: ${artist} - ${trackName}`);
                    } else {
                        console.log(`Track not found on Spotify: ${artist} - ${trackName}`);
                    }
                } catch (error) {
                    // Ошибка при обработке конкретной строки
                    console.error(`Error processing line ${i + 1}:`, error instanceof Error ? error.message : error);
                }

                // Добавляем задержку в 1 секунду перед следующей итерацией
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } catch (error) {
        // Ошибка при чтении CSV файла или другие необработанные ошибки
        console.error('Unexpected error:', error instanceof Error ? error.message : error);
    }
}

processCSVFile();