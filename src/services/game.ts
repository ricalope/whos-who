import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { Artist, Track } from 'src/app/home/home.component';

@Injectable({
  providedIn: 'root'
})

export class GameService {

  private artistsArraySource = new BehaviorSubject<Artist[]>([]);
  artistsArray = this.artistsArraySource.asObservable();

  private artistSongsSource = new BehaviorSubject<Track[]>([]);
  artistSongs = this.artistSongsSource.asObservable();

  private selectedArtistSource = new BehaviorSubject<Artist | undefined>(undefined);
  selectedArtist = this.selectedArtistSource.asObservable();

  updateArtistsArray(artists: Artist[]) {
    this.artistsArraySource.next(artists);
  }

  updateArtistSongs(songs: Track[]) {
    this.artistSongsSource.next(songs);
  }

  updateSelectedArtist(artist: Artist) {
    this.selectedArtistSource.next(artist);
  }

}
