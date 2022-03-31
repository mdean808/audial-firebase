import type {SpotifyPlaylist, SpotifyToken} from '../types';
import axios from 'axios';
import {logger} from 'firebase-functions';

const SPOTIFY_FIELDS_QUERY = 'items(track(artists(href,id,name),href,id,name,preview_url)),tracks.next';

export const getSpotifyToken = async () => {
  const data = new URLSearchParams();
  data.append('grant_type', 'client_credentials');

  const headers = {
    'Authorization': 'Basic ' + process.env.SPOTIFY_AUTH,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const res = await axios({
    url: 'https://accounts.spotify.com/api/token',
    method: 'POST',
    data,
    headers,
  });
  const json = await res.data;
  const token: SpotifyToken = {
    token: json.access_token,
    expires_at: new Date(Date.now() + json.expires_in * 1000),
    type: json.type,
  };
  return token;
};

export const getSpotifyPlaylist = async (playlist: string, token: string) => {
  logger.info('Playlist not cached. Requesting it from Spotify...');
  const res = await axios( {
    url: `https://api.spotify.com/v1/playlists/${playlist}/?fields=description,href,id,images,name,tracks.${SPOTIFY_FIELDS_QUERY}`,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
    method: 'GET',
  });
  const json: SpotifyPlaylist = await res.data;
  return json;
};

export const getAllSpotifyPlaylistTracks = async (playlist: SpotifyPlaylist, token: string) => {
  logger.info('Playlist tracks not cached. Requesting them from Spotify...');
  let items = playlist.tracks.items;
  let next = playlist.tracks.next;
  while (next) {
    const res = await axios({
      url: next + `&fields=${SPOTIFY_FIELDS_QUERY},next`,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
      },
      method: 'GET',
    });
    console.log(res.data);
    const newTracks = await res.data;
    if (newTracks.error) {
      throw new Error(`Oops! ${newTracks.error.status}: ${newTracks.error.message}`);
    }
    items = items.concat(newTracks.items);
    next = newTracks.next;
    items.push(newTracks.items);
  }
  // make sure we only get ones with previews
  items = items.filter((i) => i.track && i.track.preview_url);
  return items.map((item) => item.track);
};
