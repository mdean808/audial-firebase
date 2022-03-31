import * as functions from 'firebase-functions';
import {getAllSpotifyPlaylistTracks, getSpotifyPlaylist, getSpotifyToken} from './api/spotify';
import {SpotifyPlaylist, SpotifyTrack, SpotifyToken} from './types';
import {generateRandomIndex} from './api/util';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

const DEFAULT_PLAYLIST = '5LQuCyn8AhcHpl31DgLaxL';

let spotifyAuth = <SpotifyToken>{};
// todo: setup cache in a actual CDN/DB
const cache = {
  playlists: [] as SpotifyPlaylist[],
  tracksByPlaylist: [] as {
    playlist: string, tracks: SpotifyTrack[]
  }[],
  dailyTrackIndex: -1,
};

export const tracks = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  const playlistId = req.query.playlist as string || DEFAULT_PLAYLIST;
  functions.logger.info('Requesting playlist tracks from', playlistId);
  res.json(await getTracks(playlistId));
});

export const daily = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  const playlistId = req.query.playlist as string || DEFAULT_PLAYLIST;
  const random = req.query.random === 'true';

  functions.logger.info('Requesting playlist daily ' + playlistId + (random ? 'with a random song.' : '.'));
  const tracks = await getTracks(playlistId);

  // perform random index finding
  const index = generateRandomIndex(tracks.length, random);

  // set the daily index if we aren't forcing randomness
  if (!random) {
    cache.dailyTrackIndex = index;
  }
  functions.logger.info('Random daily track:', tracks[index].name);
  res.json(tracks[index]);
});


const getTracks = async (playlistId: string) => {
  // load token from cache or update it if need be
  if (!spotifyAuth.token) {
    spotifyAuth = await getSpotifyToken();
  }
  if (new Date(spotifyAuth.expires_at) < new Date()) {
    spotifyAuth = await getSpotifyToken();
  }
  // load from cache or make requests
  const playlistInCache = cache.playlists.find((p) => p.id === playlistId);
  const tracksInCache = cache.tracksByPlaylist.find((t) => t.playlist == playlistId);
  const playlist = playlistInCache || await getSpotifyPlaylist(playlistId, spotifyAuth.token);
  const tracks = tracksInCache ? tracksInCache.tracks : await getAllSpotifyPlaylistTracks(playlist, spotifyAuth.token);

  // update the cache if need be
  if (!playlistInCache) {
    cache.playlists.push(playlist);
  }

  if (!tracksInCache) {
    cache.tracksByPlaylist.push({playlist: playlist.id, tracks});
  }
  return tracks;
};
