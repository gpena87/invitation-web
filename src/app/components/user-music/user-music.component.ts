import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-user-music',
  imports: [],
  templateUrl: './user-music.component.html',
  styleUrls: ['./user-music.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMusicComponent {
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly spotifyPlaylistUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://open.spotify.com/embed/playlist/6IOJDEwrxWtqhVu6YN4POd?utm_source=generator'
  );
}
