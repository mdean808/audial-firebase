import * as admin from 'firebase-admin';
import {SpotifyPlaylist, SpotifyTrack} from '../types';

export const getCachedPlaylists = async (id: string) => {
  const ref = admin.database().ref('playlists');
  const res = await ref.orderByChild('id').equalTo(id).get();
  return res.val() as SpotifyPlaylist[] || [];
};

export const savePlaylistsToCache = async (playlists: SpotifyPlaylist[]) => {
  const ref = admin.database().ref('playlists');
  await ref.set(playlists);
};

export const getCachedTracksByPlaylist = async (id: string) => {
  const ref = admin.database().ref('tracksByPlaylist');
  const res = await ref.orderByChild('playlist').equalTo(id).get();
  return res.val() as {playlist: string, tracks: SpotifyTrack[]}[] || [];
};

export const saveTracksByPlaylistToCache = async (tracks: {playlist: string, tracks: SpotifyTrack[]}[]) => {
  const ref = admin.database().ref('tracksByPlaylist');
  await ref.set(tracks);
};
