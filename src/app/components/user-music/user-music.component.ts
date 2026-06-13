import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const DEFAULT_SPOTIFY_PLAYLIST_EMBED_URL =
  'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&autoplay=1';

@Component({
  selector: 'app-user-music',
  standalone: true,
  imports: [],
  templateUrl: './user-music.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMusicComponent {
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly spotifyPlaylistUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    DEFAULT_SPOTIFY_PLAYLIST_EMBED_URL
  );
}
