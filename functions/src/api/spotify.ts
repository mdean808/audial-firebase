import type {SpotifyPlaylist, SpotifyToken, SpotifyTrack} from '../types';
import seedrandom from 'seedrandom';
import random from 'random';
import {daysBetweenDates} from './util';
import axios from 'axios';

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
  const res = await axios( {
    url: `https://api.spotify.com/v1/playlists/${playlist}/`,
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
  let items = playlist.tracks.items;
  let next = playlist.tracks.next;
  while (next) {
    const res = await axios({
      url: next,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
      },
      method: 'GET',
    });
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

export const getRandomTrack = async (tracks: SpotifyTrack[], forceRandom?: boolean) => {
  const date = new Date();
  const forceRand = forceRandom ? Math.random() * 10 * (Math.random() + 20) : 0;
  random.use(seedrandom(daysBetweenDates(date, new Date('15/01/2002')) + forceRand));
  const rand = random.int(0, tracks.length - 1);
  return tracks[rand];
};
