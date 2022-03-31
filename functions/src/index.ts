import * as functions from 'firebase-functions';
import {getAllSpotifyPlaylistTracks, getSpotifyPlaylist, getSpotifyToken} from './api/spotify';
import {SpotifyToken} from './types';
import {generateRandomIndex} from './api/util';
import {
  getCachedPlaylists,
  getCachedTracksByPlaylist,
  savePlaylistsToCache,
  saveTracksByPlaylistToCache,
} from './api/cache';
import * as admin from 'firebase-admin';

const DEFAULT_PLAYLIST = '5LQuCyn8AhcHpl31DgLaxL';

let spotifyAuth = <SpotifyToken>{};

admin.initializeApp();

export const tracks = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const playlistId = req.query.playlist as string || DEFAULT_PLAYLIST;
  res.json(await getTracks(playlistId));
});

export const daily = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const playlistId = req.query.playlist as string || DEFAULT_PLAYLIST;
  const random = req.query.random === 'true';
  const tracks = await getTracks(playlistId);
  // perform random index finding
  const index = generateRandomIndex(tracks.length, random);
  res.json(tracks[index]);
});


const getTracks = async (playlistId: string) => {
  // update the cache from the db
  const cachedPlaylists = await getCachedPlaylists();
  const cachedTracksByPlaylist = await getCachedTracksByPlaylist();
  // load token from cache or update it if need be
  if (!spotifyAuth.token) {
    spotifyAuth = await getSpotifyToken();
  }
  if (new Date(spotifyAuth.expires_at) < new Date()) {
    spotifyAuth = await getSpotifyToken();
  }
  // load from cache or make requests
  const playlistInCache = cachedPlaylists.find((p) => p.id === playlistId);
  const tracksInCache = cachedTracksByPlaylist.find((t) => t.playlist == playlistId);
  const playlist = playlistInCache || await getSpotifyPlaylist(playlistId, spotifyAuth.token);
  const tracks = tracksInCache ? tracksInCache.tracks : await getAllSpotifyPlaylistTracks(playlist, spotifyAuth.token);

  // update the cache if need be
  if (!playlistInCache) {
    cachedPlaylists.push(playlist);
    await savePlaylistsToCache(cachedPlaylists);
  }
  if (!tracksInCache) {
    cachedTracksByPlaylist.push({playlist: playlist.id, tracks});
    await saveTracksByPlaylistToCache(cachedTracksByPlaylist);
  }
  return tracks;
};
