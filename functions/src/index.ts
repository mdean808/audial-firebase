import * as functions from 'firebase-functions';
import {getAllSpotifyPlaylistTracks, getSpotifyPlaylist, getSpotifyToken} from './api/spotify';
import {SpotifyPlaylistTracks, SpotifyToken} from './types';
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
  const playlistId = req.query.playlist as string || getDefaultPlaylistId(new Date().toDateString());
  res.json(await getTracks(playlistId));
});

export const daily = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const dateLocale = req.query.locale as string || new Date().toDateString();
  const playlistId = req.query.playlist as string || getDefaultPlaylistId(dateLocale);
  const random = req.query.random === 'true';
  const tracks = await getTracks(playlistId);
  // perform random index finding
  const index = generateRandomIndex(tracks.length, new Date(dateLocale), random);
  res.json({daily: tracks[index], tracks});
});

const getDefaultPlaylistId = (localeString: string) => {
  let id = '';
  const day = new Date(localeString).getDay();
  switch (day) {
    case 0:
      id = '37i9dQZF1DWSV3Tk4GO2fq'; // sunday
      break;
    case 1:
      id = '37i9dQZF1DX4UtSsGT1Sbe'; // monday
      break;
    case 2:
      id = '37i9dQZF1DX4o1oenSJRJd'; // tuesday
      break;
    case 3:
      id = '37i9dQZF1DWTJ7xPn4vNaz'; // wednesday
      break;
    case 4:
      id = '37i9dQZF1DXaKIA8E7WcJj'; // thursday
      break;
    case 5:
      id = '37i9dQZF1DX5Ejj0EkURtP'; // friday
      break;
    case 6:
      id = '37i9dQZF1DXbTxeAdrVG2l'; // saturday
      break;
    default:
      id = DEFAULT_PLAYLIST;
      break;
  }
  return id;
};

// const playlistPresets = ['37i9dQZF1DWSV3Tk4GO2fq', '37i9dQZF1DX4UtSsGT1Sbe', '37i9dQZF1DX4o1oenSJRJd', '37i9dQZF1DWTJ7xPn4vNaz', '37i9dQZF1DXaKIA8E7WcJj', '37i9dQZF1DX5Ejj0EkURtP', '37i9dQZF1DXbTxeAdrVG2l'];

const getTracks = async (playlistId: string) => {
/*
  let cached = false;
  if (playlistPresets.find((p) => playlistId === p)) cached = false;
  console.log(cached);
*/
  // update the cache from the db
  const cachedPlaylists = await getCachedPlaylists(playlistId);
  const cachedTracksByPlaylist = await getCachedTracksByPlaylist(playlistId);
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
    // remove tracks for better data management
    for (const playlist of cachedPlaylists) {
      playlist.tracks = <SpotifyPlaylistTracks><unknown>[];
    }
    await savePlaylistsToCache(cachedPlaylists);
  }
  if (!tracksInCache) {
    cachedTracksByPlaylist.push({playlist: playlist.id, tracks});
    await saveTracksByPlaylistToCache(cachedTracksByPlaylist);
  }
  return tracks;
};
