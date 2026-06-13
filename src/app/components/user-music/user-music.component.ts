import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const SPOTIFY_AUTOPLAY_EMBED_URL =
  'https://open.spotify.com/embed/playlist/6IOJDEwrxWtqhVu6YN4POd?si=4d06564ce3d94dfe?autoplay=1&utm_source=generator';

@Component({
  selector: 'app-user-music',
  standalone: true,
  imports: [],
  templateUrl: './user-music.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMusicComponent implements AfterViewInit, OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly spotifyAutoplayEmbedUrl: SafeResourceUrl =
    this.sanitizer.bypassSecurityTrustResourceUrl(SPOTIFY_AUTOPLAY_EMBED_URL);

  @ViewChild('spotifyPlayer', { static: true })
  private spotifyPlayer?: ElementRef<HTMLIFrameElement>;

  private readonly replayOnInteraction = (): void => {
    this.mountSpotifyEmbed(true);
  };

  ngAfterViewInit(): void {
    this.mountSpotifyEmbed();

    // Some browsers block autoplay with sound until the first interaction.
    window.addEventListener('pointerdown', this.replayOnInteraction, { once: true });
    window.addEventListener('keydown', this.replayOnInteraction, { once: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('pointerdown', this.replayOnInteraction);
    window.removeEventListener('keydown', this.replayOnInteraction);
  }

  private mountSpotifyEmbed(forceRetry = false): void {
    const iframe = this.spotifyPlayer?.nativeElement;

    if (!iframe) {
      return;
    }

    if (!forceRetry) {
      if (iframe.src !== SPOTIFY_AUTOPLAY_EMBED_URL) {
        iframe.src = SPOTIFY_AUTOPLAY_EMBED_URL;
      }
      return;
    }

    // Re-assigning the URL retries autoplay when interaction just happened.
    iframe.src = `${SPOTIFY_AUTOPLAY_EMBED_URL}&t=${Date.now()}`;
  }
}
