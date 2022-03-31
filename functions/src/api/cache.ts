import * as admin from 'firebase-admin';
import {SpotifyPlaylist, SpotifyTrack} from '../types';

export const getCachedPlaylists = async () => {
  const ref = admin.database().ref('playlists');
  return (await ref.get()).val() as SpotifyPlaylist[] || [];
};

export const savePlaylistsToCache = async (playlists: SpotifyPlaylist[]) => {
  const ref = admin.database().ref('playlists');
  await ref.set(playlists);
};

export const getCachedTracksByPlaylist = async () => {
  const ref = admin.database().ref('tracksByPlaylist');
  return (await ref.get()).val() as {playlist: string, tracks: SpotifyTrack[]}[] || [];
};

export const saveTracksByPlaylistToCache = async (tracks: {playlist: string, tracks: SpotifyTrack[]}[]) => {
  const ref = admin.database().ref('tracksByPlaylist');
  await ref.set(tracks);
};
