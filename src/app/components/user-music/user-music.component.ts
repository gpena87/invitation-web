import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit,
  inject, signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { SpotifyService, SpotifyTrack } from '../../services/spotify.service';

const SPOTIFY_AUTOPLAY_EMBED_URL =
  'https://open.spotify.com/embed/playlist/6IOJDEwrxWtqhVu6YN4POd?autoplay=1&utm_source=generator';

@Component({
  selector: 'app-user-music',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-music.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMusicComponent implements OnInit {
  title = signal('Nuestra playlist de Spotify');
  subtitle = signal('Hemos creado una playlist especial en Spotify con canciones que significan mucho para nosotros. ¡Esperamos que disfrutes escuchándola tanto como nosotros disfrutamos seleccionando cada canción!');

  private readonly sanitizer = inject(DomSanitizer);
  private readonly fb = inject(FormBuilder);
  private readonly spotify = inject(SpotifyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly spotifyAutoplayEmbedUrl: SafeResourceUrl =
    this.sanitizer.bypassSecurityTrustResourceUrl(SPOTIFY_AUTOPLAY_EMBED_URL);

  readonly isAuthenticated = signal(this.spotify.isAuthenticated());
  readonly isExchanging = signal(false);
  readonly isAdding = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly suggestions = signal<SpotifyTrack[]>([]);
  readonly showSuggestions = signal(false);
  readonly selectedTrack = signal<SpotifyTrack | null>(null);

  readonly songForm = this.fb.nonNullable.group({
    suggestion: ['', [Validators.required, Validators.minLength(1)]],
  });

  ngOnInit(): void {
    // Handle Spotify OAuth callback (?code=...)
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const code = params['code'];
      if (code && !this.spotify.isAuthenticated()) {
        this.isExchanging.set(true);
        this.spotify.exchangeCodeForToken(code).subscribe({
          next: () => {
            this.isAuthenticated.set(true);
            this.isExchanging.set(false);
            // Clean up URL
            this.router.navigate([], { replaceUrl: true });
          },
          error: () => {
            this.isExchanging.set(false);
            this.errorMessage.set('Error al conectar con Spotify. Intenta de nuevo.');
            this.router.navigate([], { replaceUrl: true });
          },
        });
      }
    });

    // Spotify search autocomplete
    this.songForm.controls.suggestion.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(query => {
        const q = query.trim();
        this.selectedTrack.set(null);
        if (q.length < 2 || !this.spotify.isAuthenticated()) {
          this.suggestions.set([]);
          this.showSuggestions.set(false);
          return of([]);
        }
        return this.spotify.searchTracks(q).pipe(catchError(() => of([])));
      })
    ).subscribe(tracks => {
      this.suggestions.set(tracks);
      this.showSuggestions.set(tracks.length > 0);
    });

    this.songForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.successMessage()) this.successMessage.set(null);
      if (this.errorMessage()) this.errorMessage.set(null);
    });
  }

  loginWithSpotify(): void {
    this.spotify.initiateLogin();
  }

  selectSuggestion(track: SpotifyTrack): void {
    this.selectedTrack.set(track);
    this.songForm.controls.suggestion.setValue(`${track.name} - ${track.artists[0]?.name ?? ''}`, { emitEvent: false });
    this.suggestions.set([]);
    this.showSuggestions.set(false);
  }

  hideSuggestions(): void {
    setTimeout(() => this.showSuggestions.set(false), 150);
  }

  onAddSong(): void {
    const track = this.selectedTrack();
    if (!track) {
      this.errorMessage.set('Seleccioná una canción de la lista de sugerencias.');
      return;
    }

    this.isAdding.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.spotify.addTrackToPlaylist(track.uri).subscribe({
      next: () => {
        this.successMessage.set(`"${track.name}" fue agregada a la playlist 🎶`);
        this.songForm.reset({ suggestion: '' });
        this.selectedTrack.set(null);
        this.isAdding.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo agregar la canción. Asegurate de que la playlist sea colaborativa.');
        this.isAdding.set(false);
      },
    });
  }

  logout(): void {
    this.spotify.logout();
    this.isAuthenticated.set(false);
    this.songForm.reset({ suggestion: '' });
  }
}
