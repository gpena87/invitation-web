import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

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

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly spotifyAutoplayEmbedUrl: SafeResourceUrl =
    this.sanitizer.bypassSecurityTrustResourceUrl(environment.spotifyPlaylistEmbedUrl);
  protected readonly spotifyCollaborativePlaylistUrl = environment.spotifyCollaborativePlaylistUrl;

  openCollaborativePlaylist(): void {
    window.open(this.spotifyCollaborativePlaylistUrl, '_blank', 'noopener,noreferrer');
  }
}
