import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly title = 'gonzalo';
  protected readonly spotifyPlaylistUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://open.spotify.com/embed/playlist/6IOJDEwrxWtqhVu6YN4POd?utm_source=generator'
  );
}
