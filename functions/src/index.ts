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
      id = '37i9dQZF1DWSV3Tk4GO2fq';
      break;
    case 1:
      id = '37i9dQZF1DX4UtSsGT1Sbe';
      break;
    case 2:
      id = '37i9dQZF1DX4o1oenSJRJd';
      break;
    case 3:
      id = '37i9dQZF1DWTJ7xPn4vNaz';
      break;
    case 4:
      id = '37i9dQZF1DXaKIA8E7WcJj';
      break;
    case 5:
      id = '37i9dQZF1DX5Ejj0EkURtP';
      break;
    case 6:
      id = '37i9dQZF1DXbTxeAdrVG2l';
      break;
    default:
      id = DEFAULT_PLAYLIST;
      break;
  }
  return id;
};

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
