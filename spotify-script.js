"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs/promises"));
// Replace these with your Spotify Developer App credentials
const clientId = '147bbbd041a340af9f76df11ae9db942';
const clientSecret = 'e80b205b3d924689b45f6ee15ce8804a';
// Replace this with the path to your CSV file
const csvFilePath = 'D:\Desktop\likedList.csv';
// Replace this with your Spotify playlist name
const playlistName = 'PlayList from YaM';
function getAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post('https://accounts.spotify.com/api/token', new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return response.data.access_token;
        }
        catch (error) {
            logError('getAccessToken', error);
            throw error;
        }
    });
}
function createPlaylist(accessToken) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post('https://api.spotify.com/v1/me/playlists', {
                name: playlistName,
                public: false,
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data.id;
        }
        catch (error) {
            logError('createPlaylist', error);
            throw error;
        }
    });
}
function searchTrack(accessToken, artist, trackName) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(`https://api.spotify.com/v1/search`, {
                params: {
                    q: `track:${trackName} artist:${artist}`,
                    type: 'track',
                    limit: 1,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const firstTrack = (_a = response.data.tracks) === null || _a === void 0 ? void 0 : _a.items[0];
            return firstTrack ? firstTrack.id : null;
        }
        catch (error) {
            logError('searchTrack', error);
            // ������� ����� ��� ����� ���������� ������� ������
            console.error(`searchTrack error details:`, error.response ? error.response.data : error.message);
            throw error;
        }
    });
}
function addTrackToPlaylist(accessToken, playlistId, trackId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield axios_1.default.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                uris: [`spotify:track:${trackId}`],
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
        }
        catch (error) {
            logError('addTrackToPlaylist', error);
            throw error;
        }
    });
}
function logError(action, error) {
    console.error(`Error in action '${action}':`, error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
    }
}
function processCSVFile() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const accessToken = yield getAccessToken();
            const playlistId = yield createPlaylist(accessToken);
            const fileContent = yield fs.readFile(csvFilePath, 'utf-8');
            const lines = fileContent.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const [artist, trackName] = lines[i].trim().split(',');
                if (artist && trackName) {
                    try {
                        const trackId = yield searchTrack(accessToken, artist, trackName);
                        if (trackId) {
                            yield addTrackToPlaylist(accessToken, playlistId, trackId);
                            console.log(`Track added to the playlist: ${artist} - ${trackName}`);
                        }
                        else {
                            console.log(`Track not found on Spotify: ${artist} - ${trackName}`);
                        }
                    }
                    catch (error) {
                        // ������ ��� ��������� ���������� ������
                        console.error(`Error processing line ${i + 1}:`, error instanceof Error ? error.message : error);
                    }
                    // �������� �������� � 1 ������� ����� ���������
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        catch (error) {
            // ������ ��� ������ CSV ����� ��� ������ �������������� ������
            console.error('Unexpected error:', error instanceof Error ? error.message : error);
        }
    });
}
processCSVFile();
//# sourceMappingURL=spotify-script.js.map