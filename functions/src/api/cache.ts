import * as admin from "firebase-admin";
import { SpotifyPlaylist, SpotifyTrack } from "../types";
import { logger } from "firebase-functions";

export const getCachedPlaylist = async (id: string) => {
  logger.info("Getting cached playlist from db:", id);
  try {
    const ref = admin.database().ref("playlists");
    const res = await ref.orderByKey().ref.orderByChild("id").equalTo(id).get();
    // const res = await ref.get();
    const playlists: SpotifyPlaylist[] = [];
    res.forEach((snapshot) => {
      playlists.push(snapshot.val());
    });
    return playlists ? (playlists[0] as SpotifyPlaylist) : null;
  } catch (e) {
    logger.info(e);
    throw e;
  }
};

export const clearCache = async () => {
  logger.info("Clearing the cache!");
  await admin.database().ref("playlists").set({});
  await admin.database().ref("tracksByPlaylist").set({});
};

export const savePlaylistToCache = async (playlist: SpotifyPlaylist) => {
  // don't save to cache if the playlist has no tracks
  if (playlist?.tracks?.items?.length < 1) return;
  logger.info("Adding playlist", playlist.id, "to cache.");
  const ref = admin.database().ref("playlists");
  const res = await ref
    .orderByKey()
    .ref.orderByChild("id")
    .equalTo(playlist.id)
    .get();
  if (res.val()) return;
  else await ref.push(playlist);
};

export const getCachedTracksByPlaylist = async (id: string) => {
  logger.info("Getting cached tracks for playlist from db:", id);
  const ref = admin.database().ref("tracksByPlaylist");
  const res = await ref
    .orderByKey()
    .ref.orderByChild("playlist")
    .equalTo(id)
    .get();
  // const res = await ref.get();
  const tracks: { playlist: string; tracks: SpotifyTrack[] }[] = [];
  res.forEach((snapshot) => {
    tracks.push(snapshot.val());
  });
  return tracks
    ? (tracks[0] as { playlist: string; tracks: SpotifyTrack[] })
    : null;
};

export const savePlaylistTracksToCache = async (trackSet: {
  playlist: string;
  tracks: SpotifyTrack[];
}) => {
  // don't save to cache if the playlist has no tracks
  if (trackSet?.tracks?.length < 1) return;
  logger.info("Adding tracks for playlist", trackSet.playlist, " to cache.");
  const ref = admin.database().ref("tracksByPlaylist");
  const res = await ref
    .orderByKey()
    .ref.orderByChild("playlist")
    .equalTo(trackSet.playlist)
    .get();
  if (res.val()) return;
  else await ref.push(trackSet);
};
