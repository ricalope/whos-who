import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import fetchFromSpotify, { request } from "../../services/api";
import { Howl } from 'howler';
import { GameService } from '../../services/game';

const AUTH_ENDPOINT =
  "https://nuod0t2zoe.execute-api.us-east-2.amazonaws.com/FT-Classroom/spotify-auth-token";
const TOKEN_KEY = "whos-who-access-token";

export interface Artist {
  id: string
  name: string
  image: string
}

export interface Track {
  id: number
  artistId: string
  name: string
  preview: string
}

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})

export class HomeComponent implements OnInit {
  constructor(private gameData: GameService, private router: Router) {}

  genres: String[] = ["House", "Alternative", "J-Rock", "R&B"];
  selectedGenre: String = "";
  authLoading: boolean = false;
  configLoading: boolean = false;
  token: String = "";

  artistsArray: Artist[] = [];
  artistSongs: Track[] = [];
  selectedArtist: Artist | undefined = undefined;
  selectedSong: Track | undefined = undefined;
  selectedPreview: string = ''
  currentSong: Howl | undefined = undefined
  trackNumber: number = 0
  error: string | undefined;
  temp = undefined
  tracksLoading: boolean | undefined = undefined

  numArtistsChosen: number = 2
  numTracksChosen: number = 1

  numSelectionArtists: number[] = [2, 3, 4];
  numSelectionSongs: number[] = [1, 2, 3];

  ngOnInit(): void {
    this.authLoading = true;
    const storedTokenString = localStorage.getItem(TOKEN_KEY);
    if (storedTokenString) {
      const storedToken = JSON.parse(storedTokenString);
      if (storedToken.expiration > Date.now()) {
        console.log("Token found in localstorage");
        this.authLoading = false;
        this.token = storedToken.value;
        this.loadGenres(storedToken.value);
        return;
      }
    }
    console.log("Sending request to AWS endpoint");
    request(AUTH_ENDPOINT).then(({ access_token, expires_in }) => {
      const newToken = {
        value: access_token,
        expiration: Date.now() + (expires_in - 20) * 1000,
      };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(newToken));
      this.authLoading = false;
      this.token = newToken.value;
      this.loadGenres(newToken.value);
    });
  }

  // load all fetched genre's from spotify
  loadGenres = async (t: any) => {
    this.configLoading = true;
    const response = await fetchFromSpotify({
      token: t,
      endpoint: "recommendations/available-genre-seeds",
    });
    console.log(response);
    this.genres = response.genres;
    this.configLoading = false;
  };

  // set the number of artists in guessing pool
  setNumArtists(numArtistsChosen: number) {
    this.numArtistsChosen = numArtistsChosen
  }

  // set the number of preview tracks to be played on game screen
  setNumTracks(numTracksChosen: number) {
    this.numTracksChosen = numTracksChosen
  }

  // selecting from dropdown will set the specified genre
  setGenre(selectedGenre: any) {
    this.selectedGenre = selectedGenre;
    console.log(this.selectedGenre);
    console.log(TOKEN_KEY);
    this.getArtistData(this.token, selectedGenre)
    this.error = undefined
  }

  fetchArtists = async (t: any, genre: string) => {
    const res = await fetchFromSpotify({
      token: t,
      endpoint: `search?q=genre:${genre}&type=artist&limit=50`
    })
    const artistArray = res.artists.items.map((artist: any) => {
      return {
        id: artist.id,
        name: artist.name,
        image: artist.images[0].url
      }
    })
    return artistArray
  }

  checkTracksExist = async (t: any, artistId: string) => {
    const res = await fetchFromSpotify({
      token: t,
      endpoint: `artists/${artistId}/top-tracks?market=US`
    })
    if(!res.tracks[0].preview_url) {
      return false
    } else {
      return true
    }
  }

  shuffle(array: any[]) {
    for(let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
    return array
  }

  // once a genre has been picked we will then call
  // this method to fetch top artists by the selected genre
  getArtistData = async (t: any, genre: string) => {
    this.tracksLoading = true
    let artistArray = await this.fetchArtists(t, genre)
    this.shuffle(artistArray)
    for(let i = 0; i < artistArray.length; i++) {
      if(await this.checkTracksExist(t, artistArray[i].id)) {
        artistArray = artistArray.slice(i)
        break
      }
    }
    // then we take previously selected number of artists and slice array using variable
    this.artistsArray = artistArray.slice(0, this.numArtistsChosen);
    this.gameData.updateArtistsArray(artistArray.slice(0, this.numArtistsChosen));
    // then select last element (since we are shuffling the array this should always produce diff results)
    this.selectedArtist = this.artistsArray[0]
    this.gameData.updateSelectedArtist(this.artistsArray[0])
    // then call next method to get the selected artists songs
    this.getArtistTracks(t, this.selectedArtist.id)
    this.tracksLoading = false;
  }

  getArtistTracks = async (t: any, artistId: string) => {
    const res = await fetchFromSpotify({
      token: t,
      endpoint: `artists/${artistId}/top-tracks?market=US`
    });
    const data = res.tracks.map((track: any, index: number) => {
      return {
        id: index + 1,
        artistId: track.artists[0].id,
        name: track.name,
        preview: track?.preview_url
      }
    })
    this.shuffle(data)
    this.artistSongs = data.slice(0, this.numTracksChosen)
    this.gameData.updateArtistSongs(data.slice(0, this.numTracksChosen))
  }

  onSubmit() {
    console.log(this.selectedGenre)
    if(!this.selectedGenre || !this.artistsArray.length) {
      this.error = this.artistsArray.length ? '* field required' : 'Spotify has no artists listed for that genre, please select another'
      return
    }
    const obj = {
      winningArtist: this.selectedArtist,
      artistSongs: this.artistSongs,
      artistsArray: this.artistsArray
    }
    localStorage.setItem('gameData', JSON.stringify(obj))
    this.router.navigateByUrl('/game')
  }

}
