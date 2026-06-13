import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const SPOTIFY_AUTOPLAY_EMBED_URL =
  'https://open.spotify.com/embed/playlist/6IOJDEwrxWtqhVu6YN4POd?autoplay=1&utm_source=generator';

@Component({
  selector: 'app-user-music',
  standalone: true,
  imports: [],
  templateUrl: './user-music.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMusicComponent {
  title = signal('Nuestra playlist de Spotify');
  subtitle = signal('Hemos creado una playlist especial en Spotify con canciones que significan mucho para nosotros. ¡Esperamos que disfrutes escuchándola tanto como nosotros disfrutamos seleccionando cada canción!');
  spotifyUrl = signal(SPOTIFY_AUTOPLAY_EMBED_URL);

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly spotifyAutoplayEmbedUrl: SafeResourceUrl =
    this.sanitizer.bypassSecurityTrustResourceUrl(this.spotifyUrl());
}
