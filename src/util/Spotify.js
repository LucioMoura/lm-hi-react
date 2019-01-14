
let spotifyAccesToken = '9e19dd058c2e42fd8ba7cae9c018006e';
const clientId = 'ef099452e267454ca4ebf1d0d992397e';
const redirectUri = 'http://localhost:3000/callback/';

const Spotify = {

  getAccessToken()
  {
    if(spotifyAccesToken)
    {
      return spotifyAccesToken;
    }
    const accessToken = window.location.href.match(/access_token=([^&]*)/);
    const expiresIn = window.location.href.match(/expires_in=([^&]*)/);
    if(accessToken && expiresIn)
    {
      spotifyAccesToken = accessToken[1];
      let expiryTime = Number(expiresIn[1]);
      window.setTimeout(() => spotifyAccesToken = '', expiryTime * 1000);
      window.history.pushState('Access Token', null, '/');
      return spotifyAccesToken;
    }
    else
    {
      window.location = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=playlist-modify-public&response_type=token`;
    }
  },

 
  async search(term)
  {
    try{
      const token = this.getAccessToken();
      const response = await fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`,
                          {
                            headers : {
                              Authorization: `Bearer ${token}`
                            }
                          }
                        );
      const jsonResponse = await response.json();
      if(jsonResponse.tracks && jsonResponse.tracks.items)
      {
        let searchResults = jsonResponse.tracks.items.map((track, index)=>{
          return {  id: track.id,
                    name: track.name,
                    artist: track.artists[0].name,
                    album: track.album.name,
                    uri: track.uri
                  };
        });
        return searchResults;
      };
    }
    catch(e)
    {
      console.log("Error occured in search");
    }
  
    return [];
  },

  
  async savePlaylist(name, trackURIs)
  {
    try{
      if(name && trackURIs)
      {
        const token = this.getAccessToken();
        const userId = await this.getUserId(token);
        if(userId)
        {
          //create Playlist
          const playlistID = await this.createPlayList(token, userId, name);
          if(playlistID)
          {
            //add tracks
            return await this.addTracks(token, userId, playlistID, trackURIs);
          }
        };
      }
    }
    catch(e)
    {
      console.log("Error occure while saving the playlist");
      console.log(e);
    }
    return false;
  },


  async getUserId(token)
  {
    const headers = {
      Authorization: `Bearer ${token}`
    };
    let userId = '';
    const response = await fetch('https://api.spotify.com/v1/me',
                        {
                          headers : headers
                        }
                      );
    const jsonResponse = await response.json();
    if(jsonResponse)
    {
      userId = jsonResponse.id;
    }
    return userId;
  },

  async createPlayList(token, userId, name)
  {
    const headers = {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    };

    let playlistID = '';
    const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`,
                        {
                          body: JSON.stringify({name: name}),
                          headers : headers,
                          method: 'POST'
                        }
                      );
    const jsonResponse = await response.json();
    if(jsonResponse)
    {
      playlistID = jsonResponse.id;
    }
    return playlistID;
  },

// Add tracks to an existing playlist.
  async addTracks(token, userId, playlistID, trackURIs)
  {
    const headers = {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    };
    const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistID}/tracks`,
                        {
                          body: JSON.stringify(trackURIs),
                          headers : headers,
                          method: 'POST'
                        }
                      );
    const jsonResponse = await response.json();
    if(jsonResponse && jsonResponse.snapshot_id)
    {
      console.log("tracks added successfully");
      return true;
    }
    return false;
  }
};
export default Spotify;
