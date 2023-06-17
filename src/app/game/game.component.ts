import { Component, OnInit } from '@angular/core';
import { GameService } from '../../services/game';
import { Howl } from 'howler';
import { Router } from '@angular/router';

interface Artist {
  id?: string;
  name: string;
  image: string;
}

interface Track {
  id?: number;
  artistId?: string;
  name: string;
  preview: string;
}

interface GameData {
  winningArtist: Artist;
  artistSongs: Track[];
  artistsArray: Artist[];
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  gameData!: GameData;
  winningArtist: Artist | undefined = undefined;
  playerSelectedArtist: Artist | undefined = undefined
  songs!: Track[];
  artists: Artist[] = [];

  currentSong: Howl | undefined = undefined
  currentPlayingSong: Track | undefined = undefined;
  selectedPreview: string = ''
  gameOver = false;
  isWinner = false;
  numGuesses: number = 0
  isStillPlaying: boolean = false

  constructor(private gameService: GameService, private router: Router){}

  ngOnInit() {
    this.gameService.artistsArray.subscribe(artists => this.artists = artists);
    this.gameService.artistSongs.subscribe(songs => this.songs = songs);
    this.gameService.selectedArtist.subscribe(artist => this.winningArtist = artist);
    console.log('Game Service (songs): ', this.songs)
    if(!this.artists.length) {
      const gameDataString = localStorage.getItem('gameData');
      if (gameDataString) {
        this.gameData = JSON.parse(gameDataString);
        this.winningArtist = this.gameData.winningArtist;
        this.songs = this.gameData.artistSongs;
        this.artists = this.gameData.artistsArray;
        console.log('Local Storage (songs): ', this.songs)
      }
      this.gameOver = false;
      this.isWinner = false;
    }
    this.shuffle(this.artists)
    if(localStorage.getItem('gameGuesses')) {
      this.numGuesses = JSON.parse(localStorage.getItem('gameGuesses') || '{}');
    } else {
      this.numGuesses = this.artists.length < 4 ? 1 : 2
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

  playSong(selectedSong: Track) {
    this.currentPlayingSong = selectedSong;
    this.selectedPreview = selectedSong?.preview
    this.playTracks()
  }

  playTracks() {
    if(this.currentSong?.playing()) {
      this.currentSong.stop()
    }
    this.currentSong = new Howl({
      src: [this.selectedPreview],
      html5: true,
      onend: () => {
        console.log('Finished')
      },
      onplayerror: (_, msg) => {
        console.log('Howl ERROR: ' + msg)
      }
    })
    console.log(this.currentSong)
    this.currentSong.play()
  }

  stopSong() {
    this.currentSong?.stop()
  }

  onArtistSelected(artist: Artist) {
    this.playerSelectedArtist = artist;
  }

  checkAnswer() {
    this.stopSong()
    this.numGuesses--
    console.log(this.numGuesses)
    if (this?.playerSelectedArtist?.id === this?.winningArtist?.id) {
      this.gameOver = true;
      this.isWinner = true;
      localStorage.removeItem('gameGuesses')
    } else {
      if(this.numGuesses > 0) {
        this.isStillPlaying = true
        const obj = { numGuesses: this.numGuesses, isStillPlaying: this.isStillPlaying }
        localStorage.setItem('gameGuesses', JSON.stringify(obj));
      } else {
        this.gameOver = true;
        this.isWinner = false;
        localStorage.removeItem('gameGuesses')
      }
    }
  }

  togglePlayStop(song: Track) {
    if (this.currentPlayingSong === song && this.currentSong?.playing()) {
      // If the song is currently playing, stop it
      this.stopSong();
    } else {
      // If the song is not playing, play it
      this.playSong(song);
    }
  }

  restartGame() {
    localStorage.removeItem('gameData');
    this.ngOnInit();
    this.router.navigate(['/']);
  }
}
