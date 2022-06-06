# audial-firebase

This is the serverless "backend" for [audial](https://github.com/mdean808/audial).

## Endpoints

`/daily` - returns the daily random track, as well as every possible track from that playlist for searching.
```js
fetch(`http://localhost:5000/daily?playlist=${spotify.playlist.id}&random=${true}&locale=${date.string}`, 
  { method: 'GET' }
);
```
You can generate a locale string using `new Date().toDateString();`

## Setup

### Firebase
Setup firebase using their [CLI](https://firebase.google.com/docs/cli)

Login to your firebase account (optional)
```bash
firebase login
```

Test changes on your local instance
```bash
firebase emulators:start --only functions,database
```


Deploy the functions and database to your app
```bash
firebase deploy --only functions,database
```

### Spotify

Generate a Spotify App from their [developer dashboard](https://developer.spotify.com/dashboard/applications)

Copy the Client ID and Client Secret into a `.env` file in the functions directory.

```dotenv
SPOTIFY_CLIENT=''
SPOTIFY_SECRET=''
```
