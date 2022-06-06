import * as functions from 'firebase-functions';
import {getAllSpotifyPlaylistTracks, getSpotifyPlaylist, getSpotifyToken} from './api/spotify';
import {SpotifyPlaylistTracks, SpotifyToken} from './types';
import {generateRandomIndex} from './api/util';
import {
  getCachedPlaylist,
  getCachedTracksByPlaylist,
  savePlaylistToCache,
  savePlaylistTracksToCache,
} from './api/cache';
import * as admin from 'firebase-admin';

const DEFAULT_PLAYLIST = '5LQuCyn8AhcHpl31DgLaxL';

let spotifyAuth = <SpotifyToken>{};

admin.initializeApp();

export const daily = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.query.playlist as string === 'undefined' || ((req.query.playlist as string).length !== 22 && (req.query.playlist as string).length !== 0)) {
    res.status(400).json({message: 'Invalid Spotify playlist.'});
  } else {
    const dateLocale = req.query.locale as string || new Date().toDateString();
    const playlistId = req.query.playlist as string || getDefaultPlaylistId(dateLocale);
    const random = req.query.random === 'true';
    const tracks = await getTracks(playlistId);
    // perform random index finding
    const index = generateRandomIndex(tracks.length, new Date(dateLocale), random);
    res.json({daily: tracks[index], tracks});
  }
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

const getTracks = async (playlistId: string) => {
  // update the cache from the db
  const cachedPlaylist = await getCachedPlaylist(playlistId);
  const cachedPlaylistTracks = await getCachedTracksByPlaylist(playlistId);
  // load token from cache or update it if need be
  if (!spotifyAuth.token) {
    spotifyAuth = await getSpotifyToken();
  }
  if (new Date(spotifyAuth.expires_at) < new Date()) {
    spotifyAuth = await getSpotifyToken();
  }
  // load from cache or make requests
  const playlist = cachedPlaylist || await getSpotifyPlaylist(playlistId, spotifyAuth.token);
  const tracks = cachedPlaylistTracks ? cachedPlaylistTracks.tracks : await getAllSpotifyPlaylistTracks(playlist, spotifyAuth.token);

  // update the cache if need be
  if (!cachedPlaylist) {
    // remove tracks for better data management
    playlist.tracks = <SpotifyPlaylistTracks><unknown>[];
    await savePlaylistToCache(playlist);
  }
  if (!cachedPlaylistTracks) {
    await savePlaylistTracksToCache({playlist: playlist.id, tracks});
  }
  return tracks;
};
